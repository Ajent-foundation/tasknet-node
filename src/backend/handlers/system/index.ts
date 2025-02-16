import si from "systeminformation"
import { getSettings } from "../settings";
export async function getSystemReport() {
    try {
        // Collect system information, cpu, memory, disk, network, etc.
        const systemInfo = await si.system();
        const cpuInfo = await si.cpu();
        const memoryInfo = await si.mem();
        const diskInfo = await si.fsSize();
        const networkInfo = await si.networkInterfaces();
        const gpuInfo = await si.graphics();
        const osInfo = await si.osInfo();
        const dockerInfo = await si.dockerInfo();
        const dockerContainers = await si.dockerContainers(true);
        
        return {
            systemInfo,
            cpuInfo,
            memoryInfo,
            diskInfo,
            networkInfo,
            gpuInfo,
            osInfo,
            dockerInfo,
            dockerContainers
        }
    } catch (error) {
        console.error('Error getting system report:', error);
        return null
    }
}

export async function getDockerReport() {
    try {
        const dockerInfo = await si.dockerInfo();
        const dockerContainers = await si.dockerContainers(true);
        
        return {
            dockerInfo,
            dockerContainers
        }
    } catch (error) {
        console.error('Error getting system report:', error);
        return null
    }
}


export async function getNodeLimit() {
    try {
        const cpuInfo = await si.cpu();
        const memInfo = await si.mem();

        // Calculate limits based on CPU cores and available memory
        // CPU: Each browser needs 0.2 cores minimum
        const cpuLimit = Math.floor(cpuInfo.cores * 0.8 / 0.2); // Using 80% of available cores

        // Memory: Each browser needs 800MB minimum
        const memoryLimitMB = Math.floor((memInfo.available / (1024 * 1024)) * 0.8); // Available memory in MB, using 80%
        const memoryLimit = Math.floor(memoryLimitMB / 800); // Number of browsers based on memory

        // Return the lower of the two limits
        return Math.min(cpuLimit, memoryLimit);
    } catch (error) {
        return 1;
    }
}

export async function getCurrentNumOfBrowsers() {
    try {
        const settings = await getSettings();
        const dockerContainers = await si.dockerContainers(true);
        return dockerContainers.filter(container => container.image === settings.browserImageName).length;
    } catch (error) {
        console.error('Error getting current number of browsers:', error);
        return 0;
    }
}   
