import { app } from "electron"
import { main, shutdown } from "./browser-cmgr-ts/src"
import path from "path"
import fs from "fs"

const BASE_LOGS_PATH = app.isPackaged 
? path.join(app.getPath('userData'), 'logs')
: __dirname;

const POC_LOG_FILE = path.join(BASE_LOGS_PATH, "browsers-service-poc-out.log")

export async function startPOC(numOfBrowser: number){

    try{
        console.log("Starting POC with", numOfBrowser, "browsers")
        process.env.NUM_BROWSERS = `${numOfBrowser}`
        await main("Prod", POC_LOG_FILE)
    } catch(e){
        // Add error to poc log
        fs.appendFileSync(POC_LOG_FILE, `\n[${new Date().toISOString()}] Error: ${e.stack}\n`);
        return e
    }
}

export async function stopPOC(){
    try{
        await shutdown()
    } catch(e){
        // Add error to poc log
        fs.appendFileSync(POC_LOG_FILE, `\n[${new Date().toISOString()}] Error: ${e.stack}\n`);    
        return e
    }
}