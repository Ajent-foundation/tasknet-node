import { ServicesConfig } from "../../types";
import { globalState } from "../../../main";
import { store } from "../../../store";
import { app, BrowserWindow } from "electron";
import { io } from "socket.io-client";
import { getSettings } from "../settings";
import { stopServices, runServices } from "../../../services";
import { getSystemReport } from "../system";
import WebSocket from 'ws';

const HEARTBEAT_INTERVAL = 5000;
const UPLOAD_TEST_FILE_SIZE = 2 * 1024 * 1024;   // 2MB

// Add heartbeat interval
let heartbeatInterval: NodeJS.Timeout;

export async function connectSocket(
    mainWindow: BrowserWindow
){
    const config = store.get('servicesConfig') as ServicesConfig;
    const settings = getSettings();
    
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
            extraHeaders: {
                'X-Api-Key-Id': settings.apiKeyId,
                'X-Api-Key': settings.apiKey
            }
        });
  
        globalState.socket.on('connect', async () => {
            console.log("Socket connected");
            globalState.isConnected = true;
            mainWindow?.webContents.send('socket-status', 'connected');

            // Start heartbeat after connection
            heartbeatInterval = setInterval(() => {
                if (globalState.socket?.connected) {
                    globalState.socket.emit('heartbeat');
                }
            }, HEARTBEAT_INTERVAL);

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
                    globalState.socket.emit('register', { 
                        clientId,
                        clientInfo: clientInfo,
                        publicKey: config.publicKey,
                        version: app.getVersion(),
                        fullReport: await getSystemReport(),
                        numOfBrowsers: typeof settings.numOfBrowser === 'string' ? parseInt(settings.numOfBrowser) : settings.numOfBrowser
                    });
                }
            } else {
                throw new Error("Client ID or client info not found");
            }
        });
  
        globalState.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            mainWindow?.webContents.send('socket-status', 'error');
        });
  
        globalState.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            mainWindow?.webContents.send('socket-status', 'disconnected');
            if(globalState.isConnected){
                globalState.socket?.connect();
            }
        });

        globalState.socket.on("error", (error) => {
            console.error('Socket.IO connection error:', error);
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
        // Upcoming feature
        /*
        globalState.socket.on('proxy-ws-connect', async (message) => {
            const { path, requestId } = message;
            try {
                // Create WebSocket connection to local service
                const localWs = new WebSocket(`ws://localhost:8051${path}`);
                
                localWs.on('open', () => {
                    console.log(`Local WebSocket connected for ${path}`);
                    
                    // Forward messages from cloud to local service
                    globalState.socket?.on(`proxy-ws-message:${requestId}`, (data) => {
                        if (localWs.readyState === WebSocket.OPEN) {
                            localWs.send(JSON.stringify(data));
                        }
                    });

                    // Forward messages from local service to cloud
                    localWs.on('message', (data) => {
                        globalState.socket?.emit(`proxy-ws-message:${requestId}`, JSON.parse(data.toString()));
                    });

                    // Handle WebSocket closure
                    localWs.on('close', () => {
                        globalState.socket?.emit(`proxy-ws-close:${requestId}`);
                        globalState.socket?.off(`proxy-ws-message:${requestId}`);
                    });

                    // Handle WebSocket errors
                    localWs.on('error', (error) => {
                        globalState.socket?.emit(`proxy-ws-error:${requestId}`, { error: error.message });
                    });

                    // Notify successful connection
                    globalState.socket?.emit(`proxy-ws-connected:${requestId}`);
                });

                // Handle initial connection errors
                localWs.on('error', (error) => {
                    globalState.socket?.emit(`proxy-ws-error:${requestId}`, { 
                        error: `Failed to connect to local service: ${error.message}` 
                    });
                });
            } catch (error) {
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
        */

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
        stopServices();
        if (!globalState.socket) {
            return { status: 'already_disconnected' };
        }

        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }

        globalState.socket.removeAllListeners('heartbeat');
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