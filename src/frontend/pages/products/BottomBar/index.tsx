import { Box, Typography, Tooltip } from "@mui/material";
import CopyIcon from "@mui/icons-material/ContentCopy";
import { useState } from "react";

export interface IProps {
    isControllerRunning: boolean
    isApiRunning: boolean
    isConnectedToServer: boolean
    isMobileNodeRunning: boolean
    onShowLogs: (service: "server" | "vnc-proxy" | "cdp-proxy" | "controller" | "api" | "mobile-node" | "node-server") => void
    selectedService?: "server" | "vnc-proxy" | "cdp-proxy" | "controller" | "api" | "mobile-node" | "node-server"
    version: string | null
    nodeId: string | null
}

export default function BottomBar({
    isControllerRunning, 
    isApiRunning,
    isConnectedToServer,
    isMobileNodeRunning,
    onShowLogs,
    selectedService,
    version,
    nodeId
}: IProps) : JSX.Element {
    const [showCopied, setShowCopied] = useState(false);
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 1500);
    };

    const textSx = {
        color: "#51525B",
        fontWeight: "500",
        fontSize: "12px",
        lineHeight: "22px"
    }

    return (
        <Box
            paddingLeft="24px"
            paddingRight="24px"
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            width={"100%"}
        >
            {/* Left */}
            <Box display="flex" gap={"8px"}>
                <Typography sx={{...textSx, color: "#c8c8c8"}}>Version: {version}</Typography>
                {
                        nodeId &&
                        <Box display="flex" gap={"8px"} alignItems="center">
                            <Typography sx={{...textSx, color: "#c8c8c8"}}>NodeId: {nodeId}</Typography>
                            <Tooltip 
                                arrow 
                                title={showCopied ? "Copied!" : "Copy to clipboard"}
                                onClose={() => setShowCopied(false)}
                            >
                                <CopyIcon 
                                    sx={{
                                        cursor: "pointer", 
                                        width: "10px", 
                                        height: "10px",
                                        transition: 'transform 0.2s',
                                        '&:active': {
                                            transform: 'scale(0.9)',
                                        },
                                    }} 
                                    onClick={() => handleCopy(nodeId)}
                                />
                            </Tooltip>
                        </Box>
                    }
            </Box>
            
            {/* Right */}
            <Box display="flex"
            >
                <Box
                    display="flex"
                    flexDirection="row"
                    gap={"8px"}
                    sx={{
                        paddingLeft: "8px",
                        paddingRight: "8px",
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        },
                        cursor: "pointer",
                        backgroundColor: selectedService === "vnc-proxy" ? "rgba(0, 0, 0, 0.04)" : "transparent"
                    }}
                    onClick={() => onShowLogs("node-server")}
                >
                    <Tooltip arrow title={isConnectedToServer ? "Connected to Node server" : "Disconnected from Node server"}>
                        <Box
                            display="flex"
                            flexDirection="row"
                            gap="4px"
                            justifyContent="center"
                        >
                            <Box
                                width="14px"
                                height="14px"
                            >
                                {
                                    isConnectedToServer ? 
                                        <img src={"static://assets/greenDot.svg"} alt="Running" /> 
                                        : 
                                        <img src={"static://assets/redDot.svg"} alt="Stopped" />
                                }
                            </Box>
                            <Typography
                                sx={textSx}
                            >
                                Node Proxy
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>

                <Box
                    display="flex"
                    flexDirection="row"
                    gap={"8px"}
                    sx={{
                        paddingLeft: "8px",
                        paddingRight: "8px",
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        },
                        cursor: "pointer",
                        backgroundColor: selectedService === "vnc-proxy" ? "rgba(0, 0, 0, 0.04)" : "transparent"
                    }}
                    onClick={() => onShowLogs("vnc-proxy")}
                >
                    <Tooltip arrow title={isConnectedToServer ? "Connected to VNC proxy server" : "Disconnected from VNC proxy server"}>
                        <Box
                            display="flex"
                            flexDirection="row"
                            gap="4px"
                            justifyContent="center"
                        >
                            <Box
                                width="14px"
                                height="14px"
                            >
                                {
                                    isConnectedToServer ? 
                                        <img src={"static://assets/greenDot.svg"} alt="Running" /> 
                                        : 
                                        <img src={"static://assets/redDot.svg"} alt="Stopped" />
                                }
                            </Box>
                            <Typography
                                sx={textSx}
                            >
                                VNC Proxy
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>

                <Box
                    display="flex"
                    flexDirection="row"
                    gap={"8px"}
                    sx={{
                        paddingLeft: "8px",
                        paddingRight: "8px",
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        },
                        cursor: "pointer",
                        backgroundColor: selectedService === "cdp-proxy" ? "rgba(0, 0, 0, 0.04)" : "transparent"
                    }}
                    onClick={() => onShowLogs("cdp-proxy")}
                >
                    <Tooltip arrow title={isConnectedToServer ? "Connected to CDP proxy server" : "Disconnected from CDP proxy server"}>
                        <Box
                            display="flex"
                            flexDirection="row"
                            gap="4px"
                            justifyContent="center"
                        >
                            <Box
                                width="14px"
                                height="14px"
                            >
                                {
                                    isConnectedToServer ? 
                                        <img src={"static://assets/greenDot.svg"} alt="Running" /> 
                                        : 
                                        <img src={"static://assets/redDot.svg"} alt="Stopped" />
                                }
                            </Box>
                            <Typography
                                sx={textSx}
                            >
                                CDP Proxy
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>

                <Box
                    display="flex"
                    flexDirection="row"
                    gap={"8px"}
                    sx={{
                        paddingLeft: "8px",
                        paddingRight: "8px",
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        },
                        cursor: "pointer",
                        backgroundColor: selectedService === "controller" ? "rgba(0, 0, 0, 0.04)" : "transparent"
                    }}
                    onClick={() => isConnectedToServer ? onShowLogs("controller") : onShowLogs("controller")}
                >
                    <Tooltip arrow title={isConnectedToServer ? "Browser controller is running" : "Browser is controller not running"}>
                        <Box
                            display="flex"
                            flexDirection="row"
                            gap="4px"
                            justifyContent="center"
                        >
                            <Box
                                width="14px"
                                height="14px"
                            >
                                {
                                    isControllerRunning ? 
                                        <img src={"static://assets/greenDot.svg"} alt="Running" /> 
                                        : 
                                        <img src={"static://assets/redDot.svg"} alt="Stopped" />
                                }
                            </Box>
                            <Typography
                                    sx={textSx}
                                >
                                Controller
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>

                <Box
                    display="flex"
                    flexDirection="row"
                    gap={"8px"}
                    sx={{
                        paddingLeft: "8px",
                        paddingRight: "8px",
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        },
                        //cursor: isApiRunning ? "pointer" : "not-allowed"
                        cursor: "pointer",
                        backgroundColor: selectedService === "api" ? "rgba(0, 0, 0, 0.04)" : "transparent"
                    }}
                    onClick={() => isConnectedToServer ? onShowLogs("api") : onShowLogs("api")}
                >
                    <Tooltip arrow title={isApiRunning ? "API is running" : "API is not running"}>
                        <Box
                            display="flex"
                            flexDirection="row"
                            gap="4px"
                            justifyContent="center"
                        >
                            <Box
                                width="14px"
                                height="14px"
                            >
                                {
                                    isApiRunning ? 
                                        <img src={"static://assets/greenDot.svg"} alt="Running" /> 
                                        : 
                                        <img src={"static://assets/redDot.svg"} alt="Stopped" />
                                }
                            </Box>
                            <Typography
                                sx={textSx}
                            >
                                API
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>

                {/*
                <Box
                    display="flex"
                    flexDirection="row"
                    gap={"8px"}
                    sx={{
                        paddingLeft: "8px",
                        paddingRight: "8px",
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        },
                        cursor: "pointer",
                        backgroundColor: selectedService === "mobile-node" ? "rgba(0, 0, 0, 0.04)" : "transparent"
                    }}
                    onClick={() => onShowLogs("mobile-node")}
                >
                    <Tooltip arrow title={isMobileNodeRunning ? "Mobile node is running" : "Mobile node is not running"}>
                        <Box
                            width="80px"
                            display="flex"
                            flexDirection="row"
                            gap="4px"
                            justifyContent="center"
                        >
                            <Box
                                width="14px"
                                height="14px"
                            >
                                {
                                    isMobileNodeRunning ? 
                                        <img src={"static://assets/greenDot.svg"} alt="Running" /> 
                                        : 
                                        <img src={"static://assets/redDot.svg"} alt="Stopped" />
                                }
                            </Box>
                            <Typography
                                sx={textSx}
                            >
                                Mobile
                            </Typography>
                         </Box>
                    </Tooltip>
                </Box>*/}
            </Box>
        </Box>
    )
}