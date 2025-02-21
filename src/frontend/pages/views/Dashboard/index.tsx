import { useEffect, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import { Stack, Paper } from "@mui/material";
export interface IClient {
    connectedAt: Date;
    id: string;
    info: {
        platform: string;
        architecture: string;
        freeMemory: number;
        totalMemory: number;
        cpuModel: string;
        hostname: string;
    }
}

interface IProps {
    isOnBoarded: boolean;
    myNodeInfo: IClient["info"] | null;
    browsersNum: number;
    updater: number;
}

export default function View({
    isOnBoarded,
    browsersNum,
    myNodeInfo,
    updater
}: IProps) : JSX.Element {
    // Info
    const [nodes, setNodes] = useState<IClient[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [liveBrowsersNum, setLiveBrowsersNum] = useState<number>(0);

    useEffect(() => {
        // Function to fetch nodes info
        const fetchNodesInfo = () => {
            window.electronAPI.getNodesInfo()
                .then(data => {
                    setNodes(data.nodes)
                    setLiveBrowsersNum(data.browsers)
                })
                .catch(err => console.error('Failed to fetch nodes:', err));
        };

        // Initial fetch
        fetchNodesInfo();

        // Set up interval
        const interval = setInterval(fetchNodesInfo, 5000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [updater]);

    const toggleNodeExpansion = (nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

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
        color: "#3F3F45",
    }

    const valueSx = {
        fontSize: "24px",
        fontWeight: "600",
        lineHeight: "38px",
        color: "#3F3F45",
    }
    
    const nodeInfoSx = {
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "20px",
        color: "#3F3F45",
    }

    const expandedInfoSx = {
        ...nodeInfoSx,
        paddingLeft: "72px", // Align with content above
        paddingTop: "8px",
        paddingBottom: "8px",
    };

    const onBoardingTitleSx = {
        color: "#3F3F45",
        fontSize: "146x",
        fontWeight: "600",
        lineHeight: "24px"
    }

    const onBoardingSubTitleSx = {
        color: "#51525B",
        fontSize: "16px",
        fontWeight: "400",
        lineHeight: "24px"
    }

    return (
        <Stack
            spacing={"16px"}
            sx={{ height: '100%' }}
        >        
            {
                <Alert severity="warning" sx={{ mb: 1 }}>
                    You must obtain an API key from the Task Net dashboard and save it in Settings to be able to go live:{' '}
                    <span 
                        onClick={() => window.electronAPI.openExternal('https://dashboard.tasknet.co/')}
                        style={{ 
                            color: '#1976d2', 
                            textDecoration: 'underline', 
                            cursor: 'pointer' 
                        }}
                    >
                        https://dashboard.tasknet.co/
                    </span>
                </Alert>
            }

            {
                !isOnBoarded &&
                <Alert severity="error" sx={{ mb: 1 }}>
                    Docker is not detected. Please ensure Docker Desktop is running and the Docker command is properly set up in your system PATH. Common Docker paths are:
                    {window.electronAPI.platform === 'darwin' && " /usr/local/bin/docker, /opt/homebrew/bin/docker, or /Applications/Docker.app"}
                    {window.electronAPI.platform === 'win32' && " C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"}
                    {window.electronAPI.platform === 'linux' && " /usr/bin/docker or /usr/local/bin/docker"}
                </Alert>
            }

            {/* OnBoarding */}
            {
                !isOnBoarded &&
                <Box>
                    <Paper sx={{...paperSx, height: "fit-content", padding: "24px"}}>
                        <Stack spacing={2} position="relative">
                            {/* Vertical connecting lines */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: '23px', // Half of the icon width (48/2) - half of line width
                                    top: '48px', // Height of first icon
                                    height: 'calc(100% - 72px)', // Full height minus some padding
                                    width: '2px',
                                    backgroundColor: '#E4E4E7',
                                    zIndex: 0,
                                }}
                            />

                            <Box 
                                display="flex" 
                                gap={"16px"} 
                                alignItems="center"
                                position="relative"
                                sx={{ backgroundColor: '#FFF', zIndex: 1, pb: 2 }}
                            >
                                <Box sx={{ 
                                    width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: "4px",
                                    border: "1px solid #E4E4E7",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                    backgroundColor: '#FFF',
                                }}>
                                    <img src="static://assets/download.svg" alt="download" />
                                </Box>
                                <Box
                                    maxWidth={"350px"}
                                >
                                    <Typography sx={titleSx}>Download Docker Desktop</Typography>
                                    <span 
                                        onClick={() => window.electronAPI.openExternal('https://www.docker.com/')}
                                        style={{ 
                                            ...nodeInfoSx,
                                            cursor: 'pointer',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        https://www.docker.com/
                                    </span>
                                </Box>
                            </Box>

                            <Box 
                                display="flex" 
                                gap={"16px"} 
                                alignItems="center"
                                position="relative"
                                sx={{ backgroundColor: '#FFF', zIndex: 1, pb: 2 }}
                            >
                                <Box sx={{ 
                                    width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: "4px",
                                    border: "1px solid #E4E4E7",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                    backgroundColor: '#FFF',
                                }}>
                                    <img src="static://assets/settings.svg" alt="settings" />
                                </Box>
                                <Box
                                    maxWidth={"350px"}
                                >
                                    <Typography sx={titleSx}>Run Docker Desktop</Typography>
                                    <Typography sx={nodeInfoSx}>
                                        Ensure docker engine is started successfully. Follow the instructions provided in the Docker Desktop application.
                                    </Typography>
                                </Box>
                            </Box>

                            <Box 
                                display="flex" 
                                gap={"16px"} 
                                alignItems="center"
                                position="relative"
                                sx={{ backgroundColor: '#FFF', zIndex: 1, pb: 2 }}
                            >
                                <Box sx={{ 
                                    width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: "4px",
                                    border: "1px solid #E4E4E7",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                    backgroundColor: '#FFF',
                                }}>
                                    <img src="static://assets/dashboard2.svg" alt="dashboard" />
                                </Box>
                                <Box
                                    maxWidth={"350px"}
                                >
                                    <Typography sx={titleSx}>Navigate to the Dashboard Page</Typography>
                                    <Typography sx={nodeInfoSx}>
                                        After docker is set up, you will be able to toggle the node on and off.
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Paper>
                </Box>
            }

            {/* Connected Nodes & Devices */}
            <Box
                display="flex"
                flexDirection={"row"}
                gap={"24px"}
            >
                {/* Nodes Info*/}
                <Paper sx={paperSx}>
                    <Box
                        display="flex"
                        flexDirection={"row"}
                        //justifyContent={"space-between"}
                    >
                        <Box
                            display="flex"
                            flexDirection={"column"}
                            gap={"24px"}
                            width={"350px"}
                        >
                            <Box
                                display="flex"
                                flexDirection={"row"}
                                gap={"8px"}
                                alignItems="center"
                            >
                                <img src="static://assets/computer.svg" alt="computer" width={"20px"} height={"20px"}/>
                                <Typography sx={titleSx}>
                                    My Node Info
                                </Typography>
                            </Box>
                            <Box
                                display="flex"
                                gap={"32px"}
                            >
                                <Box
                                    display="flex"
                                    flexDirection={"column"}
                                    gap={"8px"}
                                >
                                    <Typography
                                        sx={labelSx}
                                    >Available Mobiles</Typography>
                                    <Typography
                                        sx={valueSx}
                                    >0</Typography>
                                </Box>
                                <Box
                                    display="flex"
                                    flexDirection={"column"}
                                    gap={"8px"}
                                >
                                    <Typography
                                        sx={labelSx}
                                    >
                                        Available Browsers
                                    </Typography>
                                    <Typography
                                        sx={valueSx}
                                    >
                                        {browsersNum}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box
                            >
                                {
                                    myNodeInfo &&
                                    <>
                                        {Object.entries({
                                            'Hostname': myNodeInfo.hostname,
                                            'CPU': myNodeInfo.cpuModel,
                                            'Memory': `${(myNodeInfo.freeMemory / 1024 / 1024 / 1024).toFixed(1)}GB free of ${(myNodeInfo.totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB`
                                        }).map(([key, value]) => (
                                            <Box 
                                                key={key}
                                                display="flex"
                                                justifyContent="space-between"
                                                sx={{
                                                    padding: "8px",
                                                    borderBottom: "1px solid #E4E4E7",
                                                }}
                                            >
                                                <Typography sx={labelSx}>{key}</Typography>
                                                <Typography sx={nodeInfoSx}>{value}</Typography>
                                            </Box>
                                        ))}
                                    </>
                                }
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                <Paper sx={{...paperSx, width: "100%"}}>
                    <Box
                        display="flex"
                        flexDirection={"row"}
                        gap={"16px"}
                        justifyContent={"space-between"}
                    >
                        <Box
                            display="flex"
                            flexDirection={"column"}
                            gap={"24px"}
                        >
                            <Box
                                display="flex"
                                flexDirection={"row"}
                                gap={"8px"}
                                alignItems="center"
                            >
                                <img src="static://assets/globe.svg" alt="computer" width={"20px"} height={"20px"}/>
                                <Typography sx={titleSx}>
                                Network Stats
                                </Typography>
                            </Box>
                            <Box
                                display="flex"
                                gap={"32px"}
                            >
                                <Box
                                    display="flex"
                                    flexDirection={"column"}
                                    gap={"8px"}
                                >
                                    <Typography
                                        sx={labelSx}
                                    >Live Nodes</Typography>
                                    <Typography
                                        sx={valueSx}
                                    >{nodes.length}</Typography>
                                </Box>
                                <Box
                                    display="flex"
                                    flexDirection={"column"}
                                    gap={"8px"}
                                >
                                    <Typography
                                        sx={labelSx}
                                    >
                                        Total Nodes
                                    </Typography>
                                    <Typography
                                        sx={valueSx}
                                    >
                                        {nodes.length}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box
                                display="flex"
                                gap={"32px"}
                            >
                                <Box
                                    display="flex"
                                    flexDirection={"column"}
                                    gap={"8px"}
                                >
                                    <Typography
                                        sx={labelSx}
                                    >Live Mobiles</Typography>
                                    <Typography
                                        sx={valueSx}
                                    >0</Typography>
                                </Box>
                                <Box
                                    display="flex"
                                    flexDirection={"column"}
                                    gap={"8px"}
                                >
                                    <Typography
                                        sx={labelSx}
                                    >
                                        Live Browsers
                                    </Typography>
                                    <Typography
                                        sx={valueSx}
                                    >
                                        {liveBrowsersNum}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box>
                            <Box
                                sx={{
                                    borderRadius: "4px",
                                    border: "1px solid #E4E4E7",
                                    background: "#FFF",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                }}
                            >
                                <img src={"static://assets/worldMap.svg"} alt="Nodes" />
                            </Box>
                        </Box>
                    </Box>
                </Paper>

            </Box>

            {/* Connected Devices */}
            {
                isOnBoarded &&
                <Paper sx={{
                    ...paperSx, 
                    flexGrow: 1,
                    height: 'auto',
                    maxHeight: "calc(100vh - 520px)",
                    minHeight: "310px",
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Box
                        sx={{
                            padding: '16px',
                            backgroundColor: '#FFF'
                        }}
                    >
                        <Box
                            display="flex"
                            flexDirection={"row"}
                            gap={"8px"}
                            alignItems="center"
                        >
                            <Typography sx={titleSx}>
                                Network Nodes
                            </Typography>
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            padding: '16px',
                            overflowY: "auto",
                            overflowX: "hidden",
                            flexGrow: 1,
                            '&::-webkit-scrollbar': {
                                display: 'none'
                            },
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        <Box
                            display="flex"
                            gap={"24px"}
                            flexDirection={"column"}
                            flexWrap="nowrap"
                            maxWidth="100%"
                            height="100%"
                        >
                            {nodes.length > 0 && nodes.map((node, index) => (
                                <Box key={`${node.id}-${index}`}>
                                    <Box
                                        display="flex"
                                        flexDirection={"row"}
                                        gap={"16px"}
                                    >
                                        <Box
                                            width={"56px"}
                                            height={"56px"}
                                        >
                                            <img src={"static://assets/Icon_Gray.svg"} alt="Node" style={{ width: "100%", height: "100%" }} />
                                        </Box>
                                        <Box
                                            display="flex"
                                            justifyContent={"space-between"}
                                            flexGrow={1}
                                        >
                                            <Box
                                                display="flex"
                                                flexDirection={"column"}
                                                gap={"4px"}
                                            >
                                                {
                                                    Object.entries(node.info).filter(([key, value]) => key === "platform" || key === "architecture").map(([key, value]) => (
                                                        <Box
                                                            key={key}
                                                            display="flex"
                                                            justifyContent="space-between"
                                                        >
                                                            <Typography
                                                                sx={nodeInfoSx}
                                                            >{value}</Typography>
                                                        </Box>
                                                    ))
                                                }
                                            </Box>
                                            <Box 
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() => toggleNodeExpansion(node.id)}
                                            >
                                                <img 
                                                    src={"static://assets/chevron-down.svg"} 
                                                    alt="chevron-down" 
                                                    style={{
                                                        transform: expandedNodes.has(node.id) ? 'rotate(180deg)' : 'none',
                                                        transition: 'transform 0.3s ease'
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                    {/* Add expanded section with transition */}
                                    <Box 
                                        sx={{
                                            maxHeight: expandedNodes.has(node.id) ? '500px' : '0px',
                                            height: expandedNodes.has(node.id) ? 'auto' : '0px',
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease-in-out',
                                            opacity: expandedNodes.has(node.id) ? 1 : 0,
                                            marginTop: expandedNodes.has(node.id) ? '8px' : '0px',
                                            marginBottom: expandedNodes.has(node.id) ? '8px' : '0px',
                                            visibility: expandedNodes.has(node.id) ? 'visible' : 'hidden',
                                            transform: expandedNodes.has(node.id) ? 'scaleY(1)' : 'scaleY(0)',
                                            transformOrigin: 'top',
                                        }}
                                    >
                                        <Box sx={expandedInfoSx}>
                                            <Typography sx={nodeInfoSx}>Hostname: {node.info.hostname}</Typography>
                                            <Typography sx={nodeInfoSx}>CPU: {node.info.cpuModel}</Typography>
                                            <Typography sx={nodeInfoSx}>
                                                Memory: {(node.info.freeMemory / 1024 / 1024 / 1024).toFixed(1)}GB free 
                                                of {(node.info.totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB
                                            </Typography>
                                            <Typography sx={nodeInfoSx}>
                                                Connected since: {node.connectedAt.toLocaleString()}
                                            </Typography>
                                            <Typography sx={nodeInfoSx}>
                                                Active browsers: {browsersNum}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                            {
                                nodes.length === 0 && (
                                    <Box
                                        display="flex"
                                        justifyContent={"center"}
                                        alignItems={"center"}
                                        flexDirection={"column"}
                                        gap={"8px"}
                                        sx={{
                                            height: "100%",
                                            width: "100%",
                                        }}
                                    >
                                        <img src="static://assets/warning.svg" alt="warning" width={"20px"} height={"20px"}/>
                                        <Typography
                                            sx={labelSx}
                                        >No connected nodes</Typography>
                                    </Box>
                                )
                            }
                        </Box>
                    </Box>
                </Paper>
            }
        </Stack>
    )
}