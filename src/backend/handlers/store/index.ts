import { REVERSE_PROXY_URI } from "../../constants";
import { store } from '../../../store';
import { randomUUID } from 'crypto';
import { StoreData } from "../../types";
import { app, IpcMainInvokeEvent } from 'electron';
import os from 'os';
import path from 'path';
import fs from 'fs';
// Handlers
export async function getNodesInfo() {
    try {
        const response = await fetch(`${REVERSE_PROXY_URI}/v1/operators/info`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching nodes:', error);
        throw error;
    }
}


export async function getPoints() {
    try {        
        const response = await fetch(`${REVERSE_PROXY_URI}/v1/points`);
        const data = await response.json();

        // if the response is not ok, return -1
        if(response.status !== 200) {
            return {
                points: -1,
            }
        }

        return data;
    } catch (error) {
        return {
            points: -1,
        }
    }
}

export function getStoredClient() {
    // Make sure they are not undefined
    if(
        !store.get('clientId') || 
        !store.get('clientInfo')
    ) {
        return null;
    }

    return {
        clientId: store.get('clientId'),
        clientInfo: store.get('clientInfo')
    };
}

export function storeClientInfo(_: IpcMainInvokeEvent, data: StoreData) {
    store.set('clientId', randomUUID());
    store.set('clientInfo', data.clientInfo);
}

export function getSystemInfo() {
    return {
        platform: os.platform(),
        architecture: os.arch(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        cpuModel: os.cpus()[0].model,
        hostname: os.hostname()
    };
}

export function readServiceLogs(_: IpcMainInvokeEvent, serviceName: string, logType: 'out' | 'err') {
    try {
        const LOG_PATH = app.isPackaged 
            ? path.join(app.getPath('userData'), 'logs')
            : __dirname;

        if (serviceName === 'mobile-node') {
            const mobileLogFile = path.join(LOG_PATH, 'mobile-node.log');
            
            if (!fs.existsSync(mobileLogFile)) {
                return '';
            }

            const maxLines = 1000;
            const fileContent = fs.readFileSync(mobileLogFile, 'utf-8');
            const lines = fileContent.split('\n');
            const lastLines = lines.slice(-maxLines).join('\n');
            
            return lastLines;
        }

        const logFile = path.join(LOG_PATH, `${serviceName}-${logType}.log`);
        
        if (!fs.existsSync(logFile)) {
            return '';
        }

        // Read last 1000 lines or entire file if smaller
        const maxLines = 1000;
        const fileContent = fs.readFileSync(logFile, 'utf-8');
        const lines = fileContent.split('\n');
        const lastLines = lines.slice(-maxLines).join('\n');
        
        return lastLines;
    } catch (error) {
        console.error(`Error reading ${logType} logs for ${serviceName}:`, error);
        throw error;
    }
}

export function deleteStoredClient() {
    store.delete('clientId');
    store.delete('clientInfo');
}