import { app } from "electron"
import path from "path"
import { main, shutdown } from "./scraper-service-ts/src"
import fs from "fs"

const BASE_LOGS_PATH = app.isPackaged 
    ? path.join(app.getPath('userData'), 'logs')
    : __dirname;

const SCRAPER_LOG_FILE = path.join(BASE_LOGS_PATH, "scraper-service-ts-out.log")

export async function startScraper(
    openAIKey?: string,
    anthropicKey?: string
){


    try{
        await main("Prod", {
            EXPRESS_PORT: "8051",
            OPENAI_API_KEY: openAIKey,
            ANTHROPIC_API_KEY: anthropicKey
        }, SCRAPER_LOG_FILE)
    } catch(e){
        // Add error to poc log
        fs.appendFileSync(SCRAPER_LOG_FILE, `\n[${new Date().toISOString()}] Error: ${e.stack}\n`);
        return e
    }
}

export async function stopScraper(){
    try{
        await shutdown()
    } catch(e){
        // Add error to poc log
        fs.appendFileSync(SCRAPER_LOG_FILE, `\n[${new Date().toISOString()}] Error: ${e.stack}\n`);
        return e
    }
}