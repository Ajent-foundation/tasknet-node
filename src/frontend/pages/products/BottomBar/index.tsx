import { Box, Typography, Tooltip } from "@mui/material";

export interface IProps {
    isControllerRunning: boolean
    isApiRunning: boolean
    isConnectedToServer: boolean
    isMobileNodeRunning: boolean
    onShowLogs: (service: "proxy" | "controller" | "api" | "mobile-node") => void
    selectedService?: "proxy" | "controller" | "api" | "mobile-node"
    version: string | null
}

export default function BottomBar({
    isControllerRunning, 
    isApiRunning,
    isConnectedToServer,
    isMobileNodeRunning,
    onShowLogs,
    selectedService,
    version
}: IProps) : JSX.Element {
    
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
        >
            {/* Left */}
            <Box display="flex" gap={"24px"}>
                <Typography sx={{...textSx, color: "#c8c8c8"}}>Version: {version}</Typography>
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
                        //cursor: "pointer",
                        backgroundColor: selectedService === "proxy" ? "rgba(0, 0, 0, 0.04)" : "transparent"
                    }}
                    //onClick={() => isConnectedToServer ? onShowLogs("proxy") : {}}
                >
                    <Tooltip arrow title={isConnectedToServer ? "Connected to proxy server" : "Disconnected from proxy server"}>
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
                                Proxy
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