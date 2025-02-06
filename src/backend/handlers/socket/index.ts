import { ServicesConfig } from "../../types";
import { globalState } from "../../../main";
import { store } from "../../../store";
import { app, BrowserWindow } from "electron";
import { io } from "socket.io-client";
import { getSettings } from "../settings";
import { stopServices, forceKillAtPort, runServices } from "../../../services";
import WebSocket from 'ws';

export async function connectSocket(
    mainWindow: BrowserWindow
){
    const config = store.get('servicesConfig') as ServicesConfig;
    const settings = getSettings();
    
    // Kill all services
    try{
        await stopServices();
        await forceKillAtPort(parseInt(settings.browserManagerPort));
        await forceKillAtPort(parseInt(settings.scraperServicePort));
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
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            extraHeaders: {
                'X-Api-Key-Id': settings.apiKeyId,
                'X-Api-Key': settings.apiKey
            }
        });
  
        globalState.socket.on('connect', () => {
            console.log("Socket connected");
            mainWindow?.webContents.send('socket-status', 'connected');
        });
  
        globalState.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            mainWindow?.webContents.send('socket-status', 'error');
        });
  
        globalState.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            mainWindow?.webContents.send('socket-status', 'disconnected');
        });
  
        globalState.socket.on('reconnect_attempt', (attemptNumber) => {
            mainWindow?.webContents.send('socket-status', `reconnecting:${attemptNumber}`);
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
  
        // Self Register
        const clientId = store.get('clientId');
        const clientInfo = store.get('clientInfo');
        if(clientId && clientInfo) {  
            globalState.socket.emit('register', { 
                clientId,
                clientInfo,
                publicKey: config.publicKey,
                version: app.getVersion(),
                numOfBrowsers: typeof settings.numOfBrowser === 'string' ? parseInt(settings.numOfBrowser) : settings.numOfBrowser
            });
        } else {
          throw new Error("Client ID or client info not found");
        }
  
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
    try {
        stopServices();
        if (!globalState.socket) {
            return { status: 'already_disconnected' };
        }

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