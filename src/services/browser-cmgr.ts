import { app } from "electron"
import { main, shutdown } from "./browser-cmgr-ts/src"
import path from "path"
import fs from "fs"

const BASE_LOGS_PATH = app.isPackaged 
? path.join(app.getPath('userData'), 'logs')
: __dirname;

const POC_LOG_FILE = path.join(BASE_LOGS_PATH, "browsers-service-poc-out.log")

export async function startBrowserManager(
    numOfBrowser: number, 
    additionalDockerArgs: Record<string, string>,
    config: {
        expressPort?: string,
        appPort?: string,
        vncPort?: string,
        cdpPort?: string,
        screenResolution?: string,
        browserImageName?: string
    } = {}
){
    try {
        // Set environment variables from config
        process.env.NUM_BROWSERS = `${numOfBrowser}`
        process.env.EXPRESS_PORT = config.expressPort || "8200"
        process.env.BASE_BROWSER_APP_PORT = config.appPort || "7070"
        process.env.BASE_BROWSER_VNC_PORT = config.vncPort || "15900"
        process.env.BASE_BROWSER_PORT = config.cdpPort || "19222"
        process.env.SCREEN_RESOLUTION = config.screenResolution || "1280x2400"
        process.env.BROWSER_IMAGE_NAME = config.browserImageName || "ghcr.io/ajent-foundation/browser-node:latest-brave"
        
        await main("Prod", POC_LOG_FILE, additionalDockerArgs, true)
    } catch(e){
        // Add error to poc log
        fs.appendFileSync(POC_LOG_FILE, `\n[${new Date().toISOString()}] Error: ${e.stack}\n`);
        return e
    }
}

export async function stopBrowserManager(){
    try{
        await shutdown()
    } catch(e){
        // Add error to poc log
        fs.appendFileSync(POC_LOG_FILE, `\n[${new Date().toISOString()}] Error: ${e.stack}\n`);    
        return e
    }
}