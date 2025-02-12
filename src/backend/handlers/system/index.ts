import si from "systeminformation"

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


