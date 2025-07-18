import { useState, useEffect } from "react";
import { ThemeOptions, ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography } from "@mui/material";
import { Settings as ISettings } from "../../store";
import "./global.css";

export const theme: ThemeOptions = createTheme({
    spacing: 1,
    typography: {
        fontFamily: `SF Pro Display, Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica`,
        button: {
            textTransform: 'none'
        }
    },
    palette: {
        text: {
            primary: "#FFFFFF"
        },
        //mode: "dark",
        primary: {
          main: "#0048E5"
        },
        //secondary: {
        //  main: "#171618"
        //}
    },
});

// Components & Products
import Sidebar from "./products/Sidebar";
import BottomBar from "./products/BottomBar";

// Views
import Dashboard, { IClient } from "./views/Dashboard";
import Browser from "./views/Browser";
import Logs from "./views/Logs";
import Settings from "./views/Settings";

export type TView = "dashboard" | "browser" | "logs" | "settings";

export type TListItem = {
    id: TView;
    icon: JSX.Element;
    text: string;
    show: boolean;
}

const defaultSelectedView: TListItem = {
    id: "dashboard",
    icon: <img src={"static://assets/menu/dashboard.svg"} alt="dashboard" width={"100%"} height={"100%"} />,
    text: "Dashboard",
    show: true
}

export default function Page() : JSX.Element {
    const [view, setView] = useState<TView>("dashboard");
    const [selectedView, setSelectedView] = useState<TListItem>(defaultSelectedView);
    const [vncWindowOpen, setVncWindowOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMobileConnecting, setIsMobileConnecting] = useState(false);
    const [logService, setLogService] = useState<"server" | "controller" | "api" | "mobile-node" | "vnc-proxy" | "cdp-proxy" | "node-server" | null>(null);
    const [hasDocker, setHasDocker] = useState(false);
    const [myPoints, setMyPoints] = useState("Points: --");
    const [warning, setWarning] = useState<string | undefined>(undefined);
    const [clientId, setClientId] = useState<string | null>(null);
    const [nodeId, setNodeId] = useState<string | null>(null);
    const [settings, setSettings] = useState<ISettings | null>(null);
    const [updater, setUpdater] = useState(0);
    useEffect(() => {
        // Load cached clientId
        window.electronAPI.getCachedClientId().then((clientId) => {
            if(clientId) setClientId(clientId);
        });

        window.electronAPI.getSettings().then((settings) => {
            console.log("Settings", settings);
            setSettings(settings);
        });
    }, []);

    // Points
    useEffect(() => {
        const updatePoints = async () => {
            window.electronAPI.getPoints(clientId).then((points) => {
                console.log("Points from", clientId);
                if(!points || points.points === -1) {
                    setMyPoints("Points: --");
                } else {
                    setMyPoints(`Points: ${points.points.toFixed(2)}`);
                }
            });
        };

        // Initial fetch
        updatePoints();

        // Set up interval
        const interval = setInterval(updatePoints, 30000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, [clientId]);

    useEffect(() => {
        const checkDocker = async () => {
            const dockerStatus = await window.electronAPI.checkDocker();
            setHasDocker(dockerStatus);
            return dockerStatus;
        };

        // Initial check
        checkDocker();

        // Set up interval only if Docker isn't available
        const interval = setInterval(async () => {
            const dockerStatus = await checkDocker();
            // If Docker becomes available, clear the interval
            if (dockerStatus) {
                clearInterval(interval);
            }
        }, 5000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, []);

    // Menu items
    const items: TListItem[] = [
        {
            id: "dashboard",
            icon: <img src={"static://assets/menu/dashboard.svg"} alt="dashboard" width={"24px"} height={"24px"} />,
            text: "Dashboard",
            show: true
        },
        {
            id: "browser",
            icon: <img src={"static://assets/menu/browser.svg"} alt="world" width={"24px"} height={"24px"} />,
            text: "Browser Nodes",
            show: true
        },
        {
            id: "logs",
            icon: <img src={"static://assets/menu/logs.svg"} alt="logs" width={"24px"} height={"24px"} />,
            text: "Node Logs",
            show: false
        },
        {
            id: "settings",
            icon: <img src={"static://assets/menu/settings.svg"} alt="settings" width={"24px"} height={"24px"} />,
            text: "Settings",
            show: true
        }
    ]

    // Init
    const [isLive, setIsLive] = useState(false);
    useEffect(() => {
        // Only if socket is connected
        window.electronAPI.isConnected().then((isConnected) => {
            setIsConnected(isConnected);
        });
    }, [isLive]);
    
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [version, setVersion] = useState<string | null>(null);
    const [isAppleConnected, setIsAppleConnected] = useState(false);
    const [isAppleConnecting, setIsAppleConnecting] = useState(false);
    useEffect(() => {
        window.electronAPI.init().then((config) => {
            console.log("Init config", config);
            setPublicKey(config.publicKey);
            setPrivateKey(config.privateKey);
            setVersion(config.version);
        });
    }, []);

    // Socket
    const [isConnected, setIsConnected] = useState(false);
    //const [isMobileConnected, setIsMobileConnected] = useState(false);
    const [numBrowsers, setNumBrowsers] = useState(0);
    useEffect(()=>{
        window.electronAPI.getStoredClient().then((client) => {
            console.log("Client", client);
        });
    }, []);

    useEffect(() => {
        // Check if socket is connected
        window.electronAPI.isConnected().then((isConnected) => {
            console.log("Is connected", isConnected);
            if(isConnected) {
                setIsLive(true);
            }
            setIsConnected(isConnected);
        });

        // Check if mobile is connected
        //window.electronAPI.isMobileConnected().then((isMobileConnected) => {
        //    console.log("Is mobile connected", isMobileConnected);
        //    setIsMobileConnected(isMobileConnected);
        //});

        // Listen for socket status changes
        window.electronAPI.onSocketStatus((status: string, data: {clientId: string}) => {
            setIsConnected(status === 'connected');
            setWarning(undefined);
            if(data && data.clientId) {
                console.log("Client ID", data.clientId);
                setClientId(data.clientId.split("::")[0]);
                setNodeId(data.clientId.split("::")[1]);

                // Cache clientId
                window.electronAPI.cacheClientId(data.clientId.split("::")[0]);
            }
            if(status === 'error') {
                setWarning("An error occurred while connecting to the server. Please check your connection and try again.");
            }
        });
    }, []);

    const handleToggleConnection = async () => {
        try {
            if (isLive) {
                await window.electronAPI.disconnectSocket();
                // Go to dashboard
                setView("dashboard");
                setSelectedView(items.find(item => item.id === "dashboard") || defaultSelectedView);
                setNumBrowsers(0);
            } else {
                // Get stored client info or create new one
                const client = await window.electronAPI.getStoredClient();
                if (!client) {
                    // First time connection - generate and save new client info
                    const newClientInfo = {
                        clientId: "",
                        clientInfo: await window.electronAPI.getSystemInfo()
                    };
                    await window.electronAPI.storeClientInfo(newClientInfo);
                }
                
                const response = await window.electronAPI.connectSocket();
                console.log("Connect socket response", response);
                setIsConnected(status === 'connected');
                setNumBrowsers(await window.electronAPI.getCurrentNumOfBrowsers());
            }
            setUpdater(updater + 1);
        } catch (error) {
            console.error('Failed to toggle connection:', error);
        }
    };

    const handleToggleMobileConnection = async () => {
        //try {
        //    console.log("Toggle mobile connection", isMobileConnected);
        //    if (isMobileConnected) {
        //        console.log("Killing mobile node");
        //        await window.electronAPI.killMobileNode();
        //    } else {
        //        console.log("Starting mobile node");
        //        await window.electronAPI.startMobileNode();
        //    }
        //} catch (error) {
        //    console.error('Failed to toggle mobile connection:', error);
        //}
    };

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Get stored client info or create new one
                const client = await window.electronAPI.getStoredClient();
            } catch (error) {
                console.error("Connection check failed:", error);
            }
        };
    
        const interval = setInterval(checkConnection, 5000);
    
        // Run immediately on mount
        checkConnection();
    
        // Cleanup on unmount
        return () => clearInterval(interval);
    }, []);

    // Services status
    const [servicesStatus, setServicesStatus] = useState<{service: string, isRunning: boolean}[]>([]);
    useEffect(() => {
        const updateServicesStatus = async () => {
            const status = await window.electronAPI.getServicesHealth();
            // Only update state if the status has actually changed
            if (!areServicesEqual(servicesStatus, status)) {
                console.log("Services health updated", status);
                setServicesStatus(status);
            }
        };

        // Helper function to compare services arrays
        const areServicesEqual = (prev: typeof servicesStatus, next: typeof servicesStatus) => {
            if (prev.length !== next.length) return false;
            return prev.every((prevService, index) => 
                prevService.service === next[index].service && 
                prevService.isRunning === next[index].isRunning
            );
        };

        // Initial fetch
        updateServicesStatus();

        // Set up interval
        const interval = setInterval(updateServicesStatus, 5000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [servicesStatus]); // Add servicesStatus as dependency

    // My node info
    const [myNodeInfo, setMyNodeInfo] = useState<IClient["info"] | null>(null);
    useEffect(() => {
        const getMyNodeInfo = async () => {
            // Get stored client info or create new one
            const client = await window.electronAPI.getStoredClient();
            if (client) {
                console.log("MYNodeInfo", client.clientInfo)
                setMyNodeInfo(client.clientInfo)
            }
        }
        getMyNodeInfo();
    }, []);


    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    height: "100vh",
                    width: "100vw",
                    background: "#FFFFFF",
                    overflow: "hidden"
                }}
            >
                {
                    !vncWindowOpen && (
                    <Sidebar 
                        onSelect={(view) => {
                            setView(view)
                            setSelectedView(items.find(item => item.id === view) || defaultSelectedView)
                        }}
                        isLive={isLive}
                        onToggleLive={() => {
                            setIsConnecting(true);
                            handleToggleConnection().then(() => {
                                setIsConnecting(false);
                                // Check if socket is connected
                                //window.electronAPI.isConnected().then((isConnected) => {
                                //    window.electronAPI.getServicesHealth().then((status) => {
                                //        console.log("Services health", status);
                                //        setServicesStatus(status);
                                //        setIsConnected(isConnected);
                                //        setIsLive(!isLive);
                                //    });
                                //});
                                window.electronAPI.getServicesHealth().then((status) => {
                                    console.log("Services health", status);
                                    setServicesStatus(status);
                                    //setIsConnected(isConnected);
                                    setIsLive(!isLive);
                                });
                            });
                        }}
                        selectedView={view}
                        disabledItems={!isConnected ? ["browser"] : []}
                        items={items}
                        onToggleConnection={() => {
                            setIsConnecting(true);
                            handleToggleConnection().then(() => {
                                setIsConnecting(false);
                                // Check if socket is connected
                                window.electronAPI.isConnected().then((isConnected) => {
                                    window.electronAPI.getServicesHealth().then((status) => {
                                        console.log("Services health", status);
                                        setServicesStatus(status);
                                        setIsConnected(isConnected);
                                    });
                                });
                            });
                        }}
                        isConnected={isConnected}
                        isServicesRunning={servicesStatus.every(service => service.isRunning)}
                        isConnecting={isConnecting || !hasDocker}
                        error={hasDocker ? undefined : "Docker is not installed/Running"}
                        publicKey={publicKey}
                        myPoints={myPoints}
                        warning={warning}
                        onToggleMobileConnection={() => {
                            setIsMobileConnecting(true);
                            handleToggleMobileConnection().then(() => {
                                // Add 10 second delay before checking connection status
                                setTimeout(() => {
                                    setIsMobileConnecting(false);
                                    // Check if mobile is connected
                                    //window.electronAPI.isMobileConnected().then((isMobileConnected) => {
                                    //    setIsMobileConnected(isMobileConnected);
                                    //});
                                }, 10000);
                            });
                        }}
                        //isMobileConnected={isMobileConnected}
                        isMobileConnecting={isMobileConnecting}
                        onToggleApple={() => {
                            setIsAppleConnecting(true);
                            setIsMobileConnecting(true);
                            setIsConnecting(true);
                            Promise.all([
                                handleToggleConnection(),
                                handleToggleMobileConnection()
                            ]).then(() => {
                                // Wait additional 10 seconds for mobile connection to stabilize
                                setTimeout(async () => {
                                    //const [isSocketConnected, isMobileConnected] = await Promise.all([
                                    //    window.electronAPI.isConnected(),
                                    //    window.electronAPI.isMobileConnected()
                                    //]);

                                    const isSocketConnected = await window.electronAPI.isConnected();
                                    const servicesHealth = await window.electronAPI.getServicesHealth();
                                    
                                    setServicesStatus(servicesHealth);
                                    setIsConnected(isSocketConnected);
                                    //setIsMobileConnected(isMobileConnected);
                                    setIsAppleConnecting(false);
                                    setIsMobileConnecting(false);
                                    setIsConnecting(false);
                                }, 10000);
                            }).catch(error => {
                                console.error('Failed to toggle Apple connections:', error);
                                setIsAppleConnecting(false);
                                setIsMobileConnecting(false);
                                setIsConnecting(false);
                            });
                        }}
                        isAppleConnected={isConnected} //{isMobileConnected || isConnected}
                        isAppleConnecting={isAppleConnecting}
                    />   
                )}
                {
                    <Box
                        sx={{
                            height: "100%",
                            justifyContent: "right",
                            display: "flex",
                        }}
                    >
                        <Box
                            display="flex"
                            flexDirection="column"
                            gap="20px"
                            sx={{
                                height: "100%",
                                width: "calc(100% - 220px)",
                                boxSizing: "border-box"
                            }}
                        >
                            <Box
                                display="flex"
                                flexDirection="column"
                                gap={"24px"}
                                marginLeft="24px"
                                flexGrow={1}
                                height="100%"
                                overflow="hidden"
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: "8px",
                                        alignItems: "center",
                                        borderBottom: "1px solid #E4E4E7",
                                        padding: "16px 24px 16px 24px",
                                        flexShrink: 0
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: "32px",
                                            height: "32px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        {
                                            selectedView.icon
                                        }
                                    </Box>
                                    <Typography
                                        sx={{
                                            color: "#1A1A1E",
                                            fontWeight: "500",
                                            fontSize: "30px",
                                            lineHeight: "38px",
                                            textAlign: "center"
                                        }}
                                    >
                                        {selectedView.text}
                                    </Typography>
                                </Box>
                                
                                <Box
                                    paddingRight="24px"
                                    flexGrow={1}
                                    overflow="auto"
                                    minHeight={0}
                                >
                                    {
                                        view === "dashboard" ? 
                                            <Dashboard 
                                                isOnBoarded={hasDocker} 
                                                myNodeInfo={myNodeInfo}
                                                browsersNum={numBrowsers}
                                                updater={updater}
                                            /> 
                                            : 
                                            view === "browser" ?
                                            <Browser 
                                                onVncWindowClose={() => setVncWindowOpen(false)}
                                                onVncWindowOpen={() => setVncWindowOpen(true)}
                                            />
                                            :
                                            view === "settings" ?
                                                <Settings 
                                                    publicKey={publicKey}
                                                    privateKey={privateKey}
                                                    settings={settings}
                                                    onKeysChange={(
                                                        newSettings
                                                    ) => {
                                                        window.electronAPI.updateSettings(newSettings).then((updatedSettings) => {
                                                            setSettings(updatedSettings);
                                                        })
                                                    }}
                                                />
                                                :
                                                <Logs 
                                                    serviceName={logService ?? "server"}
                                                />
                                    }
                                </Box>
                            </Box>
                            <Box
                                width="100%"
                                height="22px"
                                sx={{
                                    display: "flex",
                                    flexShrink: 0,
                                    background: "#FAFAFA",
                                    borderTop: "1px solid #E4E4E7"
                                }}
                            >
                                <BottomBar 
                                    nodeId={nodeId}
                                    isControllerRunning={servicesStatus.find(service => service.service === "browsers-cmgr-ts")?.isRunning || false}
                                    isConnectedToServer={isConnected}
                                    isApiRunning={servicesStatus.find(service => service.service === "scraper-service-ts")?.isRunning || false}
                                    isMobileNodeRunning={false}//{isMobileConnected}
                                    onShowLogs={(service: "server" | "controller" | "api" | "mobile-node") => {
                                        setLogService(service)
                                        setView("logs")
                                        setSelectedView(items.find(item => item.id === "logs") || defaultSelectedView)
                                    }}
                                    selectedService={logService}
                                    version={version}
                                />
                            </Box>
                        </Box>
                    </Box>
                }
            </Box>
        </ThemeProvider>
    )
}