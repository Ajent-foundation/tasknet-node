import { Box, Paper, Typography, Tooltip, IconButton, Alert } from "@mui/material";
import { useState } from "react";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Settings } from "../../../../store";

export interface IProps {
    publicKey: string;
    privateKey: string;
    onKeysChange: (newSettings: Settings) => void;
    settings: Settings;
}

// Components
import Section from "./Section";

export default function View({ publicKey, privateKey, settings, onKeysChange }: IProps) : JSX.Element {
    const [copiedPublicKey, setCopiedPublicKey] = useState(false);
    const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const handleCopy = (field: 'public' | 'private', value: string) => {
        navigator.clipboard.writeText(value).then(() => {
            setCopiedPublicKey(true);
            setTimeout(() => setCopiedPublicKey(false), 2000);
        });
    }

    const paperSx = {
        borderRadius: "4px",
        border: "1px solid #E4E4E7",
        background: "#FFF",
        boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
        padding: "16px",
        height: "266px",
    }

    const titleSx = {
        fontSize: "16px",
        fontWeight: "600",
        lineHeight: "24px",
        color: "#1A1A1E",
    }

    const labelSx = {
        fontSize: "14px",
        fontWeight: "500",
        lineHeight: "20px",
        color: "#52525A",
    }

    const valueSx = {
        fontSize: '16px',
        lineHeight: '24px',
        color: '#1A1A1E',
        padding: '10px 14px',
        border: '1px solid #E4E4E7',
        borderRadius: '4px',
        backgroundColor: '#FFF',
        width: '100%'
    }

    return (
        <Box
            display="flex"
            flexDirection="column"
            gap="16px"
            sx={{
                flexGrow: 1,
                paddingRight: '16px',
                overflow: 'auto',
                height: '700px'
            }}
        >
            <Alert severity="info" sx={{ mb: 1 }}>
                Some settings changes will only take effect after toggling Go live again
            </Alert>

            <Alert severity="warning" sx={{ mb: 1 }}>
                You must obtain a new API key from the Task Net dashboard to be able to go live
            </Alert>

            <Section 
                title="Node" 
                fields={[
                    [
                        {
                            id: "nodeProtocol",
                            label: "Protocol",
                            value: settings.nodeProtocol,
                            type: "select",
                            isReadOnly: true,
                            options: [
                                { label: "http", value: "http" },
                                { label: "https", value: "https" }
                            ]
                        },
                        {
                            id: "wsProtocol",
                            label: "Websocket Protocol",
                            value: settings.wsProtocol,
                            type: "select",
                            isReadOnly: true,
                            options: [
                                { label: "ws", value: "ws" },
                                { label: "wss", value: "wss" }
                            ]
                        },
                        {
                            id: "serverIpOrDomain",
                            label: "IP (domain or ip only)",
                            isReadOnly: true,
                            value: settings.serverIpOrDomain,
                            type: "text",
                            hint: "The URL where your node server is running (e.g., localhost)"
                        },
                        {
                            id: "serverPort",
                            label: "Port",
                            isReadOnly: true,
                            value: settings.serverPort,
                            type: "text",
                            hint: "The port where your node server is running (e.g., 3000)"
                        },
                        {
                            id: "dontConnectOnGoLive",
                            label: "Don't connect to server on Go live",
                            value: settings.dontConnectOnGoLive.toString(),
                            type: "toggle"
                        },
                    ],
                    [
                        {
                            id: "apiKeyId",
                            label: "Node API Key UUID",
                            value: settings.apiKeyId,
                            type: "password"
                        },
                        {
                            id: "apiKey",
                            label: "Node API Key",
                            value: settings.apiKey,
                            type: "password"
                        }
                    ],
                ]}
                onSavedFields={(fields: Record<string, string>) => {
                    onKeysChange({
                        ...settings,
                        ...fields
                    });
                }}
                showSaveButton={true}
            />
            
            <Paper sx={{...paperSx, height: "fit-content", padding: "24px"}}>
                <Box
                    display="flex"
                    flexDirection={"column"}
                    gap={"16px"}
                >
                    <Box
                        display="flex"
                        flexDirection={"row"}
                        gap={"8px"}
                        alignItems="center"
                    >
                        <Typography sx={titleSx}>
                            Node Keys
                        </Typography>
                    </Box>

                    <Box
                        display="flex"
                        flexDirection={"column"}
                        gap={"8px"}
                    >
                        <Box display="flex" flexDirection="column" gap="6px">
                            <Typography sx={labelSx}>Public Key (SOL)</Typography>
                            <Box sx={{ display: 'flex', gap: '8px' }}>
                                <Typography sx={valueSx}>
                                    {publicKey}
                                </Typography>
                                <Tooltip 
                                    open={copiedPublicKey}
                                    title="Copied!"
                                    placement="top"
                                    arrow
                                    onClose={() => setCopiedPublicKey(false)}
                                >
                                    <Box
                                        width="40px"
                                        height="40px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        sx={{ 
                                            cursor: 'pointer',
                                            border: '1px solid #E4E4E7',
                                            borderRadius: '4px',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                backgroundColor: '#F4F4F5'
                                            }
                                        }}
                                        onClick={() => handleCopy('public', publicKey)}
                                    >
                                        {copiedPublicKey ? (
                                            <img src={"static://assets/success.svg"} alt="copied" width={"20px"} height={"20px"}/>
                                        ) : (
                                            <img src={"static://assets/copy.svg"} alt="copy" width={"20px"} height={"20px"}/>
                                        )}
                                    </Box>
                                </Tooltip>
                            </Box>
                        </Box>
                        <Box display="flex" flexDirection="column" gap="6px">
                            <Typography sx={labelSx}>Private Key (SOL)</Typography>
                            <Box sx={{ display: 'flex', gap: '8px' }}>
                                <Box sx={{ 
                                    position: 'relative', 
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '40px'
                                }}>
                                    <Typography sx={{
                                        ...valueSx,
                                        pr: '40px' // Add padding for the eye icon
                                    }}>
                                        {showPrivateKey && privateKey 
                                            ? privateKey.length > 100 
                                                ? privateKey.slice(0, 100) + '...' 
                                                : privateKey 
                                            : '••••••••••••••••'}
                                    </Typography>
                                    <IconButton
                                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                                        sx={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        {showPrivateKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </Box>
                                <Tooltip 
                                    open={copiedPrivateKey}
                                    title="Copied!"
                                    placement="top"
                                    arrow
                                    onClose={() => setCopiedPrivateKey(false)}
                                >
                                    <Box
                                        width="40px"
                                        height="40px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        sx={{ 
                                            cursor: 'pointer',
                                            border: '1px solid #E4E4E7',
                                            borderRadius: '4px',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                backgroundColor: '#F4F4F5'
                                            }
                                        }}
                                        onClick={() => handleCopy('private', privateKey)}
                                    >
                                        {copiedPrivateKey ? (
                                            <img src={"static://assets/success.svg"} alt="copied" width={"20px"} height={"20px"}/>
                                        ) : (
                                            <img src={"static://assets/copy.svg"} alt="copy" width={"20px"} height={"20px"}/>
                                        )}
                                    </Box>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <Section 
                title="Browser Container Manager"
                fields={[
                    [
                        {
                            id: "browserManagerProtocol",
                            label: "Protocol",
                            value: settings.browserManagerProtocol,
                            type: "select",
                            options: [
                                { label: "http", value: "http" },
                                { label: "https", value: "https" }
                            ]
                        },
                        {
                            id: "browserManagerIpOrDomain",
                            label: "IP (domain or ip only)",
                            value: settings.browserManagerIpOrDomain,
                            type: "text",
                            hint: "IP address of the container manager (will only apply if not started on Go live is toggled)"
                        },
                        {
                            id: "browserManagerPort",
                            label: "Port",
                            value: settings.browserManagerPort,
                            type: "text",
                            hint: "Must be a number between 1-65535"
                        },
                        {
                            id: "dontStartBrowserManagerOnGoLive",
                            label: "Don't start on Go live",
                            value: settings.dontStartBrowserManagerOnGoLive.toString(),
                            type: "toggle"
                        },
                    ],
                    [{
                        id: "numOfBrowser",
                        label: "Number of Browsers",
                        value: settings.numOfBrowser.toString(),
                        type: "slider",
                        min: 1,
                        max: 20
                    }],
                    [
                        {
                            id: "expressPort",
                            label: "Base Express PORT Number",
                            value: settings.expressPort,
                            type: "text",
                            hint: "Must be a number between 1-65535"
                        },
                        {
                            id: "vncPort",
                            label: "Base VNC PORT Number",
                            value: settings.vncPort,
                            type: "text",
                            hint: "Must be a number between 1-65535"
                        },
                        {
                            id: "cdpPort",
                            label: "Base CDP PORT Number",
                            value: settings.cdpPort,
                            type: "text",
                            hint: "Must be a number between 1-65535"
                        }
                    ],
                    [{
                        id: "screenResolution",
                        label: "Default Screen Resolution",
                        value: settings.screenResolution,
                        type: "select",
                        options: [
                            { label: "1920x1080", value: "1920x1080" },
                            { label: "1280x720", value: "1280x720" },
                            { label: "1366x768", value: "1366x768" },
                            { label: "1280x2400", value: "1280x2400" }
                        ]
                    }],
                    [{
                        id: "browserImageName",
                        label: "Browser Image Name",
                        value: settings.browserImageName,
                        isReadOnly: true,
                        type: "text",
                        hint: "Docker image name for the browser container"
                    }],
                    [{
                        id: "dockerResources",
                        label: "Docker Resources Configuration",
                        value: "",
                        type: "map",
                        hint: "Invalid values will be ignored and defaults will be used",
                        mapFields: {
                            "memory": settings.dockerResources.memory,
                            "cpu": settings.dockerResources.cpu,
                        }
                    }]
                ]}
                onSavedFields={(fields: Record<string, string>) => {
                    onKeysChange({
                        ...settings,
                        ...fields
                    });
                }}
                showSaveButton={true}
            />
            <Section 
                title="Scraper Service"
                fields={[
                    [
                        {
                            id: "scraperServiceProtocol",
                            label: "Protocol",
                            value: settings.scraperServiceProtocol,
                            type: "select",
                            options: [
                                { label: "http", value: "http" },
                                { label: "https", value: "https" }
                            ]
                        },
                        {
                            id: "scraperServiceIpOrDomain",
                            label: "IP (domain or ip only)",
                            value: settings.scraperServiceIpOrDomain,
                            type: "text",
                            hint: "IP address of the scraper service (will only apply if not started on Go live is toggled)"
                        },
                        {
                            id: "scraperServicePort",
                            label: "Port",
                            value: settings.scraperServicePort,
                            type: "text",
                            hint: "Must be a number between 1-65535"
                        },
                        {
                            id: "dontStartScraperOnGoLive",
                            label: "Don't start on Go live",
                            value: settings.dontStartScraperOnGoLive.toString(),
                            type: "toggle"
                        },
                    ],
                    [{
                        id: "openAIKey",
                        label: "OpenAI Key",
                        value: settings.openAIKey,
                        type: "password"
                    }],
                    [{
                        id: "anthropicKey",
                        label: "Anthropic Key",
                        value: settings.anthropicKey,
                        type: "password"
                    }]
                ]}
                onSavedFields={(fields: Record<string, string>) => {
                    onKeysChange({
                        ...settings,
                        ...fields
                    });
                }}
                showSaveButton={true}
            />
        </Box>
    )
}