import { app, BrowserWindow, ipcMain, session } from 'electron';
import { GlobalState } from './backend/types';
import { createWindow, createTray } from './backend/app';
import path from 'path';
import { 
    deleteStoredClient, getStoredClient, 
    getSystemInfo, storeClientInfo 
} from './backend/handlers/store';
import { 
    readServiceLogs
} from './backend/handlers/logs';
import { 
    getNodesInfo, getPoints
} from './backend/handlers/api';
import { 
    connectSocket, disconnectSocket, isSocketConnected
} from './backend/handlers/socket';
import { 
    stopServices, getServicesStatus, 
    startMobileNode, killMobileNode, isMobileConnected
} from './services';
import { shell } from 'electron';


import { init } from './backend/handlers/init';
import { checkDocker } from './docker';
import { stopBrowserManager as gracefulShutdownPOC} from './services/browser-cmgr';
import { stopScraper as gracefulShutdownScraper} from './services/scraper-service';
import { getSettings, updateSettings } from './backend/handlers/settings';
import fs from 'fs';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';
updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      host: "https://update.electronjs.org",
      repo: 'Ajent-foundation/tasknet-node'
    },
    updateInterval: '1 hour',
  })

export const globalState: GlobalState = {
    mainWindow: null,
    isConnected: false,
    socket: null,
    tray: null,
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

import { autoUpdater } from 'electron-updater';
import { baseURL } from './services/scraper-service-ts/src/apis/maaas/requests/base';
const logFile = path.join(app.getPath('userData'), 'crash.log');

app.whenReady().then(async () => {
    session.defaultSession.protocol.registerFileProtocol('static', (request, callback) => {
        const fileUrl = request.url.replace('static://', '');
        const filePath = path.join(app.getAppPath(), '.webpack/renderer', fileUrl);
        callback(filePath);
    });
    globalState.mainWindow = createWindow();
    globalState.tray = createTray(globalState.mainWindow, (newWindow) => {
        globalState.mainWindow = newWindow;
    });


    // Github token loading from local file saved in userData
    const tokenPath = path.join(app.getPath('userData'), 'github-token.txt');
    // check if file exists
    if (fs.existsSync(tokenPath)) {
        const token = fs.readFileSync(tokenPath, 'utf8');
        process.env.GH_TOKEN = token;
    } 
    
    // Update the autoUpdater usage
    try {
        const updateCheckResult = await autoUpdater.checkForUpdatesAndNotify();
        console.log('Update check result:', updateCheckResult);
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
});

// Window lifecycle events
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// App lifecycle events
app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        globalState.mainWindow = createWindow();
    }
});


// Add this event handler
app.on('before-quit', () => {
    app.isQuitting = true;
    cleanupProcesses();
});  

async function cleanupProcesses() {
    console.log('Cleaning up processes...');
    await stopServices();
    await killMobileNode();
    
    // Shut down POC
    try{
        await gracefulShutdownPOC()
        await gracefulShutdownScraper()
    } catch (err) {
        console.error('Failed to gracefully shutdown POC', err)
    }
    globalState.socket?.disconnect();
  }

const cleanup = (exitCode: number, reason?: string) => {
    if (reason) console.log(`Shutting down: ${reason}`);
    cleanupProcesses();
    process.exit(exitCode);
};

// Log unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Unhandled Rejection:\n${error}\n`);
});

// Log renderer crashes
app.on('render-process-gone', (event, webContents, details) => {
    fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Renderer Crash:\n${JSON.stringify(details)}\n`);
});

// Cleanup handlers
process.on('SIGINT', () => cleanup(0, 'Received interrupt signal'));
process.on('SIGTERM', () => cleanup(0, 'Received termination signal'));
process.on('uncaughtException', (error) => {
    fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Uncaught Exception:\n${error.stack}\n`);
    console.error('Uncaught Exception:', error);
    cleanup(1);
});

// IPC HANDLERS
ipcMain.handle('get-nodes-info', getNodesInfo);
ipcMain.handle('get-stored-client', getStoredClient);
ipcMain.handle('store-client-info', storeClientInfo);
ipcMain.handle('get-system-info', getSystemInfo);
ipcMain.handle('read-service-logs', readServiceLogs);
ipcMain.handle('delete-stored-client', deleteStoredClient);
ipcMain.handle('connect-socket', () => connectSocket(globalState.mainWindow));
ipcMain.handle('is-connected', isSocketConnected);
ipcMain.handle('disconnect-socket', disconnectSocket);
ipcMain.handle('get-services-health', getServicesStatus);
ipcMain.handle('init', init);
ipcMain.handle('check-docker', checkDocker);
ipcMain.handle('get-settings', getSettings);
ipcMain.handle('update-settings', updateSettings);
ipcMain.handle('get-points',async (_, clientId) => getPoints(clientId));
ipcMain.handle('start-mobile-node', startMobileNode);
ipcMain.handle('kill-mobile-node', killMobileNode);
ipcMain.handle('is-mobile-connected', isMobileConnected);
ipcMain.handle('open-external', async (_, url) => {
    await shell.openExternal(url);
});