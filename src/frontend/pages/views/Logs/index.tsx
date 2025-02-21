import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import Convert from 'ansi-to-html';

export default function View({
    serviceName
}: {
    serviceName: "server" | "controller" | "api" | "mobile-node"
}) : JSX.Element {
    const [logs, setLogs] = useState('');
    const converter = new Convert();
    const serviceIdentifier = 
        serviceName === "server" ? 
            "socket-service" 
            : serviceName === "controller" ? 
                "browsers-service-poc" 
                : serviceName === "mobile-node" ?
                    "mobile-node"
                    : "scraper-service-ts"

  
    // Example: Read output logs for scraper service
    useEffect(() => {
        const readLogs = async (logType: 'out' | 'err') => {
            try {
                const logContent = await window.electronAPI.readServiceLogs(serviceIdentifier, logType);
                //console.log("Log content", logContent);
                const htmlLogs = converter.toHtml(logContent);
                setLogs(htmlLogs);
            } catch (error) {
                console.error('Failed to read logs:', error);
            }
        };

        // Initial fetch
        readLogs('out');

        // Set up interval to fetch logs every 10 seconds
        const intervalId = setInterval(() => {
            readLogs('out');
        }, 10000);

      // Cleanup interval on component unmount
      return () => clearInterval(intervalId);
    }, [serviceName, serviceIdentifier, setLogs]);

    return (
        <Box
            padding="16px"
            sx={{
                bgcolor: "#1A1A1E",
                borderRadius: "4px",
                color: 'white',
                height:"730px",
                width:"100%",
                fontFamily: 'monospace',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                boxSizing: "border-box"
            }}
            dangerouslySetInnerHTML={{ __html: logs }}
        />
    )
}