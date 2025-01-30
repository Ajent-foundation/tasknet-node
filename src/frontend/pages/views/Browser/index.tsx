import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
//@ts-ignore
import RFB from '@novnc/novnc';
import { 
    Box, 
    Button, 
    Card, 
    CardContent, 
    Typography, 
    Stack, 
    Divider, 
    Paper,
    styled,
    CircularProgress
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const StyledOverlay = styled('div')({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: -1,
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    '&.visible': {
        zIndex: 9999999999,
        pointerEvents: 'auto',
        display: 'flex',
    }
});

const VncScreen = styled('div')({
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    maxWidth: '90vw',
    maxHeight: '90vh',
    minWidth: '800px',
    minHeight: '600px',
    width: '1024px',
    height: '768px',
    zIndex: 10000000000,
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    transform: 'translateZ(0)',
    isolation: 'isolate'
});

const TopBar = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    position: 'relative',
    zIndex: 10000000001
});

interface Viewport {
    width: number;
    height: number;
}

interface Ports {
    vnc: number;
    app: number;
    browser: number;
}

interface Labels {
    id: string;
    ip: string;
    status: string;
}

interface Browser {
    name: string;
    index: number;
    isUp: boolean;
    isRemoving: boolean;
    lastUsed: number;
    createdAt: number;
    leaseTime: number;
    isDebug: boolean;
    viewport: Viewport;
    ports: Ports;
    labels: Labels;
    webhook: string;
    sessionID: string;
    clientID: string;
    fingerprintID: string;
}

export default function View({
    onVncWindowClose,
    onVncWindowOpen
}: {
    onVncWindowClose: () => void;
    onVncWindowOpen: () => void;
}): JSX.Element {
    const [rfb, setRfb] = useState<any>(null);
    const [desktopName, setDesktopName] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [capacity, setCapacity] = useState<number>(0);
    const [browsers, setBrowsers] = useState<Browser[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);

    const BASE_IP = "http://localhost";
    const POC_PORT = 8200;

    const connectedToServer = useCallback(() => {
        setStatus(`Connected to ${desktopName}`);
        setIsConnecting(false);
    }, [desktopName]);

    const disconnectedFromServer = useCallback((e: any) => {
        setStatus(e.detail.clean ? "Disconnected" : "Something went wrong, connection is closed");
    }, []);

    const credentialsAreRequired = useCallback((e: any) => {
        const password = prompt("Password Required:");
        rfb?.sendCredentials({ password });
    }, [rfb]);

    const updateDesktopName = useCallback((e: any) => {
        setDesktopName(e.detail.name);
    }, []);

    const viewVNC = useCallback((port: number) => {
        setRfb(true);
        setIsConnecting(true);
        onVncWindowOpen();

        setTimeout(() => {
            const screen = document.getElementById('screen');
            if (!screen) {
                console.error('Screen element not found');
                return;
            }

            const newRfb = new RFB(
                screen,
                `ws://localhost:${port}`
            );

            newRfb.addEventListener("connect", connectedToServer);
            newRfb.addEventListener("disconnect", disconnectedFromServer);
            newRfb.addEventListener("credentialsrequired", credentialsAreRequired);
            newRfb.addEventListener("desktopname", updateDesktopName);

            newRfb.viewOnly = false;
            newRfb.scaleViewport = false;

            setRfb(newRfb);
            document.querySelector(".overlay")?.setAttribute("style", "z-index: 1");
        }, 0);
    }, [connectedToServer, disconnectedFromServer, credentialsAreRequired, updateDesktopName, onVncWindowOpen]);

    const closeBrowser = async (index: number) => {
        await fetch(`${BASE_IP}:${POC_PORT}/freeBrowser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ browserID: `browser-${index}` })
        });
    };

    const getDetailedBrowsersStatus = useCallback(async () => {
        try {
            const response = await fetch(`${BASE_IP}:${POC_PORT}/detailedStatus`);
            const data = await response.json();
            console.log("Detailed browsers status:", data);
            if (data.success) {
                setCapacity(data.capacity);
                setBrowsers(data.browsers);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        getDetailedBrowsersStatus();
        const interval = setInterval(getDetailedBrowsersStatus, 5000);
        return () => clearInterval(interval);
    }, [getDetailedBrowsersStatus]);

    const titleSx = {
        fontSize: "18px",
        fontWeight: "600",
        lineHeight: "38px",
        color: "#3F3F45",
    }

    const textSx = {
        fontSize: "14px",
        fontWeight: "500",
        lineHeight: "20px",
        color: "#51525B",
    }

    const closeVncViewer = useCallback(() => {
        if (rfb) {
            rfb.disconnect();
            rfb.removeEventListener("connect", connectedToServer);
            rfb.removeEventListener("disconnect", disconnectedFromServer);
            rfb.removeEventListener("credentialsrequired", credentialsAreRequired);
            rfb.removeEventListener("desktopname", updateDesktopName);
            setRfb(null);
            setStatus('');
            setIsConnecting(false);
            onVncWindowClose();
        }
    }, [rfb, connectedToServer, disconnectedFromServer, credentialsAreRequired, updateDesktopName, onVncWindowClose]);

    return (
        <Stack spacing={3} sx={{ p: 3 }}>   
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)'
                },
                gap: 2,
                gridAutoRows: '1fr',
                alignItems: 'stretch',
            }}>
                {browsers
                    .filter(browser => browser !== null && browser !== undefined)
                    .map((browser) => (
                        <Paper 
                            key={browser.ports.browser}
                            sx={{ 
                                borderRadius: "4px",
                                border: "1px solid #E4E4E7",
                                background: "#FFF",
                                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                padding: "16px",
                                display: 'flex',
                                flexDirection: 'column',
                                height: 'auto',
                            }}
                        >
                            <Box
                                display="flex"
                                flexDirection="column"
                                justifyContent="space-between"
                                height="100%"
                            >
                                <Box>
                                    <Typography variant="h6" gutterBottom sx={titleSx}>
                                        Browser-{browser.ports.browser-10222}
                                    </Typography>
                                    <Divider sx={{ my: 1, borderColor: '#E4E4E7', marginBottom: "16px" }} />
                                    <Typography variant="body2" gutterBottom sx={textSx}>
                                        Last Used: {browser.lastUsed ? new Date(browser.lastUsed).toLocaleString() : 'Never'}
                                    </Typography>
                                    <Typography variant="body2" gutterBottom sx={textSx}>
                                        Browser: {browser.ports.browser}
                                    </Typography>
                                    <Typography variant="body2" gutterBottom sx={textSx}>
                                        Express: {7070+(browser.ports.vnc-15900)}
                                    </Typography>
                                    <Typography variant="body2" gutterBottom sx={textSx}>
                                        VNC: {browser.ports.vnc}
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    <Button 
                                        variant="contained"
                                        fullWidth
                                        onClick={() => browser.isUp && viewVNC(browser.ports.vnc)}
                                        disabled={browser.leaseTime === -1}
                                        sx={{
                                            //bgcolor: browser.isUp ? '#9747FF' : '#0048E5',
                                            //'&:hover': {
                                            //    bgcolor: browser.isUp ? '#9747FF' : '#1F2937'
                                            //},
                                            color: '#FFFFFF'
                                        }}
                                    >
                                        View (VNC)
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
            </Box>

            {rfb && createPortal(
                <StyledOverlay className={`overlay visible`}>
                    <VncScreen className="vnc__screen">
                        <TopBar>
                            <Typography variant="subtitle1" component="div">
                                {status}
                            </Typography>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<CloseIcon />}
                                onClick={closeVncViewer}
                            >
                                Close
                            </Button>
                        </TopBar>
                        <div id="screen" style={{ position: 'relative', height: '100%' }}>
                            {isConnecting && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        width: '100%',
                                        height: '100%',
                                        zIndex: 1
                                    }}
                                >
                                    <CircularProgress sx={{ color: '#9747FF' }} />
                                </Box>
                            )}
                        </div>
                    </VncScreen>
                </StyledOverlay>,
                document.body
            )}
        </Stack>
    );
}