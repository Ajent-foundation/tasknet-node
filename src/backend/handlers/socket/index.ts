import { ServicesConfig } from "../../types";
import { globalState } from "../../../main";
import { store } from "../../../store";
import { app, BrowserWindow, powerSaveBlocker } from "electron";
import { io } from "socket.io-client";
import { getSettings } from "../settings";
import { stopServices, runServices } from "../../../services";
import { getDockerReport, getSystemReport } from "../system";
import WebSocket from 'ws';

const HEARTBEAT_INTERVAL = 5000;
const UPLOAD_TEST_FILE_SIZE = 2 * 1024 * 1024;   // 2MB

// Add heartbeat interval
let heartbeatInterval: NodeJS.Timeout;

// Add power blocker ID tracking
let powerBlockerId: number | null = null;

// Add connection monitoring
let connectionMonitorInterval: NodeJS.Timeout;

export async function connectSocket(
    mainWindow: BrowserWindow
){
    // Clear existing intervals to prevent leaks from multiple connections
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    if (connectionMonitorInterval) {
        clearInterval(connectionMonitorInterval);
    }

    const config = store.get('servicesConfig') as ServicesConfig;
    const settings = await getSettings();
    
    // Kill all services
    try{
        await stopServices();
    } catch(e){
        console.log(e)
    }

    try {
        await runServices();
        if(settings.dontConnectOnGoLive){
            return { status: 'not_connecting' };
        }

        if (globalState.socket?.connected) {
            return { status: 'already_connected' };
        }

        globalState.socket = io(`${settings.wsProtocol}://${settings.serverIpOrDomain}:${settings.serverPort}`, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,  // Prevent exponential backoff from getting too long
            timeout: 10000,              // Connection timeout
            extraHeaders: {
                'X-Api-Key-Id': settings.apiKeyId,
                'X-Api-Key': settings.apiKey
            }
        });
  
        globalState.socket.on('connect', async () => {
            console.log("Socket connected");
            
            // Prevent system sleep when connected
            if (powerBlockerId === null) {
                powerBlockerId = powerSaveBlocker.start('prevent-app-suspension');
                console.log('Power saver blocked to maintain connection');
            }

            globalState.isConnected = true;
            mainWindow?.webContents.send('socket-status', 'connected');

            const fullReport = await getDockerReport();
            // Start heartbeat after connection
            heartbeatInterval = setInterval(() => {
                if (globalState.socket?.connected) {
                    globalState.socket.emit('heartbeat', {
                        fullReport: fullReport,
                    });
                }
            }, HEARTBEAT_INTERVAL);

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
                    const fullReport = await getSystemReport();
                    const browserNumDocker = fullReport.dockerContainers.filter(container => container.image === settings.browserImageName).length
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

            // Start connection monitor
            connectionMonitorInterval = setInterval(() => {
                if (!globalState.socket?.connected && globalState.isConnected) {
                    console.log('Connection monitor: Detected disconnected state, forcing reconnection');
                    globalState.socket?.close();  // Force close the existing socket
                    globalState.socket?.connect(); // Attempt immediate reconnection
                }
            }, 30000); // Check every 30 seconds
        });
  
        globalState.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error: 1', {
                error,
                msg: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : "Unknown stack",
            });
            mainWindow?.webContents.send('socket-status', 'error', error instanceof Error ? error.message : "Unknown error");
        });

        globalState.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected______:', reason);
            
            // Release power blocker on disconnect
            if (powerBlockerId !== null) {
                powerSaveBlocker.stop(powerBlockerId);
                powerBlockerId = null;
                console.log('Power saver blocker released');
            }

            mainWindow?.webContents.send('socket-status', 'disconnected', reason);
            
            // Force immediate reconnection attempt for certain disconnect reasons
            if (
                reason === 'transport close' || 
                reason === 'transport error' || 
                reason === 'ping timeout'
            ) {
                console.log('Forcing immediate reconnection attempt');
                setTimeout(() => {
                    if (globalState.isConnected && !globalState.socket?.connected) {
                        globalState.socket?.connect();
                    }
                }, 1000);
            }
        });

        globalState.socket.on("error", (error, all) => {
            console.error('Socket.IO connection error: 2', {
                error,
                msg: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : "Unknown stack",
                all
            });
        });
  
        globalState.socket.on('reconnect_attempt', (attemptNumber) => {
            mainWindow?.webContents.send('socket-status', `reconnecting:${attemptNumber}`);
        });

        globalState.socket.on('client-id', (clientId) => {
            mainWindow?.webContents.send('socket-status', 'connected', clientId);
        });

        // Add the proxy request handler here
        globalState.socket.on('proxy-request', (message) => {
            console.log("Proxy request received", message);
            const { method, path, body, requestId } = message;
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            };

            fetch(`${settings.scraperServiceProtocol}://${settings.scraperServiceIpOrDomain}${settings.scraperServicePort !== "" ? `:${settings.scraperServicePort}` : ""}${path}`, options)
                .then((response) => {
                    const status = response.status;
                    return response.json().then(data => ({
                        status,
                        data
                    }));
                })
                .then(({ status, data }) => {
                    globalState.socket.emit('proxy-response', {
                        requestId,
                        response: {
                            status,
                            headers: { 'Content-Type': 'application/json' },
                            body: data
                        }
                    });
                })
                .catch((error) => {
                    globalState.socket.emit('proxy-response', {
                        requestId,
                        response: {
                            status: error.status || 500,
                            headers: { 'Content-Type': 'application/json' },
                            body: {
                                success: false,
                                error: 'Unknown error occurred'
                            }
                        }
                    });
                });
        });

        // Handle WebSocket proxy routing
        globalState.socket.on('proxy-ws-connect', async (message) => {
            const { path, requestId } = message;
            let localWs: WebSocket | null = null;
            
            try {
                // First ensure any existing connection with the same requestId is cleaned up
                globalState.socket?.emit(`proxy-ws-close:${requestId}`);
                globalState.socket?.off(`proxy-ws-message:${requestId}`);

                localWs = new WebSocket(`ws://localhost:${settings.scraperServicePort}${path}`);
                const messageBuffer: Buffer[] = [];

                // Set a connection timeout
                const connectionTimeout = setTimeout(() => {
                    if (localWs?.readyState !== WebSocket.OPEN) {
                        localWs?.terminate();
                        globalState.socket?.emit(`proxy-ws-error:${requestId}`, { 
                            error: 'Connection timeout' 
                        });
                    }
                }, 10000); // 10 second timeout

                localWs.on('open', () => {
                    clearTimeout(connectionTimeout);
                    console.log(`Local WebSocket connected for ${path}`);

                    // Process any buffered messages
                    while (messageBuffer.length > 0) {
                        const data = messageBuffer.shift();
                        if (localWs?.readyState === WebSocket.OPEN && data) {
                            localWs.send(data);
                        }
                    }

                    // Forward messages from cloud to local service
                    const handleProxyMessage = (packet: {data: Buffer, type: string}) => {
                        if (localWs?.readyState === WebSocket.OPEN) {
                            localWs.send(packet.type === "utf8" ? packet.data.toString("utf8") : packet.data);
                        } else {
                            messageBuffer.push(packet.data);
                        }
                    };

                    globalState.socket?.on(`proxy-ws-message:${requestId}`, handleProxyMessage);

                    // Forward messages from local service to cloud
                    localWs.on('message', (data) => {
                        if (globalState.socket?.connected) {
                            globalState.socket.emit(`proxy-ws-message:${requestId}`, data);
                        }
                    });

                    // Handle WebSocket closure
                    const cleanup = () => {
                        globalState.socket?.off(`proxy-ws-message:${requestId}`);
                        if (localWs) {
                            if (localWs.readyState === WebSocket.OPEN) {
                                localWs.close();
                            } else if (localWs.readyState === WebSocket.CONNECTING) {
                                localWs.terminate();
                            }
                            localWs = null;
                        }
                    };

                    localWs.on('close', (code, reason) => {
                        console.log(`WebSocket closed - Code: ${code}, Reason: ${reason}`);
                        globalState.socket?.emit(`proxy-ws-close:${requestId}`);
                        cleanup();
                    });

                    localWs.on('error', (error) => {
                        console.error('WebSocket error:', error.message);
                        globalState.socket?.emit(`proxy-ws-error:${requestId}`, { error: error.message });
                        cleanup();
                    });

                    // Notify successful connection
                    globalState.socket?.emit(`proxy-ws-connected:${requestId}`);
                });

                // Handle initial connection errors
                localWs.on('error', (error) => {
                    clearTimeout(connectionTimeout);
                    console.error('WebSocket connection error:', error.message);
                    globalState.socket?.emit(`proxy-ws-error:${requestId}`, { 
                        error: `Failed to connect to local service: ${error.message}` 
                    });
                });
            } catch (error) {
                console.error('WebSocket setup error:', error);
                globalState.socket?.emit(`proxy-ws-error:${requestId}`, { 
                    error: `Failed to establish WebSocket connection: ${error.message}` 
                });
            }
        });

        // Handle WebSocket disconnect request
        globalState.socket.on('proxy-ws-disconnect', (message) => {
            const { requestId } = message;
            globalState.socket?.off(`proxy-ws-message:${requestId}`);
        });

        return { 
            status: 'connected'
        };
    } catch (error) {
        console.error('Failed to connect:', error);
        return { status: 'error', error: error.message };
    }
}
  
export async function  disconnectSocket(){
    console.log("Disconnecting socket")
    globalState.isConnected = false;
    try {
        // Clear all intervals
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null; // Add null assignment
        }
        if (connectionMonitorInterval) {
            clearInterval(connectionMonitorInterval);
            connectionMonitorInterval = null; // Add null assignment
        }

        // Release power blocker
        if (powerBlockerId !== null) {
            powerSaveBlocker.stop(powerBlockerId);
            powerBlockerId = null;
        }

        await stopServices(); // Add await
        if (!globalState.socket) {
            return { status: 'already_disconnected' };
        }

        // Remove all listeners before disconnecting
        globalState.socket.removeAllListeners();
        globalState.socket.disconnect();
        globalState.socket = null;

        return { status: 'disconnected' };
    } catch (error) {
        console.error('Failed to disconnect:', error);
        return { status: 'error', error: error.message };
    }
}

export function isSocketConnected() {
    return globalState.socket?.connected || false;
}