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
            onSocketStatus: (callback: (status: string) => void) => void;
            getStoredClient: () => Promise<StoreData>;
            storeClientInfo: (clientInfo: StoreData) => Promise<void>;
            getSystemInfo: () => Promise<StoreData['clientInfo']>;
            isConnected: () => Promise<boolean>;
            readServiceLogs: (serviceName: string, logType: 'out' | 'err') => Promise<string>;
            getServicesHealth: () => Promise<{service: string, isRunning: boolean}[]>;
            getServicesStatus: () => Promise<any>;
            checkDocker: () => Promise<boolean>;
            init: () => Promise<{publicKey: string, privateKey: string, version: string}>;
            getSettings: () => Promise<Settings>;
            updateSettings: (newSettings: Partial<Settings>) => Promise<Settings>;
            getPoints: () => Promise<{points: number}>;
            startMobileNode: () => Promise<void>;
            killMobileNode: () => Promise<void>;
            isMobileConnected: () => Promise<boolean>;
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