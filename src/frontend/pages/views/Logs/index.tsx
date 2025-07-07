import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, useTheme, Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { format } from 'date-fns';

interface LogEntry {
    timestamp?: string;
    level?: number | 'info' | 'error' | 'warn' | 'debug';
    message: string;
    data?: any;
    isJson: boolean;
}

interface LogViewerProps {
    serviceName?: "server" | "controller" | "api" | "mobile-node" | "vnc-proxy" | "cdp-proxy" | "node-server";
}

const LogLine: React.FC<{ entry: LogEntry }> = ({ entry }): JSX.Element => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const getLevelColor = (level?: number | string) => {
        // Handle numeric levels (Pino format)
        if (typeof level === 'number') {
            switch (level) {
                case 60: return '#ff4d4f'; // fatal
                case 50: return '#ff4d4f'; // error
                case 40: return '#faad14'; // warn
                case 30: return '#52c41a'; // info
                case 20: return '#1890ff'; // debug
                case 10: return '#722ed1'; // trace
                default: return '#52c41a';
            }
        }
        // Handle string levels (fallback)
        switch (level) {
            case 'error': return '#ff4d4f';
            case 'warn': return '#faad14';
            case 'debug': return '#1890ff';
            default: return '#52c41a';
        }
    };

    const getLevelBackground = (level?: number | string) => {
        // Handle numeric levels (Pino format)
        if (typeof level === 'number') {
            switch (level) {
                case 60: return 'rgba(255, 77, 79, 0.1)'; // fatal
                case 50: return 'rgba(255, 77, 79, 0.1)'; // error
                case 40: return 'rgba(250, 173, 20, 0.1)'; // warn
                case 30: return 'rgba(82, 196, 26, 0.1)'; // info
                case 20: return 'rgba(24, 144, 255, 0.1)'; // debug
                case 10: return 'rgba(114, 46, 209, 0.1)'; // trace
                default: return 'rgba(82, 196, 26, 0.1)';
            }
        }
        // Handle string levels (fallback)
        switch (level) {
            case 'error': return 'rgba(255, 77, 79, 0.1)';
            case 'warn': return 'rgba(250, 173, 20, 0.1)';
            case 'debug': return 'rgba(24, 144, 255, 0.1)';
            default: return 'rgba(82, 196, 26, 0.1)';
        }
    };

    const getLevelLabel = (level?: number | string) => {
        // Handle numeric levels (Pino format)
        if (typeof level === 'number') {
            switch (level) {
                case 60: return 'FATAL';
                case 50: return 'ERROR';
                case 40: return 'WARN';
                case 30: return 'INFO';
                case 20: return 'DEBUG';
                case 10: return 'TRACE';
                default: return 'INFO';
            }
        }
        // Handle string levels (fallback)
        return (level || 'info').toUpperCase();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            return format(new Date(timestamp), 'HH:mm:ss.SSS');
        } catch {
            return timestamp;
        }
    };

    const highlightJson = (json: any) => {
        const jsonString = JSON.stringify(json, null, 2);
        return hljs.highlight(jsonString, { language: 'json' }).value;
    };

    return (
        <Paper
            elevation={0}
            sx={{
                padding: "4px",
                backgroundColor: theme.palette.mode === 'dark' ? '#2A2A2A' : '#f5f5f5',
                borderLeft: `4px solid ${getLevelColor(entry.level)}`,
                borderTop: '1px solid',
                borderRight: '1px solid',
                borderBottom: '1px solid'
            }}
        >
            <Box sx={{ height: "100%", display: 'flex', alignItems: 'center', gap: "16px"}}>
                <Box sx={{ height: "100%", display: 'flex', alignItems: 'center', gap: "8px"}}>
                    {entry.timestamp && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: theme.palette.mode === 'dark' ? '#888' : '#666',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                marginLeft: "8px",
                                opacity: 0.9
                            }}
                        >
                            {formatTimestamp(entry.timestamp)}
                        </Typography>
                    )}
                    
                    {entry.level && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: getLevelColor(entry.level),
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                backgroundColor: getLevelBackground(entry.level),
                                px: 1,
                                py: 0.25,
                                borderRadius: '4px',
                                display: 'inline-block'
                            }}
                        >
                            {getLevelLabel(entry.level)}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {entry.isJson ? (
                        <>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: expanded ? 1 : 0,
                                justifyContent: 'space-between'
                            }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: 'monospace',
                                        color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#333',
                                        fontSize: '0.875rem',
                                        lineHeight: 1.5,
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {entry.message}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                                    <Tooltip title={copied ? "Copied!" : "Copy JSON"}>
                                        <IconButton
                                            size="small"
                                            onClick={() => copyToClipboard(JSON.stringify(entry.data, null, 2))}
                                            sx={{
                                                color: theme.palette.mode === 'dark' ? '#888' : '#666',
                                                '&:hover': {
                                                    color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#333'
                                                }
                                            }}
                                        >
                                            <ContentCopyIcon sx={{ width: "16px", height: "16px" }}/>
                                        </IconButton>
                                    </Tooltip>
                                    <IconButton
                                        size="small"
                                        onClick={() => setExpanded(!expanded)}
                                        sx={{
                                            color: theme.palette.mode === 'dark' ? '#888' : '#666',
                                            '&:hover': {
                                                color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#333'
                                            }
                                        }}
                                    >
                                        {expanded ? <ExpandLessIcon sx={{ width: "16px", height: "16px" }}/> : <ExpandMoreIcon sx={{ width: "16px", height: "16px" }}/>}
                                    </IconButton>
                                </Box>
                            </Box>
                            {expanded && (
                                <Box sx={{ 
                                    backgroundColor: theme.palette.mode === 'dark' ? '#1E1E1E' : '#f8f8f8',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                    width: '100%'
                                }}>
                                    <pre
                                        style={{
                                            margin: 0,
                                            padding: '12px',
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                            lineHeight: 1.5,
                                            overflow: 'auto',
                                            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#333',
                                            maxHeight: '400px'
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: highlightJson(entry.data)
                                        }}
                                    />
                                </Box>
                            )}
                        </>
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: 'monospace',
                                color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#333',
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.875rem',
                                lineHeight: 1.5
                            }}
                        >
                            {entry.message}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

const LogViewer: React.FC<LogViewerProps> = ({ serviceName }) => {
    const [logs, setLogs] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<string>('all');
    const [lineLimit, setLineLimit] = useState<number>(100);

    console.log("LOG VIEWER", serviceName)

    const getServiceIdentifier = (serviceName?: string) => {
        switch (serviceName) {
            case "server": return "socket-service";
            case "controller": return "browsers-service-poc";
            case "mobile-node": return "mobile-node";
            case "vnc-proxy": return "vnc-proxy";
            case "cdp-proxy": return "cdp-proxy";
            case "node-server": return "node-server";
            default: return "scraper-service-ts";
        }
    };

    useEffect(() => {
        const readLogs = async (logType: 'out' | 'err' | "proxy") => {
            try {
                console.log("Reading logs", serviceName, logType);
                const serviceIdentifier = getServiceIdentifier(serviceName);
                const logContent = await window.electronAPI.readServiceLogs(serviceIdentifier, logType);
                setLogs(logContent);
                setError(null);
            } catch (error) {
                console.error('Failed to read logs:', error);
                setError('Failed to read logs. Please try again.');
            }
        };

        // Initial fetch
        const type = (serviceName === "vnc-proxy" || serviceName === "cdp-proxy" || serviceName === "node-server") ? "proxy" : "out";
        readLogs(type);

        // Set up interval to fetch logs every 10 seconds
        const intervalId = setInterval(() => {
            readLogs(type);
        }, 10000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, [serviceName]);

    const parseLogLine = (line: string): LogEntry => {
        try {
            // Try to parse as JSON first
            const jsonData = JSON.parse(line);
            return {
                timestamp: jsonData.timestamp || jsonData.time,
                level: jsonData.level,
                message: jsonData.message || jsonData.msg || line,
                data: jsonData,
                isJson: true
            };
        } catch {
            // If not JSON, try to parse common log formats
            const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)/);
            const levelMatch = line.match(/\[(INFO|ERROR|WARN|DEBUG|TRACE|FATAL)\]/i);
            
            return {
                timestamp: timestampMatch ? timestampMatch[1] : undefined,
                level: levelMatch ? levelMatch[1].toLowerCase() as LogEntry['level'] : undefined,
                message: line,
                isJson: false
            };
        }
    };

    const logEntries = (logs || '')
        .split('\n')
        .filter(line => line.trim())
        .map(parseLogLine)
        .filter(entry => selectedLevel === 'all' || entry.level === selectedLevel)
        .slice(-lineLimit);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Box sx={{ 
                    display: 'flex', 
                    gap: "8px",
                    padding: "8px",
                }}>
                    <FormControl size="small" sx={{ 
                        minWidth: 120,
                        '& .MuiInputLabel-root': {
                            color: (theme) => theme.palette.mode === 'dark' ? '#E0E0E0' : '#333'
                        },
                        '& .MuiOutlinedInput-root': {
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: (theme) => theme.palette.primary.main
                            }
                        }
                    }}>
                        <InputLabel>Log Level</InputLabel>
                        <Select
                            value={selectedLevel}
                            label="Log Level"
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            sx={{
                                color: (theme) => theme.palette.mode === 'dark' ? '#E0E0E0' : '#333',
                                '& .MuiSelect-select': {
                                    color: (theme) => theme.palette.mode === 'dark' ? '#E0E0E0' : '#333'
                                }
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1A1A1A' : '#ffffff',
                                        '& .MuiMenuItem-root': {
                                            color: (theme) => theme.palette.mode === 'dark' ? '#E0E0E0' : '#333'
                                        }
                                    }
                                }
                            }}
                        >
                            <MenuItem value="all">All Levels</MenuItem>
                            <MenuItem value="50">Error</MenuItem>
                            <MenuItem value="40">Warning</MenuItem>
                            <MenuItem value="30">Info</MenuItem>
                            <MenuItem value="20">Debug</MenuItem>
                            <MenuItem value="10">Trace</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        label="Last N Lines"
                        type="number"
                        value={lineLimit}
                        onChange={(e) => setLineLimit(Math.max(1, parseInt(e.target.value) || 100))}
                        sx={{ 
                            width: 120,
                            '& .MuiInputLabel-root': {
                                color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#333'
                            },
                            '& .MuiInputBase-input': {
                                color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#333'
                            },
                            '& .MuiOutlinedInput-root': {
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: (theme) => theme.palette.primary.main
                                }
                            }
                        }}
                    />
                </Box>

                <Typography
                    sx={{
                        marginRight: "10px",
                    }}
                >
                    {serviceName}
                </Typography>
            </Box>

            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: "8px",
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: theme => theme.palette.mode === 'dark' ? '#1A1A1A' : '#f1f1f1',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: theme => theme.palette.mode === 'dark' ? '#333' : '#ccc',
                        borderRadius: '4px',
                        '&:hover': {
                            background: theme => theme.palette.mode === 'dark' ? '#444' : '#999',
                        },
                    },
                }}
            >
                {error ? (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                        width="100%"
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'error.main',
                                textAlign: 'center',
                                mt: 2,
                                p: 2,
                                borderRadius: 1
                            }}
                        >
                            {error}
                        </Typography>
                    </Box>
                ) : logEntries.length === 0 ? (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                        width="100%"
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: theme => theme.palette.mode === 'dark' ? '#888' : '#666',
                                textAlign: 'center',
                                mt: 2,
                                p: 2,
                                borderRadius: 1
                            }}
                        >
                            No logs available
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        display="flex"
                        flexDirection="column"
                        gap="8px"
                    >
                        {logEntries.map((entry, index) => (
                            <LogLine key={index} entry={entry} />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default LogViewer;