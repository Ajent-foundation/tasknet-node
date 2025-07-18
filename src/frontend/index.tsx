import { createRoot } from 'react-dom/client';
import { Settings, StoreData } from '../store';
import HomePage from './pages/index';

// window API types
declare global {
    interface Window {
        electronAPI: {
            deleteStoredClient: () => Promise<void>;
            getNodesInfo: () => Promise<any>;
            connectSocket: () => Promise<void>;
            disconnectSocket: () => Promise<void>;
            onSocketStatus: (callback: (status: string, data: {clientId: string}) => void) => void;
            getStoredClient: () => Promise<StoreData>;
            storeClientInfo: (clientInfo: StoreData) => Promise<void>;
            getSystemInfo: () => Promise<StoreData['clientInfo']>;
            isConnected: () => Promise<boolean>;
            readServiceLogs: (serviceName: string, logType: 'out' | 'err' | "proxy") => Promise<string>;
            getServicesHealth: () => Promise<{service: string, isRunning: boolean}[]>;
            getServicesStatus: () => Promise<any>;
            checkDocker: () => Promise<boolean>;
            init: () => Promise<{publicKey: string, privateKey: string, version: string}>;
            getSettings: () => Promise<Settings>;
            updateSettings: (newSettings: Partial<Settings>) => Promise<Settings>;
            getPoints: (clientId: string) => Promise<{points: number}>;
            startMobileNode: () => Promise<void>;
            killMobileNode: () => Promise<void>;
            isMobileConnected: () => Promise<boolean>;
            openExternal: (url: string) => Promise<void>;
            getNodeLimit: () => Promise<number>;
            getCurrentNumOfBrowsers: () => Promise<number>;
            getCachedClientId: () => Promise<string>;
            cacheClientId: (clientId: string) => Promise<void>;
            platform: string;
        }
    }
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<HomePage />);
} else {
    console.error('Root container not found');
}