import { app, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import fs from 'fs';

const LOG_PATH = app.isPackaged 
    ? path.join(app.getPath('userData'), 'logs')
    : __dirname;

const MAX_LOG_LINES = 5000; // Threshold for flushing logs

function flushLogFile(logFile: string, content: string) {
    fs.writeFileSync(logFile, content, 'utf-8');
}

export function readServiceLogs(_: IpcMainInvokeEvent, serviceName: string, logType: 'out' | 'err') {
    try {
        if (serviceName === 'mobile-node') {
            const mobileLogFile = path.join(LOG_PATH, 'mobile-node.log');
            
            if (!fs.existsSync(mobileLogFile)) {
                return '';
            }

            const fileContent = fs.readFileSync(mobileLogFile, 'utf-8');
            const lines = fileContent.split('\n');
            
            // Flush if exceeds maximum lines
            if (lines.length > MAX_LOG_LINES) {
                const lastLines = lines.slice(-MAX_LOG_LINES/2).join('\n'); // Keep last half
                flushLogFile(mobileLogFile, lastLines);
                return lastLines;
            }

            const maxLines = 1000;
            return lines.slice(-maxLines).join('\n');
        }

        const logFile = path.join(LOG_PATH, `${serviceName}-${logType}.log`);
        
        if (!fs.existsSync(logFile)) {
            return '';
        }

        const fileContent = fs.readFileSync(logFile, 'utf-8');
        const lines = fileContent.split('\n');

        // Flush if exceeds maximum lines
        if (lines.length > MAX_LOG_LINES) {
            const lastLines = lines.slice(-MAX_LOG_LINES/2).join('\n'); // Keep last half
            flushLogFile(logFile, lastLines);
            return lastLines.slice(-1000); // Return last 1000 lines
        }

        // Read last 1000 lines or entire file if smaller
        const maxLines = 1000;
        return lines.slice(-maxLines).join('\n');
    } catch (error) {
        console.error(`Error reading ${logType} logs for ${serviceName}:`, error);
        throw error;
    }
}
