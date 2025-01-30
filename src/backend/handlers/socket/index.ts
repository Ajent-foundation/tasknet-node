import { ServicesConfig, ServicesState } from "../../types";
import { globalState } from "../../../main";
import { store } from "../../../store";
import { spawn, exec } from "child_process";
import { arch } from "os";
import path from "path";
import fs from "fs";
import { app, BrowserWindow } from "electron";
import { io } from "socket.io-client";
import { REVERSE_PROXY_URI } from "../../constants";
import { startPOC, stopPOC } from '../../../services/browser-cmgr';
import { startScraper, stopScraper } from '../../../services/scraper-service';
import { getSettings } from "../settings/getSettings";
import { runMobileDockerContainer, isDockerInstalled, pullMobileDockerImage, killMobileDockerContainer, getMobileNodeConnectedDevices } from "../../../services/mobile";
// Helper function to check if service is running
async function checkServiceRunning(service: string, attempts: number = 30): Promise<boolean> {
    // Wait for service to be responsive (adjust timeout as needed)
    for (let i = 0; i < attempts; i++) {
        try {
            if (service === 'browsers-service-poc') {
                const response = await fetch('http://localhost:8200');
                if (response.ok) return true;
            } else if (service === 'scraper-service-ts') {
                const response = await fetch('http://localhost:8051');
                if (response.ok) return true;
            }
        } catch (error) {
            // Service not ready yet, continue waiting
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
};

async function findDockerExecutable(): Promise<string | null> {
    const dockerPaths = process.platform === 'darwin' 
        ? [
            '/usr/local/bin/docker',
            '/opt/homebrew/bin/docker',
            '/Applications/Docker.app/Contents/Resources/bin/docker'
        ]
        : process.platform === 'linux'
        ? [
            '/usr/bin/docker',
            '/usr/local/bin/docker'
        ]
        : [
            'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe',
            'C:\\Program Files\\Docker\\Docker\\resources\\docker.exe'
        ];

    for (const dockerPath of dockerPaths) {
        if (fs.existsSync(dockerPath)) {
            return dockerPath;
        }
    }
    return null;
}


// Function to run all services
async function runServices() {
    const architecture = arch();
    const platform = process.platform;
    const services = ['scraper-service-ts','browsers-service-poc']; // Add mobile service here

    // DOCKER CHECK
    let hasSpawned = false;
    let imageLoadResolution: { isSuccess: boolean, message: string };
    const imagePrefix = architecture === 'arm64' ? 'arm64' : 'amd64';
    const imagePath = process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '..', '..' ,'assets', `node-image-${imagePrefix}.tar`)
        : path.join(app.getAppPath(), '..', '..', 'Resources', `node-image-${imagePrefix}.tar`);
    
    // SHOULD NEVER HAPPEN
    if (!fs.existsSync(imagePath)) {
        throw new Error(`Docker image not found for ${imagePrefix} architecture: ${imagePath}`);
    }

    // Update the Docker check code:
    const dockerPath = await findDockerExecutable();
    const imageExists = await new Promise((resolve) => {
        if (!dockerPath) {
            console.error('Docker not found in standard locations');
            resolve(false);
            return;
        }

        exec(`"${dockerPath}" images browser-node-ts --quiet`, (error, stdout) => {
            resolve(!!stdout.trim());
        });
    });

    // LOAD IMAGE
    if (!imageExists) {
        hasSpawned = true;
        imageLoadResolution = await new Promise((resolve) => {
            if (!dockerPath) {
                resolve({
                    isSuccess: false,
                    message: 'Docker not found. Please ensure Docker is installed in a standard location',
                });
                return;
            }
    
            exec(`"${dockerPath}" load -i "${imagePath}"`, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        isSuccess: false,
                        message: `Error loading Docker image: ${stderr}`,
                    });
                } else {
                    resolve({
                        isSuccess: true,
                        message: stdout,
                    });
                }
            });
        });
    
        if (!imageLoadResolution.isSuccess) {
            console.error(imageLoadResolution.message);
            // Don't throw error, continue with other services
        }
    }
    const archSuffix = arch() === 'arm64' ? 'arm64' : 'x64';
    const settings = getSettings();
    // RUNNING SERVICES
    const startupResults = await Promise.all(
        services.map(async service => {
            try {
                if(service === 'browsers-service-poc'){
                    await startPOC(
                        settings ? (settings.numOfBrowser || 4) : 4
                    )
                } else if (service === 'scraper-service-ts'){
                    await startScraper(
                        settings?.openAIKey,
                        settings?.anthropicKey
                    )
                }
    
                // Update initial state
                globalState.servicesState[service as keyof ServicesState] = {
                    pid: undefined, // subprocess.pid,
                    isRunning: false // Will be set to true only after confirmation
                };
    
                // Wait for service to be actually running
                const isRunning = await checkServiceRunning(service);
                if (!isRunning) {
                    throw new Error(`Service ${service} failed to start within timeout`);
                }
    
                // Update final state
                globalState.servicesState[service as keyof ServicesState].isRunning = true;
                store.set('servicesState', globalState.servicesState);
    
                // subprocess.on('exit', (code) => {
                //     console.log(`${service} exited with code ${code}`);
                //     globalState.servicesState[service as keyof ServicesState].isRunning = false;
                //     store.set('servicesState', globalState.servicesState);
                // });
    
                return { service, success: true };
            } catch (error) {
                console.error(`Failed to start ${service}:`, error);
                return { service, success: false, error };
            }
        }
    ));

    // Store state after all services are started
    store.set('servicesState', globalState.servicesState);
    return {
        hasSpawned,
        dockerOutput: imageLoadResolution,
        servicesStatus: startupResults
    };
}  

// Run async services
// Stop async services

// Function to stop all services
export async function stopServices(): Promise<void> {
    Object.entries(
        globalState.servicesState
    ).forEach(async ([service, config]) => {
        if(service === 'browsers-service-poc'){
            await stopPOC()
        } else if (service === 'scraper-service-ts'){
            await stopScraper()
        }
        globalState.servicesState[service as keyof ServicesState].isRunning = false;
    });
    
    store.set('servicesState', globalState.servicesState);
}

export async function forceKillAtPort(port: number) {
    return new Promise((resolve, reject) => {
        const subprocess = process.platform === 'win32'
            ? spawn('cmd', ['/c', `netstat -ano | findstr :${port} | findstr LISTENING && FOR /F "tokens=5" %p in ('netstat -ano | findstr :${port} | findstr LISTENING') do taskkill /F /PID %p`], { shell: true })
            : spawn('sh', ['-c', `lsof -i:${port} | grep LISTEN | awk '{print $2}' | xargs -r kill -9`]);

        subprocess.on('exit', (code) => {
            console.log(`Force killed process at port ${port} with code ${code}`);
            resolve(code);
        });
        
        subprocess.on('error', (err) => {
            console.error(`Error killing process at port ${port}:`, err);
            reject(err);
        });
    });
}

export async function connectSocket(
    mainWindow: BrowserWindow
){
    try{
        await stopServices();
        console.log("Services stopped");
        await forceKillAtPort(8051);
        await forceKillAtPort(8200);
    } catch(e){
        console.log(e)
    }

    let config = store.get('servicesConfig') as ServicesConfig;
    const currentSettings = getSettings();

    try {
        const result = await runServices();
        if (globalState.socket?.connected) {
            return { status: 'already_connected' };
        }

        globalState.socket = io(REVERSE_PROXY_URI, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
  
        globalState.socket.on('connect', () => {
            console.log("Socket connected");
            mainWindow?.webContents.send('socket-status', 'connected');
        });
  
        globalState.socket.on('connect_error', (error) => {
            mainWindow?.webContents.send('socket-status', 'error');
            console.error('Socket.IO connection error:', error);
        });
  
        globalState.socket.on('disconnect', (reason) => {
            mainWindow?.webContents.send('socket-status', 'disconnected');
            console.log('Socket disconnected:', reason);
        });
  
        globalState.socket.on('reconnect_attempt', (attemptNumber) => {
            mainWindow?.webContents.send('socket-status', `reconnecting:${attemptNumber}`);
        });
  
        // Add the proxy request handler here
        globalState.socket.on('proxy-request', (message) => {
            const { method, path, body, requestId } = message;
            console.log("Proxy request received", message);

            const options = {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            };

            fetch(`http://localhost:8051${path}`, options)
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
  
        // Self Register
        const clientId = store.get('clientId');
        const clientInfo = store.get('clientInfo');
        if(clientId && clientInfo) {  
          globalState.socket.emit('register', { 
            clientId,
            clientInfo,
            publicKey: config.publicKey,
            version: app.getVersion(),
            apiKey: currentSettings.mobileNodeKey,
            numOfBrowser: currentSettings.numOfBrowser
          });
        } else {
          throw new Error("Client ID or client info not found");
        }
  
        return { status: 'connecting', debug:{
          result,
          imagePath: process.env.NODE_ENV === 'development'
            ? path.join(__dirname, '..', '..' ,'assets', `node-image-${"*"}.tar`)
            : path.join(app.getAppPath(), '..', '..', 'Resources', `node-image-${"*"}.tar`)
        } };
    } catch (error) {
        console.error('Failed to connect:', error);
        return { status: 'error', error: error.message };
    }
}
  
export async function  disconnectSocket(){
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

export async function getServicesStatus() {
    const services = ['scraper-service-ts', 'browsers-service-poc'];
    console.log("Checking services status", services);
    const statusPromises = services.map(async service => ({
        service,
        isRunning: await checkServiceRunning(service, 1) // Using 1 attempt for quick status check
    }));
    
    return Promise.all(statusPromises);
}


export async function startMobileNode() {
    /*
    try {
        const settings = getSettings();
        const mobileNodeApiKey = settings?.mobileNodeKey;
        console.log("Starting mobile node with api key:", settings);
        if (!mobileNodeApiKey) {
            console.error("Mobile Node API key not set");
            return false;
        }

        const dockerInstalled = await isDockerInstalled();
        if (!dockerInstalled) {
            console.error("Docker is not installed or not running.");
            return false;
        }
        await killMobileDockerContainer();
        await pullMobileDockerImage();
        return await runMobileDockerContainer(mobileNodeApiKey);
    } catch (error) {
        console.error("Error running Mobile Node:", error);
        return false;
    }
    */
}

export async function killMobileNode() {
    /*
    try {
        await killMobileDockerContainer();
        return true;
    } catch (error) {
        console.error("Error killing Mobile Node:", error);
        return false;
    }
        */
}

export async function isMobileConnected() {
    return false
    try {
        const result = await getMobileNodeConnectedDevices();
        return !result.error;
    } catch (error) {
        return false;
    }
}

export async function updateMobileNodeApiKey(apiKey: string) {
    const settings = getSettings();
    settings.mobileNodeKey = apiKey;
    store.set('settings', settings);
}