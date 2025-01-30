import { ServicesConfig } from "../../types";
import { store } from "../../../store";
import { Keypair } from "@solana/web3.js";
import fs from 'fs';
import { exec } from 'child_process';
import { app } from "electron";

export async function init() {
    let config = store.get('servicesConfig') as ServicesConfig;
    if (!config) {
        // Default config
        const keypair = Keypair.generate();
        config = { 
            publicKey: keypair.publicKey.toBase58(),
            privateKey: keypair.secretKey.toString()
        };
    } else {
        if (!config.publicKey || !config.privateKey) {
            const keypair = Keypair.generate();
            config = { 
                ...config,
                publicKey: keypair.publicKey.toBase58(),
                privateKey: keypair.secretKey.toString()
            };
        }
    }

    store.set('servicesConfig', config);
    return {
        ...config,
        version: app.getVersion()
    };
}

export async function checkDocker(): Promise<boolean> {
    const dockerPaths = process.platform === 'darwin' 
        ? [
            '/usr/local/bin/docker',
            '/opt/homebrew/bin/docker',
            '/Applications/Docker.app/Contents/Resources/bin/docker'
        ]
        : process.platform === 'linux'
        ? [
            '/usr/bin/docker',
            '/usr/local/bin/docker'
        ]
        : [
            'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe',
            'C:\\Program Files\\Docker\\Docker\\resources\\docker.exe'
        ];

    // First check if Docker exists
    const dockerExists = dockerPaths.some(path => fs.existsSync(path));
    if (!dockerExists) {
        return false;
    }

    // Then check if Docker daemon is running
    return new Promise((resolve) => {
        const dockerPath = dockerPaths.find(path => fs.existsSync(path));
        exec(`"${dockerPath}" info`, (error) => {
            resolve(!error);
        });
    });
}