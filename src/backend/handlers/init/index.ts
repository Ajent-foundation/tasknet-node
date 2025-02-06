import { ServicesConfig } from "../../types";
import { store } from "../../../store";
import { Keypair } from "@solana/web3.js";
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