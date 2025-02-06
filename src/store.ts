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
    // Node settings
    nodeProtocol: string;
    wsProtocol: string;
    serverIpOrDomain: string;
    serverPort: string;
    dontConnectOnGoLive: boolean;
    apiKeyId: string;
    apiKey: string;

    // Browser Container Manager settings
    browserManagerProtocol: string;
    browserManagerIpOrDomain: string;
    browserManagerPort: string;
    dontStartBrowserManagerOnGoLive: boolean;
    numOfBrowser: number;
    expressPort: string;
    vncPort: string;
    cdpPort: string;
    screenResolution: string;
    browserImageName: string;
    dockerResources: {
        memory: string;
        cpu: string;
    };

    // Scraper Service settings
    scraperServiceProtocol: string;
    scraperServiceIpOrDomain: string;
    scraperServicePort: string;
    dontStartScraperOnGoLive: boolean;
    openAIKey: string;
    anthropicKey: string;
}

export const store = new Store();