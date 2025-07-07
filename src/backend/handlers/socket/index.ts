import { ServicesConfig } from "../../types";
import { globalState } from "../../../main";
import { store } from "../../../store";
import { app, BrowserWindow, powerSaveBlocker } from "electron";
import { io } from "socket.io-client";
import { getSettings } from "../settings";
import { stopServices, runServices } from "../../../services";
import { getSystemReport } from "../system";
import axios from "axios";
import path from "path";
import { pino } from 'pino'
import { getDockerContainersCountByImageName } from "../../../docker";
import { ProxyManager } from "./ProxyManager";

const UPLOAD_TEST_FILE_SIZE = 2 * 1024 * 1024;   // 2MB

const BASE_LOGS_PATH = app.isPackaged 
    ? path.join(app.getPath('userData'), 'logs')
    : __dirname;

const POC_LOG_FILE = path.join(BASE_LOGS_PATH, "socket-service-out.log")

const Logger = pino({
    level: 'info',
}, pino.multistream([
    { stream: process.stdout },
    ...(POC_LOG_FILE ? [
        { stream: pino.destination({
            dest: POC_LOG_FILE,
            sync: false,  // Set to true if you need synchronous writes
            mkdir: true   // Create directory if it doesn't exist
        })}
    ] : [])
]))

// Add at the top of the file after imports
const responseCache = new Map<string, {
    response: {
        status: number,
        data: unknown,
        headers: Record<string, string>
    },
    timestamp: number
}>();

const CACHE_DURATION = 60 * 1000; 

// Add power blocker ID tracking
let powerBlockerId: number | null = null;

// Add connection monitoring
let connectionMonitorInterval: NodeJS.Timeout;

// Add proxy manager
let proxyManager: ProxyManager | null = null;

export async function connectSocket(
    mainWindow: BrowserWindow
){
    Logger.info('Attempting to connect socket');
    // Clear existing intervals to prevent leaks from multiple connections
    if (connectionMonitorInterval) {
        clearInterval(connectionMonitorInterval);
    }

    const config = store.get('servicesConfig') as ServicesConfig;
    const settings = await getSettings();
    
    // Kill all services
    try{
        await stopServices();
    } catch(e){
    }

    try {
        await runServices();
        if(settings.dontConnectOnGoLive){
            Logger.info('Not connecting due to dontConnectOnGoLive setting');
            return { status: 'not_connecting' };
        }

        if (globalState.socket?.connected) {
            Logger.info('Socket already connected');
            return { status: 'already_connected' };
        }

        // Initialize proxy manager
        Logger.info(`Initializing proxy manager with clientId ${store.get('clientId')}`);
        proxyManager = new ProxyManager(store.get('clientId') as string);
        await proxyManager.connectAll();

        Logger.info(`Connecting to socket with protocol ${settings.wsProtocol} and domain ${settings.serverIpOrDomain} and port ${settings.serverPort}`);
        globalState.socket = io(`${settings.wsProtocol}://${settings.serverIpOrDomain}:${settings.serverPort}`, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,  // Prevent exponential backoff from getting too long
            timeout: 10000,              // Connection timeout
            extraHeaders: {
                'X-Api-Key-Id': settings.apiKeyId,
                'X-Api-Key': settings.apiKey
            },
            transports: ['websocket']
        });
  
        globalState.socket.on('connect', async () => {            
            Logger.info('Socket connected successfully');
            // Prevent system sleep when connected
            if (powerBlockerId === null) {
                powerBlockerId = powerSaveBlocker.start('prevent-app-suspension');
            }

            globalState.isConnected = true;
            mainWindow?.webContents.send('socket-status', 'connected');

            // Start connection monitor after successful connection
            connectionMonitorInterval = setInterval(() => {
                if (!globalState.socket?.connected && globalState.isConnected) {
                    globalState.socket?.close();  // Force close the existing socket
                    globalState.socket?.connect(); // Attempt immediate reconnection
                }

                // Check proxy connections
                if (proxyManager) {
                    const connectedProxies = proxyManager.getConnectedProxies();
                    if (connectedProxies.length === 0) {
                        Logger.warn('No proxies connected, attempting to reconnect all');
                        proxyManager.connectAll();
                    }
                }
            }, 5000); // Check every 5 seconds

            // Remove any existing listeners before adding new ones to prevent duplicates
            globalState.socket?.removeAllListeners('test-bandwidth');
            globalState.socket?.removeAllListeners('bandwidth-download-test');

            // Handle bandwidth test requests
            globalState.socket.on('test-bandwidth', () => {
                try {
                    // First, request download test
                    if (globalState.socket) globalState.socket.emit('bandwidth-download-test-request');

                    // Then perform upload test
                    const uploadPayload = '0'.repeat(UPLOAD_TEST_FILE_SIZE);
                    if (globalState.socket) globalState.socket.emit('bandwidth-upload-test', { payload: uploadPayload, startedOn: new Date().getTime() });
                } catch (error) {
                    console.error('Bandwidth test failed:', error);
                }
            });

            globalState.socket.on('send-heartbeat', () => {
                if (globalState.socket) globalState.socket.emit('heartbeat-1.8');
            });

            // Handle download test
            globalState.socket.on('bandwidth-download-test', (data: { payload: string }) => {
                // Simulate download by receiving the payload
                if (globalState.socket) globalState.socket.emit('bandwidth-download-test-complete', { startedOn: new Date().getTime() });
            });

            // Self Register
            const clientId = store.get('clientId');
            const clientInfo = store.get('clientInfo');
            if(clientId && clientInfo) {  
                if(globalState.socket){
                    Logger.debug({ msg: 'Registering client' });
                    const fullReport = await getSystemReport();
                    
                    const browserNumDocker = await getDockerContainersCountByImageName(settings.browserImageName)
                    globalState.socket.emit('register', { 
                        clientId,
                        clientInfo: clientInfo,
                        publicKey: config.publicKey,
                        version: app.getVersion(),
                        fullReport: fullReport,
                        numOfBrowsers: browserNumDocker
                    });
                }
            } else {
                throw new Error("Client ID or client info not found");
            }
        });
  
        globalState.socket.on('connect_error', (error) => {
            Logger.error({
                msg: 'Socket.IO connection error',
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : "Unknown stack"
            });
            mainWindow?.webContents.send('socket-status', 'error', error instanceof Error ? error.message : "Unknown error");
        });

        globalState.socket.on('disconnect', (reason) => {
            Logger.info({ msg: 'Socket disconnected', reason });
            responseCache.clear();
            
            // Release power blocker on disconnect
            if (powerBlockerId !== null) {
                powerSaveBlocker.stop(powerBlockerId);
                powerBlockerId = null;
            }

            mainWindow?.webContents.send('socket-status', 'disconnected', reason);
            
            // Force immediate reconnection attempt for certain disconnect reasons
            if (
                reason === 'transport close' || 
                reason === 'transport error' || 
                reason === 'ping timeout'
            ) {
                setTimeout(() => {
                    if (globalState.isConnected && !globalState.socket?.connected) {
                        Logger.debug({ msg: 'Socket reconnecting' });
                        globalState.socket?.connect();
                    }
                }, 1000);
            }
        });

        globalState.socket.on("error", (error, all) => {
            Logger.error({
                msg: 'Socket.IO error',
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : "Unknown stack",
                all
            });
        });
  
        globalState.socket.on('reconnect_attempt', (attemptNumber) => {
            Logger.debug({ msg: 'Socket reconnect attempt', attemptNumber });
            mainWindow?.webContents.send('socket-status', `reconnecting:${attemptNumber}`);
        });

        globalState.socket.on('client-id', (clientId) => {
            mainWindow?.webContents.send('socket-status', 'connected', clientId);
        });

        // Add the proxy request handler here
        globalState.socket.on('proxy-request', async (message, ack ) => {
            Logger.debug({ msg: 'Received proxy request', requestId: message.requestId, path: message.path });
            // Initialize tracking variables at the start
            let retryCount = 0;
            const maxRetries = 5;
            let responseReceived = false;

            // Acknowledge receipt immediately
            if (ack) ack();

            // Wait for socket connection
            const waitForSocketConnection = async (timeoutMs = 5000): Promise<boolean> => {
                if (globalState.socket?.connected) return true;
                
                return new Promise((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (globalState.socket?.connected) {
                            clearInterval(checkInterval);
                            clearTimeout(timeout);
                            resolve(true);
                        }
                    }, 100);

                    const timeout = setTimeout(() => {
                        clearInterval(checkInterval);
                        resolve(false);
                    }, timeoutMs);
                });
            };

            // Send proxy response
            const sendProxyResponse = async (response: { status: number, data: unknown, headers: Record<string, string> }) => {
                if (responseReceived) {
                    return;
                }
                
                const isConnected = await waitForSocketConnection();
                if (!isConnected) {
                    throw new Error("Socket connection failed");
                }

                try {
                    // Cache all responses regardless of status
                    responseCache.set(requestId, {
                        response,
                        timestamp: Date.now()
                    });

                    // Set timeout to clear this specific cache entry after CACHE_DURATION
                    setTimeout(() => {
                        responseCache.delete(requestId);
                    }, CACHE_DURATION);
                    
                    await new Promise((resolve, reject) => {
                        globalState.socket?.emit('proxy-response', {
                            requestId,
                            response: {
                                status: response.status,
                                headers: response.headers,
                                body: response.data
                            }
                        }, (acknowledgement:  { success: boolean, requestId: string, timestamp: number }) => {
                            responseReceived = true;
                            resolve(acknowledgement);
                        });

                        setTimeout(() => reject(new Error('Acknowledgment timeout')), 10000);
                    });
                } catch (error) {
                    throw error;
                }
            };

            // Make request
            const makeRequest = async () => {
                try {
                    const response = await axios({
                        method,
                        url,
                        data: body,
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 30000,
                        validateStatus: (_) => true,
                    });

                     // Convert headers to a simple Record<string, string>
                    const normalizedHeaders = Object.entries(response.headers).reduce((acc, [key, value]) => {
                        acc[key] = Array.isArray(value) ? value.join(', ') : String(value);
                        return acc;
                    }, {} as Record<string, string>);

                    await sendProxyResponse({
                        status: response.status,
                        data: response.data,
                        headers: normalizedHeaders
                    });
                    return true;
                } catch (error) {
                    if (axios.isAxiosError(error)) {
                        await sendProxyResponse({
                            status: 500,
                            data: {
                                success: false,
                                error: 'Max retries reached'
                            },
                            headers: {}
                        });
                        return true;
                    }
                    throw error;
                }
            };

            // Attempt request with retry   
            const attemptRequestWithRetry = async () => {
                while (retryCount < maxRetries && !responseReceived) {
                    retryCount++;
                    
                    try {
                        const success = await makeRequest();
                        if (success) return;
                    } catch (error) {
                        if (retryCount === maxRetries) {
                            await sendProxyResponse({
                                status: 500,
                                data: {
                                    success: false,
                                    error: 'Max retries reached'
                                },
                                headers: {}
                            });
                            return;
                        }
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            };

            // Handle overall timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Overall timeout reached'));
                }, 30000);
            });
            
            // Check cache first
            const { method, path, body, requestId } = message;
            const cachedResponse = responseCache.get(requestId);
            if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_DURATION) {
                await sendProxyResponse(cachedResponse.response);
                return;
            }

            const url = `${settings.scraperServiceProtocol}://${settings.scraperServiceIpOrDomain}${settings.scraperServicePort !== "" ? `:${settings.scraperServicePort}` : ""}${path}`;

            try {
                await Promise.race([
                    attemptRequestWithRetry(),
                    timeoutPromise
                ]);
            } catch (error) {
                if (!responseReceived) {
                    await sendProxyResponse({
                        status: 504,
                        data: {
                            success: false,
                            error: 'Gateway Timeout - Request took too long to complete'
                        },
                        headers: {}
                    });
                }
            }
        });
        
        return { 
            status: 'connected'
        };
    } catch (error) {
        Logger.error({
            msg: 'Failed to connect socket',
            error: error instanceof Error ? error.message : "Unknown error"
        });
        return { status: 'error', error: error instanceof Error ? error.message : String(error) };
    }
}
  
export async function  disconnectSocket(){
    Logger.info('Attempting to disconnect socket');
    globalState.isConnected = false;
    try {
        if (connectionMonitorInterval) {
            clearInterval(connectionMonitorInterval);
            connectionMonitorInterval = null; // Add null assignment
        }

        // Release power blocker
        if (powerBlockerId !== null) {
            powerSaveBlocker.stop(powerBlockerId);
            powerBlockerId = null;
        }

        // Disconnect all proxies
        if (proxyManager) {
            await proxyManager.disconnectAll();
            proxyManager = null;
        }

        await stopServices(); // Add await
        if (!globalState.socket) {
            return { status: 'already_disconnected' };
        }

        // Remove all listeners before disconnecting
        globalState.socket.removeAllListeners();
        globalState.socket.disconnect();
        globalState.socket = null;

        Logger.info('Socket disconnected successfully');
        return { status: 'disconnected' };
    } catch (error) {
        Logger.error({
            msg: 'Failed to disconnect socket',
            error: error instanceof Error ? error.message : "Unknown error"
        });
        return { status: 'error', error: error instanceof Error ? error.message : String(error) };
    }
}

export function isSocketConnected() {
    return globalState.socket?.connected || false;
}