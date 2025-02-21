import { contextBridge, ipcRenderer, Settings } from 'electron';
import { StoreData } from './store';

contextBridge.exposeInMainWorld('electronAPI', {
    getNodesInfo: () => ipcRenderer.invoke('get-nodes-info'),
    connectSocket: () => ipcRenderer.invoke('connect-socket'),
    disconnectSocket: () => ipcRenderer.invoke('disconnect-socket'),
    onSocketStatus: (
        callback: (status: string, data: {clientId: string}) => void) => {
            ipcRenderer.on('socket-status', (_event, status, data) => callback(status, data)
        );
    },
    getStoredClient: () => ipcRenderer.invoke('get-stored-client'),
    deleteStoredClient: () => ipcRenderer.invoke('delete-stored-client'),
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    storeClientInfo: (clientInfo: StoreData) => ipcRenderer.invoke('store-client-info', clientInfo),
    isConnected: () => ipcRenderer.invoke('is-connected'),
    readServiceLogs: (serviceName: string, logType: 'out' | 'err') => ipcRenderer.invoke('read-service-logs', serviceName, logType),
    getServicesHealth: () => ipcRenderer.invoke('get-services-health'),
    checkDocker: () => ipcRenderer.invoke('check-docker'),
    init: () => ipcRenderer.invoke('init'),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    updateSettings: (newSettings: Partial<Settings>) => ipcRenderer.invoke('update-settings', newSettings),
    getPoints: (clientId: string) => ipcRenderer.invoke('get-points', clientId),
    startMobileNode: () => ipcRenderer.invoke('start-mobile-node'),
    killMobileNode: () => ipcRenderer.invoke('kill-mobile-node'),
    isMobileConnected: () => ipcRenderer.invoke('is-mobile-connected'),
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
    getNodeLimit: () => ipcRenderer.invoke('met-my-node-limit'),
    getCurrentNumOfBrowsers: () => ipcRenderer.invoke('get-current-num-of-browsers'),
    getCachedClientId: () => ipcRenderer.invoke('get-cached-client-id'),
    cacheClientId: (clientId: string) => ipcRenderer.invoke('cache-client-id', clientId),
    platform: process.platform,
});
