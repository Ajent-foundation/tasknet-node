import { useState, useEffect } from "react";
import { ThemeOptions, ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography } from "@mui/material";

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
    const [logService, setLogService] = useState<"proxy" | "controller" | "api" | "mobile-node" | null>(null);
    const [hasDocker, setHasDocker] = useState(false);
    const [myPoints, setMyPoints] = useState("Points: coming soon!");
    const [warning, setWarning] = useState<string | undefined>(undefined);

    const [settings, setSettings] = useState<{
        openAIKey: string,
        anthropicKey: string,
        mobileNodeKey: string,
        numOfBrowser: number,
        apiKeyId: string,
        apiKey: string
    } | null>(null);
    useEffect(() => {
        window.electronAPI.getSettings().then((settings) => {
            console.log("Settings", settings);
            setSettings(settings);
        });
    }, []);

    // Points
    useEffect(() => {
        window.electronAPI.getPoints().then((points) => {
            console.log("Points", points);
            if(points.points === -1) {
                setMyPoints("Points: coming soon!");
            } else {
                setMyPoints(`Points: ${points.points}`);
            }
        });
    }, []);


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
            icon: <img src={"static://assets/menu/dashboard.svg"} alt="dashboard" width={"100%"} height={"100%"} />,
            text: "Dashboard",
            show: true
        },
        {
            id: "browser",
            icon: <img src={"static://assets/menu/browser.svg"} alt="world" width={"100%"} height={"100%"} />,
            text: "Browser Nodes",
            show: true
        },
        {
            id: "logs",
            icon: <img src={"static://assets/menu/info.svg"} alt="logs" width={"100%"} height={"100%"} />,
            text: "Logs",
            show: false
        },
        {
            id: "settings",
            icon: <img src={"static://assets/settings.svg"} alt="settings" width={"100%"} height={"100%"} />,
            text: "Settings",
            show: true
        }
    ]

    // Init
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
            setIsConnected(isConnected);
        });

        // Check if mobile is connected
        //window.electronAPI.isMobileConnected().then((isMobileConnected) => {
        //    console.log("Is mobile connected", isMobileConnected);
        //    setIsMobileConnected(isMobileConnected);
        //});

        // Listen for socket status changes
        window.electronAPI.onSocketStatus((status) => {
            setIsConnected(status === 'connected');
        });
    }, []);

    const handleToggleConnection = async () => {
        try {
            if (isConnected) {
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
            }
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
        // Initial fetch
        window.electronAPI.getServicesHealth().then((status) => {
            console.log("Services health", status);
            setServicesStatus(status);
        });

        // Set up interval to fetch every 5 seconds
        const interval = setInterval(() => {
            window.electronAPI.getServicesHealth().then((status) => {
                console.log("Services health", status);
                setServicesStatus(status);
            });
        }, 5000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

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
                    background: "#FFFFFF"
                }}
            >
                {
                    !vncWindowOpen && (
                    <Sidebar 
                        onSelect={(view) => {
                            setView(view)
                            setSelectedView(items.find(item => item.id === view) || defaultSelectedView)
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
                                    setNumBrowsers(settings?.numOfBrowser || 0);
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
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: "8px",
                                        alignItems: "center",
                                        borderBottom: "1px solid #E4E4E7",
                                        padding: "16px 24px 16px 24px"
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
                                >
                                    {
                                        view === "dashboard" ? 
                                            <Dashboard 
                                                isOnBoarded={hasDocker} 
                                                myNodeInfo={myNodeInfo}
                                                browsersNum={numBrowsers}
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
                                                    mobileNodeKey={settings?.mobileNodeKey}
                                                    openaiKey={settings?.openAIKey}
                                                    anthropicKey={settings?.anthropicKey}
                                                    numOfBrowser={settings?.numOfBrowser}
                                                    apiKeyId={settings?.apiKeyId}
                                                    apiKey={settings?.apiKey}
                                                    onKeysChange={(
                                                        openaiKey: string,
                                                        anthropicKey: string,
                                                        mobileNodeKey: string,
                                                        numOfBrowser: number,
                                                        apiKeyId: string,
                                                        apiKey: string
                                                    ) => {
                                                        window.electronAPI.updateSettings({
                                                            openAIKey: openaiKey,
                                                            anthropicKey: anthropicKey,
                                                            mobileNodeKey: mobileNodeKey,
                                                            numOfBrowser: numOfBrowser,
                                                            apiKeyId: apiKeyId,
                                                            apiKey: apiKey
                                                        }).then(() => {
                                                            // //Close settings
                                                            // setView("dashboard");
                                                            // setSelectedView(items.find(item => item.id === "dashboard") || defaultSelectedView);
                                                            //getUpdated settings
                                                            window.electronAPI.getSettings().then((settings) => {
                                                                console.log("Settings", settings);

                                                                window.electronAPI.updateMobileNodeApiKey(settings.mobileNodeKey);
                                                                window.electronAPI.updateApiKey(settings.apiKeyId, settings.apiKey);
                                                                setSettings(settings);
                                                            });
                                                        })
                                                    }}
                                                />
                                                :
                                                <Logs 
                                                    serviceName={logService ?? "proxy"} 
                                                />
                                    }
                                </Box>
                            </Box>
                            <Box
                                width="100%"
                                height="22px"
                                sx={{
                                    background: "#FAFAFA",
                                    borderTop: "1px solid #E4E4E7"
                                }}
                            >
                                <BottomBar 
                                    isControllerRunning={servicesStatus.find(service => service.service === "browsers-service-poc")?.isRunning || false}
                                    isConnectedToServer={isConnected}
                                    isApiRunning={servicesStatus.find(service => service.service === "scraper-service-ts")?.isRunning || false}
                                    isMobileNodeRunning={false}//{isMobileConnected}
                                    onShowLogs={(service: "proxy" | "controller" | "api" | "mobile-node") => {
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