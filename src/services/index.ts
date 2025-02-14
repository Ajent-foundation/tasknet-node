import { getSettings } from "../backend/handlers/settings";
import { startBrowserManager, stopBrowserManager } from './browser-cmgr';
import { startScraper, stopScraper } from './scraper-service';
import { runMobileDockerContainer, isDockerInstalled, pullMobileDockerImage, killMobileDockerContainer, getMobileNodeConnectedDevices } from "./mobile";
import { spawn } from "child_process";

export const services = ['scraper-service-ts','browsers-cmgr-ts'];

// Helper function to check if service is running
async function checkServiceRunning(
    service: string, 
    attempts: number = 30
): Promise<boolean> {
    const settings = await getSettings();

    // Wait for service to be responsive (adjust timeout as needed)
    for (let i = 0; i < attempts; i++) {
        try {
            if (service === 'browsers-cmgr-ts') {
                const response = await fetch(
                    `${settings.browserManagerProtocol}://${settings.browserManagerIpOrDomain}:${settings.browserManagerPort}`
                );
                if (response.ok) return true;
            } else if (service === 'scraper-service-ts') {
                const response = await fetch(
                    `${settings.scraperServiceProtocol}://${settings.scraperServiceIpOrDomain}:${settings.scraperServicePort}`
                );
                if (response.ok) return true;
            }
        } catch (error) {
            // Service not ready yet, continue waiting
            continue
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
};

export async function getServicesStatus() {
    const statusPromises = services.map(async service => ({
        service,
        isRunning: await checkServiceRunning(service, 1) // Using 1 attempt for quick status check
    }));
    
    return Promise.all(statusPromises);
}

// Function to run all services
export async function runServices(): Promise<{
    results: {
        service: string;
        success: boolean;
        error?: string;
    }[];
}> {
    const settings = await getSettings();

    // RUNNING SERVICES
    const startupResults = await Promise.all(
        services.map(async service => {
            try {
                if(service === 'browsers-cmgr-ts'){
                    if(!settings.dontStartBrowserManagerOnGoLive){      
                        await startBrowserManager(
                            settings.numOfBrowser || 4,
                            Object.fromEntries(
                                Object.entries(settings.dockerResources).filter(([key, value]) => value !== '')
                            ),
                            {
                                expressPort: settings.browserManagerPort,
                                appPort: settings.expressPort,
                                vncPort: settings.vncPort,
                                cdpPort: settings.cdpPort,
                                screenResolution: settings.screenResolution,
                                browserImageName: settings.browserImageName
                            }
                        )
                    }
                } else if (service === 'scraper-service-ts'){
                    if(!settings.dontStartScraperOnGoLive){
                        await startScraper(
                            settings.browserManagerProtocol + "://" + settings.browserManagerIpOrDomain + ":" + settings.browserManagerPort,
                            settings?.openAIKey,
                            settings?.anthropicKey
                        )
                    }
                }
        
                return { service, success: true };
            } catch (error) {
                console.error(`Failed to start ${service}:`, error);
                return { service, success: false, error };
            }
        }
    ));

    return {
        results: startupResults
    };
}  

// Function to stop all services
export async function stopServices(): Promise<void> {
    services.forEach(async service => {
        if(service === 'browsers-cmgr-ts'){
            await stopBrowserManager()
        } else if (service === 'scraper-service-ts'){
            await stopScraper()
        }
    })
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