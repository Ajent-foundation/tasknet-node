import Store from 'electron-store';

export interface StoreData {
    clientId: string;
    clientInfo: {
        platform: string;
        architecture: string;
        freeMemory: number;
        totalMemory: number;
        cpuModel: string;
        hostname: string;
    };
}

export interface Settings {
    openAIKey:string,
    anthropicKey:string,
    mobileNodeKey:string
    numOfBrowser: number
}

export const store = new Store();