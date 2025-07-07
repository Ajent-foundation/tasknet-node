import { io, Socket } from "socket.io-client";
import WebSocket from 'ws';
import axios from "axios";
import { pino } from 'pino';
import path from "path";
import { app } from "electron";

interface ProxySocketConfig {
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
    logLevel?: 'info' | 'debug' | 'error' | 'warn';
    logFile?: string;
}

interface ProxyResponse {
    status: number;
    data: unknown;
    headers: Record<string, string>;
}

export default class ProxySocket {
    private socket: Socket | null = null;
    private logger: pino.Logger;
    private responseCache: Map<string, { response: ProxyResponse; timestamp: number }> = new Map();
    private readonly CACHE_DURATION = 60 * 1000; // 1 minute
    private readonly MAX_RETRIES = 5;
    private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
    private readonly WS_CONNECTION_TIMEOUT = 10000; // 10 seconds
    private path: string;

    constructor(private config: ProxySocketConfig) {
        this.path = config.path;
        // Setup logging
        const logFile = config.logFile || path.join(
            app.isPackaged ? app.getPath('userData') : __dirname,
            `${config.name}-proxy.log`
        );

        this.logger = pino({
            level: config.logLevel || 'info',
        }, pino.multistream([
            { stream: process.stdout },
            { stream: pino.destination({
                dest: logFile,
                sync: false,
                mkdir: true
            })}
        ]));
    }

    public async connect(nodeId: string): Promise<{ status: string; error?: string }> {
        try {
            this.logger.info('Attempting to connect proxy socket');

            if (this.socket?.connected) {
                this.logger.info('Socket already connected');
                return { status: 'already_connected' };
            }

            this.socket = io(this.config.url + "?nodeId=" + nodeId, {
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000,
                extraHeaders: {
                    ...(this.config.apiKeyId && { 'X-Api-Key-Id': this.config.apiKeyId }),
                    ...(this.config.apiKey && { 'X-Api-Key': this.config.apiKey })
                },
                transports: ['websocket'],
            });

            this.setupSocketListeners();
            return { status: 'connected' };
        } catch (error) {
            this.logger.error({
                msg: 'Failed to connect proxy socket',
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return { 
                status: 'error', 
                error: error instanceof Error ? error.message : String(error) 
            };
        }
    }

    public async disconnect(): Promise<{ status: string; error?: string }> {
        try {
            this.logger.info('Attempting to disconnect proxy socket');
            
            if (!this.socket) {
                return { status: 'already_disconnected' };
            }

            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.responseCache.clear();

            this.logger.info('Socket disconnected successfully');
            return { status: 'disconnected' };
        } catch (error) {
            this.logger.error({
                msg: 'Failed to disconnect socket',
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return { 
                status: 'error', 
                error: error instanceof Error ? error.message : String(error) 
            };
        }
    }

    private setupSocketListeners(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this.logger.info('Socket connected successfully');
        });

        this.socket.on('connect_error', (error) => {
            this.logger.error({
                msg: 'Socket connection error',
                error: error instanceof Error ? error.message : "Unknown error"
            });
        });

        this.socket.on('disconnect', (reason) => {
            this.logger.info({ msg: 'Socket disconnected', reason });
            this.responseCache.clear();
        });

        // Setup proxy request handler
        this.socket.on('proxy-request', async (message, ack) => {
            if (this.config.disableProtocols?.http || this.config.disableProtocols?.https) {
                this.logger.warn('HTTP/HTTPS proxy requests are disabled');
                return;
            }

            this.logger.debug({ 
                msg: 'Received proxy request', 
                requestId: message.requestId, 
                path: message.path 
            });

            if (ack) ack();
            await this.handleProxyRequest(message);
        });

        // Setup WebSocket proxy handler
        this.socket.on('proxy-ws-connect', async (message) => {
            if (this.config.disableProtocols?.ws && this.config.disableProtocols?.wss) {
                this.logger.warn('WS/WSS proxy requests are disabled');
                return;
            }

            this.logger.debug({ 
                msg: 'WebSocket proxy connect request', 
                requestId: message.requestId 
            });
            await this.handleWebSocketProxy(message);
        });
    }

    private async handleProxyRequest(message: any): Promise<void> {
        const { method, path, body, requestId } = message;
        let retryCount = 0;
        let responseReceived = false;

        // Check cache first
        const cachedResponse = this.responseCache.get(requestId);
        if (cachedResponse && (Date.now() - cachedResponse.timestamp) < this.CACHE_DURATION) {
            await this.sendProxyResponse(requestId, cachedResponse.response);
            return;
        }

        const makeRequest = async () => {
            try {
                const response = await axios({
                    method,
                    url: path,
                    data: body,
                    headers: { 'Content-Type': 'application/json' },
                    timeout: this.REQUEST_TIMEOUT,
                    validateStatus: (_) => true,
                });

                const normalizedHeaders = Object.entries(response.headers).reduce((acc, [key, value]) => {
                    acc[key] = Array.isArray(value) ? value.join(', ') : String(value);
                    return acc;
                }, {} as Record<string, string>);

                const proxyResponse = {
                    status: response.status,
                    data: response.data,
                    headers: normalizedHeaders
                };

                // Cache the response
                this.responseCache.set(requestId, {
                    response: proxyResponse,
                    timestamp: Date.now()
                });

                await this.sendProxyResponse(requestId, proxyResponse);
                return true;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    await this.sendProxyResponse(requestId, {
                        status: 500,
                        data: { success: false, error: 'Request failed' },
                        headers: {}
                    });
                    return true;
                }
                throw error;
            }
        };

        // Attempt request with retries
        while (retryCount < this.MAX_RETRIES && !responseReceived) {
            retryCount++;
            try {
                await makeRequest();
                break;
            } catch (error) {
                if (retryCount === this.MAX_RETRIES) {
                    await this.sendProxyResponse(requestId, {
                        status: 500,
                        data: { success: false, error: 'Max retries reached' },
                        headers: {}
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private async handleWebSocketProxy(message: any): Promise<void> {
        const { requestId, sessionId } = message;
        let localWs: WebSocket | null = null;
        const incomingMessageBuffer: Buffer[] = [];
        const outgoingMessageBuffer: Buffer[] = [];
        
        try {
            // Cleanup any existing connection
            this.socket?.emit(`proxy-ws-close:${requestId}`);
            this.socket?.off(`proxy-ws-message:${requestId}`);

            localWs = new WebSocket(this.path + sessionId);

            const connectionTimeout = setTimeout(() => {
                if (localWs?.readyState !== WebSocket.OPEN) {
                    localWs?.terminate();
                    this.socket?.emit(`proxy-ws-error:${requestId}`, { 
                        error: 'Connection timeout' 
                    });
                }
            }, this.WS_CONNECTION_TIMEOUT);

            localWs.on('open', () => {
                clearTimeout(connectionTimeout);

                // Process any buffered incoming messages
                while (incomingMessageBuffer.length > 0) {
                    const data = incomingMessageBuffer.shift();
                    if (localWs?.readyState === WebSocket.OPEN && data) {
                        localWs.send(data);
                    }
                }

                // Process any buffered outgoing messages
                while (outgoingMessageBuffer.length > 0) {
                    const data = outgoingMessageBuffer.shift();
                    if (this.socket?.connected && data) {
                        this.socket.emit(`proxy-ws-message:${requestId}`, data);
                    }
                }

                // Forward messages from cloud to local service
                const handleProxyMessage = (packet: {data: Buffer, type: string, service: string}) => {
                    // DEBUG LOG - REMOVE LATER
                    console.log(`🔵 PROXY_CLOUD_TO_LOCAL [${requestId}] | Length: ${packet.data.length} | Type: ${packet.type} | Data: ${packet.data.toString()}`)
                    
                    if (localWs?.readyState === WebSocket.OPEN) {
                        localWs.send(packet.type === "utf8" ? packet.data.toString("utf8") : packet.data);
                        //localWs.send(packet.data)
                    } else {
                        incomingMessageBuffer.push(packet.data);
                    }
                };

                this.socket?.on(`proxy-ws-message:${requestId}`, handleProxyMessage);

                // Forward messages from local service to cloud
                localWs.on('message', (data: WebSocket.RawData) => {
                    // DEBUG LOG - REMOVE LATER
                    console.log(`🔵 PROXY_LOCAL_TO_CLOUD [${requestId}] | Data: ${data.toString()}`)
                    
                    if (this.socket?.connected) {
                        this.socket.emit(`proxy-ws-message:${requestId}`, data);
                    } else {
                        // Convert RawData to Buffer
                        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as unknown as Buffer);
                        outgoingMessageBuffer.push(buffer);
                    }
                });

                // Handle WebSocket closure
                const cleanup = () => {
                    this.socket?.off(`proxy-ws-message:${requestId}`);
                    if (localWs) {
                        if (localWs.readyState === WebSocket.OPEN) {
                            localWs.close();
                        } else if (localWs.readyState === WebSocket.CONNECTING) {
                            localWs.terminate();
                        }
                        localWs = null;
                    }
                };

                localWs.on('close', () => {
                    this.socket?.emit(`proxy-ws-close:${requestId}`);
                    cleanup();
                });

                localWs.on('error', (error) => {
                    this.socket?.emit(`proxy-ws-error:${requestId}`, { error: error.message });
                    cleanup();
                });

                // Notify successful connection
                this.socket?.emit(`proxy-ws-connected:${requestId}`);
                this.socket?.emit(`proxy-ws-ready:${requestId}`);
            });

            // Handle initial connection errors
            localWs.on('error', (error) => {
                clearTimeout(connectionTimeout);
                this.logger.error('WebSocket connection error:', error.message);
                this.socket?.emit(`proxy-ws-error:${requestId}`, { 
                    error: `Failed to connect to local service: ${error.message}` 
                });
            });
        } catch (error) {
            this.logger.error('WebSocket setup error:', error);
            this.socket?.emit(`proxy-ws-error:${requestId}`, { 
                error: `Failed to establish WebSocket connection: ${error instanceof Error ? error.message : String(error)}` 
            });
        }
    }

    private async sendProxyResponse(requestId: string, response: ProxyResponse): Promise<void> {
        if (!this.socket?.connected) {
            throw new Error("Socket connection failed");
        }

        try {
            await new Promise((resolve, reject) => {
                this.socket?.emit('proxy-response', {
                    requestId,
                    response: {
                        status: response.status,
                        headers: response.headers,
                        body: response.data
                    }
                }, (acknowledgement: { success: boolean, requestId: string, timestamp: number }) => {
                    resolve(acknowledgement);
                });

                setTimeout(() => reject(new Error('Acknowledgment timeout')), 10000);
            });
        } catch (error) {
            this.logger.error('Failed to send proxy response:', error);
            throw error;
        }
    }

    public isConnected(): boolean {
        return this.socket?.connected || false;
    }
} 