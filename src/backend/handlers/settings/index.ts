import { Settings, store } from "../../../store";
import { getNodeLimit } from "../system";

// Protected settings - when autoGoLiveOnAppStart is true, these get reset to false
const protectedSettings: Record<string, boolean> = {
    'serverIpOrDomain': true,
    'serverPort': true,
    'v2ServerPort': true,
    'vncIPOrDomain': true,
    'vncProtocol': true,
    'serverVncPort': true,
    'cdpIPOrDomain': true,
    'cdpProtocol': true,
    'serverCdpPort': true,
    'nodeProtocol': true,
    'wsProtocol': true,
    'v2ServerIpOrDomain': true,
    'v2WsProtocol': true,
};

const defaultSettings = {
    // General settings
    autoGoLiveOnAppStart: false,
    
    // Node settings
    nodeProtocol: 'https',
    wsProtocol: 'wss',
    serverIpOrDomain: 'api.tasknet.co',
    serverPort: '443',
    v2ServerPort: '443',
    v2ServerIpOrDomain: 'node.tasknet.co',
    v2WsProtocol: 'wss',
    vncIPOrDomain: 'vnc.tasknet.co',
    cdpIPOrDomain: 'ws.tasknet.co',
    vncProtocol: 'wss',
    cdpProtocol: 'wss',
    serverVncPort: '443',
    serverCdpPort: '443',
    dontConnectOnGoLive: false,
    apiKeyId: '',
    apiKey: '',

    // Browser Container Manager settings
    browserManagerProtocol: 'http',
    browserManagerIpOrDomain: 'localhost',
    browserManagerPort: '8200',
    dontStartBrowserManagerOnGoLive: false,
    numOfBrowser: 4,
    expressPort: '7070',
    vncPort: '15900',
    cdpPort: '19222',
    screenResolution: '1280x2400',
    browserImageName: 'ghcr.io/ajent-foundation/browser-node:latest-brave',
    dockerResources: {
        memory: '',
        cpu: ''
    },

    // Scraper Service settings
    scraperServiceProtocol: 'http',
    scraperServiceIpOrDomain: 'localhost',
    scraperServicePort: '8051',
    dontStartScraperOnGoLive: false,
    openAIKey: '',
    anthropicKey: '',
}

export async function getSettings(): Promise<Settings> {
    const settings = store.get('settings', defaultSettings) as Settings;
    // Get system limit
    const systemLimit = await getNodeLimit();

    if(settings && typeof settings === 'object'){
        return {
            ...defaultSettings,
            ...settings,
            numOfBrowser: Math.min(settings.numOfBrowser || defaultSettings.numOfBrowser, systemLimit)
        }
    } else {
        return defaultSettings
    }
}

export async function updateSettings(_:unknown, newSettings: Partial<Settings>): Promise<Settings> {
    const currentSettings = await getSettings();

    // Filter out keys that don't exist in defaultSettings
    const filteredCurrentSettings = Object.keys(currentSettings).reduce((acc, key) => {
        if (key in defaultSettings) {
            acc[key] = currentSettings[key];
        }
        return acc;
    }, {} as Partial<Settings>);

    const filteredSettings = Object.keys(newSettings).reduce((acc, key) => {
        if (key in defaultSettings) {
            // Convert string boolean values to actual booleans
            const value = newSettings[key];
            if (typeof defaultSettings[key] === 'boolean' && typeof value === 'string') {
                acc[key] = value.toLowerCase() === 'true';
            } else {
                acc[key] = value;
            }
        }
        return acc;
    }, {} as Partial<Settings>);

    const parsedNewSettings = {
        ...filteredSettings,
        // Handle dockerResources if it exists
        ...(filteredSettings.dockerResources && {
            dockerResources: {
                ...filteredCurrentSettings.dockerResources,
                ...filteredSettings.dockerResources
            }
        })
    };
    
    const newUpdatedSettings = { ...filteredCurrentSettings, ...parsedNewSettings };
    store.set('settings', newUpdatedSettings);
    return newUpdatedSettings as Settings;
}

// Initialize settings on app start - reset protected settings to defaults
export async function initializeSettings(): Promise<void> {
    const resetSettings: Partial<Settings> = {};
    
    Object.keys(protectedSettings).forEach(key => {
        resetSettings[key] = defaultSettings[key];
    });
    
    await updateSettings(null, resetSettings);
}