import { store } from '../../../store';
import { randomUUID } from 'crypto';
import { StoreData } from "../../types";
import { IpcMainInvokeEvent } from 'electron';
import os from 'os';

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
        cpuCores: os.cpus().length,
        cpuSpeed: os.cpus()[0].speed,
        hostname: os.hostname()
    };
}

export function deleteStoredClient() {
    store.delete('clientId');
    store.delete('clientInfo');
}