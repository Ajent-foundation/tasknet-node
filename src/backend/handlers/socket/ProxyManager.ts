import ProxySocket from './Proxy';
import { pino } from 'pino';
import path from "path";
import { app } from "electron";
import { getSettings } from '../settings';

interface ProxyConfig {
    name: string;
    url: string;
    path: string;
    apiKeyId?: string;
    apiKey?: string;
    disableProtocols?: {
        http?: boolean;
        https?: boolean;
        ws?: boolean;
        wss?: boolean;
    };
}

interface ProxyConnection {
    proxy: ProxySocket;
    reconnectAttempts: number;
    lastReconnectAttempt: number;
    reconnectTimeout?: NodeJS.Timeout;
}

export class ProxyManager {
    private proxies: Map<string, ProxyConnection> = new Map();
    private logger: pino.Logger;
    private readonly DEFAULT_RECONNECT_INTERVAL = 5000; // 5 seconds
    private readonly MAX_RECONNECT_ATTEMPTS = 10;
    private readonly RECONNECT_COOLDOWN = 30000; // 30 seconds cooldown between reconnect attempts
    private readonly CONNECTION_CHECK_INTERVAL = 5000; // 5 seconds
    private connectionCheckInterval?: NodeJS.Timeout;
    private nodeId: string;
    private isFullyConnected: boolean = false;

    constructor(nodeId: string) {
        this.nodeId = nodeId;

        // Setup logging
        const logFile = path.join(
            app.isPackaged ? app.getPath('userData') : __dirname,
            'socket-service.log'
        );

        this.logger = pino({
            level: 'info',
        }, pino.multistream([
            { stream: process.stdout },
            { stream: pino.destination({
                dest: logFile,
                sync: false,
                mkdir: true
            })}
        ]));

        // Initialize proxies
        this.initializeProxies();
        this.startConnectionCheck();
    }

    private async initializeProxies(): Promise<void> {
        const settings = await getSettings();

        const baseURL = `${settings.scraperServiceProtocol}://${settings.scraperServiceIpOrDomain}${settings.scraperServicePort !== "" ? `:${settings.scraperServicePort}` : ""}`;

        // Add your proxy configurations here
        const proxyConfigs: ProxyConfig[] = [
            {
                name: 'node-server',
                url: settings.v2WsProtocol + '://' + settings.v2ServerIpOrDomain + ':' + settings.v2ServerPort,
                apiKeyId: settings.apiKeyId,
                apiKey: settings.apiKey,
                path: '/',
                disableProtocols: {
                    http: true,
                    https: false,
                    ws: true,
                    wss: true
                }
            },
            {
                name: 'cdp-proxy',
                url: settings.cdpProtocol + '://' + settings.cdpIPOrDomain + ':' + settings.serverCdpPort,
                apiKeyId: settings.apiKeyId,
                apiKey: settings.apiKey,
                // TODO - change
                path: baseURL + "/ws/",
                disableProtocols: {
                    http: true,
                    https: true,
                    ws: true,
                    wss: false
                }
            },
            {
                name: 'vnc-proxy',
                url: settings.vncProtocol + '://' + settings.vncIPOrDomain + ':' + settings.serverCdpPort,
                apiKeyId: settings.apiKeyId,
                apiKey: settings.apiKey,
                path: baseURL + "/vnc/",
                disableProtocols: {
                    http: true, 
                    https: true,
                    ws: true,
                    wss: false
                }
            }
        ];

        // Create proxy instances
        for (const config of proxyConfigs) {
            this.logger.info({ config }, 'Adding proxy');
            this.addProxy(config);
        }
    }

    private startConnectionCheck(): void {
        this.connectionCheckInterval = setInterval(() => {
            this.checkConnections();
        }, this.CONNECTION_CHECK_INTERVAL);
    }

    private async checkConnections(): Promise<void> {
        for (const [name, connection] of this.proxies) {
            if (!connection.proxy.isConnected()) {
                this.logger.warn({ name }, 'Proxy disconnected, attempting to reconnect');
                await this.reconnectProxy(name);
            }
        }
    }

    public addProxy(config: ProxyConfig): void {
        if (this.proxies.has(config.name)) {
            this.logger.warn({ name: config.name }, 'Proxy already exists');
            return;
        }

        const proxy = new ProxySocket(config);
        this.proxies.set(config.name, {
            proxy,
            reconnectAttempts: 0,
            lastReconnectAttempt: 0
        });
        this.logger.info({ name: config.name }, 'Proxy added');
    }

    public async connectAll(): Promise<void> {
        this.logger.info('Attempting to connect all proxies');
        this.isFullyConnected = false;
        
        for (const [name, connection] of this.proxies) {
            try {
                const result = await connection.proxy.connect(this.nodeId);
                this.logger.info({ 
                    name, 
                    status: result.status 
                }, 'Proxy connection result');
            } catch (error) {
                this.logger.error({
                    name,
                    error: error instanceof Error ? error.message : "Unknown error"
                }, 'Failed to connect proxy');
                await this.reconnectProxy(name);
            }
        }

        // Check if all proxies are connected
        const allConnected = Array.from(this.proxies.values()).every(connection => connection.proxy.isConnected());
        this.isFullyConnected = allConnected;
        
        if (allConnected) {
            this.logger.info('All proxies connected successfully');
        }
    }

    public async disconnectAll(): Promise<void> {
        this.logger.info('Attempting to disconnect all proxies');
        this.isFullyConnected = false;
        
        // Clear connection check interval
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
            this.connectionCheckInterval = undefined;
        }

        // Clear all reconnect timeouts
        for (const [name, connection] of this.proxies) {
            if (connection.reconnectTimeout) {
                clearTimeout(connection.reconnectTimeout);
            }
        }
        
        for (const [name, connection] of this.proxies) {
            try {
                const result = await connection.proxy.disconnect();
                this.logger.info({ 
                    name, 
                    status: result.status 
                }, 'Proxy disconnection result');
            } catch (error) {
                this.logger.error({
                    name,
                    error: error instanceof Error ? error.message : "Unknown error"
                }, 'Failed to disconnect proxy');
            }
        }
    }

    public getProxy(name: string): ProxySocket | undefined {
        return this.proxies.get(name)?.proxy;
    }

    public isProxyConnected(name: string): boolean {
        const connection = this.proxies.get(name);
        return connection?.proxy.isConnected() || false;
    }

    public getConnectedProxies(): string[] {
        return Array.from(this.proxies.entries())
            .filter(([_, connection]) => connection.proxy.isConnected())
            .map(([name]) => name);
    }

    public async reconnectProxy(name: string): Promise<void> {
        const connection = this.proxies.get(name);
        if (!connection) {
            this.logger.warn({ name }, 'Proxy not found');
            return;
        }

        const now = Date.now();
        const timeSinceLastAttempt = now - connection.lastReconnectAttempt;
        
        if (timeSinceLastAttempt < this.RECONNECT_COOLDOWN) {
            this.logger.debug({ 
                name, 
                timeSinceLastAttempt 
            }, 'Skipping reconnect due to cooldown');
            return;
        }

        if (connection.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            this.logger.error({ 
                name, 
                attempts: connection.reconnectAttempts 
            }, 'Max reconnect attempts reached');
            return;
        }

        // Clear any existing reconnect timeout
        if (connection.reconnectTimeout) {
            clearTimeout(connection.reconnectTimeout);
        }

        connection.reconnectAttempts++;
        connection.lastReconnectAttempt = now;

        this.logger.info({ 
            name, 
            attempt: connection.reconnectAttempts 
        }, 'Scheduling proxy reconnect');

        connection.reconnectTimeout = setTimeout(async () => {
            try {
                await connection.proxy.disconnect();
                const result = await connection.proxy.connect(this.nodeId);
                
                if (result.status === 'connected') {
                    this.logger.info({ name }, 'Proxy reconnected successfully');
                    connection.reconnectAttempts = 0;
                } else {
                    this.logger.warn({ 
                        name, 
                        status: result.status 
                    }, 'Proxy reconnect failed');
                    await this.reconnectProxy(name);
                }
            } catch (error) {
                this.logger.error({
                    name,
                    error: error instanceof Error ? error.message : "Unknown error"
                }, 'Failed to reconnect proxy');
                await this.reconnectProxy(name);
            }
        }, this.DEFAULT_RECONNECT_INTERVAL);
    }

    public isConnected(): boolean {
        return this.isFullyConnected;
    }
} 