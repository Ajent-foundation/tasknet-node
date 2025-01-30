import Drawer from '@mui/material/Drawer';
import { Stack, Switch, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Button, Tooltip, TextField } from '@mui/material';
import { TView, TListItem } from '../..';
import { useState } from 'react';

export interface ProductProps {
    onSelect: (view: TView) => void;
    selectedView: TView;
    disabledItems?: TView[];
    items: TListItem[];
    onToggleConnection: () => void;
    onToggleMobileConnection: () => void;
    onToggleApple: () => void;
    isConnected: boolean;
    isAppleConnected: boolean;
    isConnecting: boolean;
    isMobileConnecting: boolean;
    isAppleConnecting: boolean;
    isServicesRunning: boolean;
    publicKey: string;
    error?: string;
    warning?: string;
    myPoints: string;
}   


export default function Product({ 
    onSelect, 
    selectedView, 
    disabledItems, 
    items, 
    onToggleConnection, 
    onToggleMobileConnection,
    onToggleApple,
    isConnected, 
    isConnecting,
    isMobileConnecting,
    isServicesRunning,
    publicKey="",
    error,
    warning,
    myPoints,
    isAppleConnected,
    isAppleConnecting
}: ProductProps) : JSX.Element {
    const [copied, setCopied] = useState(false);
    
    const drawerWidth = 220;

    const toggleTextSx = {
        fontWeight: 500,
        color: "#3F3F45",
        lineHeight: "20px",
        fontSize: "14px"
    }
    const publicKeySx = {
        fontWeight: 600,
        fontSize: "12px",
        lineHeight: "18px",
        color: "#51525B"
    }

    const publicKeyValueSx = {
        fontWeight: 400,
        fontSize: "16px",
        lineHeight: "24px",
        color: "#70707A"
    }

    const handleCopyClick = () => {
        navigator.clipboard.writeText(publicKey);
        setTimeout(() => {
            setCopied(true);
        }, 100);
        
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <div
            className="sidebar-container"
        >
            <Drawer
                anchor="left"
                variant="permanent"
                open={true}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                      width: drawerWidth,
                      boxSizing: 'border-box',
                    },

                }}
                PaperProps={{
                    sx: {
                        background: "#FAFAFA",
                        padding: "16px"

                    }
                }}
            >
                {/* Logo & Menu */}
                <Stack 
                    direction="column" 
                    justifyContent="center" 
                    alignItems="center"
                    spacing={"24px"}
                    display="flex"
                    flexGrow={1}
                    width="100%"
                >
                    <Box
                        display="flex"
                        flexDirection="row"
                        gap="8px"
                        width="100%"
                    >
                        <img src={"static://assets/Icon_Black.svg"} alt="Logo" width={"24px"} height={"24px"} style={{marginLeft: "8px"}}/>
                        <Typography sx={{
                            color: "#000",
                            fontSize: "22px",
                            fontWeight: 600,
                            lineHeight: "24px"
                        }}>
                            Task Net
                        </Typography>
                    </Box>

                    {/* Public Key */}
                    <Box
                        width="100%"
                        sx={{
                            padding: "8px",
                            borderRadius: "6px",
                            border: "0.5px solid #D1D1D6",
                            boxSizing: "border-box"
                        }}
                        display="flex"
                        flexDirection="column"
                        gap="4px"
                    >
                        <Box>
                            <Typography sx={publicKeySx}>
                                Public Key
                            </Typography>
                        </Box>
                        <Box
                            width="100%"
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                background: "#FFF",
                                borderRadius: "8px",
                                border: "1px solid #D1D1D6",
                            }}
                        >
                            <Box
                                sx={{
                                    borderRight: "1px solid #D1D1D6",
                                }}
                                flexGrow={1}
                            >
                                <Box
                                    padding="8px"
                                >
                                    <Typography sx={publicKeyValueSx}>
                                        {
                                            publicKey &&
                                            `${publicKey.slice(0, 9)}...${publicKey.slice(-4)}`
                                        }
                                    </Typography>
                                </Box>
                            </Box>
                            <Tooltip 
                                open={copied}
                                title="Copied!"
                                placement="top"
                                arrow
                                onClose={() => setCopied(false)}
                            >
                                <Box
                                    width="40px"
                                    height="40px"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{ 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            backgroundColor: '#F4F4F5'
                                        }
                                    }}
                                    onClick={handleCopyClick}
                                >
                                    {copied ? (
                                        <img src={"static://assets/success.svg"} alt="copied" width={"20px"} height={"20px"}/>
                                    ) : (
                                        <img src={"static://assets/copy.svg"} alt="copy" width={"20px"} height={"20px"}/>
                                    )}
                                </Box>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Points */}
                    <Box
                        display="flex"
                        gap="4px"
                        sx={{
                            width: "100%",
                            borderRadius: "6px",
                            border: "1px solid #107569",
                            padding: "4px 8px 4px 6px",
                            boxSizing: "border-box",
                            background: "#F0FDF9",
                        }}
                    >
                        <img src={"static://assets/database.svg"} alt="database" width={"16px"} height={"16px"}/>
                        <Typography
                            fontSize="14px"
                            fontWeight={500}
                            color="#0E9384"
                            lineHeight={"20px"}
                        >
                            {myPoints}
                        </Typography>
                    </Box>

                    {/* List of views */}
                    <Box
                        width="100%"
                        display="flex"
                        flexGrow={1}
                    >
                        <List
                            sx={{
                                width: "100%"
                            }}
                        >
                            {items.filter(item => item.show).map((item, index) => (
                                <ListItem key={`${item.text}-${index}`} disablePadding sx={{mb:"16px"}}>
                                    <ListItemButton
                                        sx={{
                                            //padding: "16px",
                                            borderRadius: "8px",
                                            background: selectedView === item.id ? "#F4F4F5" : undefined,
                                            '&:hover': {
                                                bgcolor: "#F4F4F5",
                                            }
                                        }}
                                        onClick={() => onSelect(item.id)}
                                        disabled={disabledItems?.includes(item.id)}
                                    >
                                        <ListItemIcon 
                                            sx={{
                                                minWidth: "20px",
                                                height: "20px",
                                                padding: "0px",
                                                marginRight: "4px"
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={item.text} 
                                            primaryTypographyProps={{
                                                fontWeight: selectedView === item.id ? 600 : 400,
                                                color: "#3F3F45",
                                                lineHeight: "20px",
                                                fontSize: "14px"
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Box>

                    {/* Going live */}
                    <Stack
                        spacing={"16px"}
                        width="100%"
                    >
                        {
                            warning &&
                            <Box
                                display="flex"
                                gap="4px"
                                sx={{
                                    width: "100%",
                                    borderRadius: "6px",
                                    border: "1px solid #ffcc00",
                                    padding: "4px 8px 4px 6px",
                                    boxSizing: "border-box",
                                    background: "#fffae6",
                                }}
                            >
                                <img src={"static://assets/warning-yellow.svg"} alt="database" width={"16px"} height={"16px"}/>
                                <Typography
                                    fontSize="14px"
                                    fontWeight={500}
                                    color="#ffcc00"
                                    lineHeight={"20px"}
                                    sx={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {warning}
                                </Typography>
                            </Box>
                        }

                        <Box
                            display="flex"
                            flexDirection="column"
                            gap="8px"
                        >
                            <Tooltip arrow title={error || ""}>
                                <Box
                                    display="flex"
                                    flexDirection="row"
                                    gap="8px"
                                >
                                    <Switch 
                                        checked={isAppleConnected}
                                        disabled={isAppleConnecting}
                                        onClick={onToggleApple}
                                        color={
                                            "default"
                                        }
                                    />
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap="8px"
                                    >
                                        {
                                            isAppleConnected && !isAppleConnecting ? 
                                                    <img src={"static://assets/greenDot.svg"} alt="connected"/> 
                                                :
                                                <img src={"static://assets/redDot.svg"} alt="disconnected"/>
                                        }
                                        <Typography sx={{...toggleTextSx, color: isAppleConnected && !isAppleConnecting ? "#0E9384" : "#D92D20"}}>
                                            {isAppleConnected && !isAppleConnecting ? "Live" : "Go live"}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Tooltip>
                        </Box>
                    </Stack>
                </Stack>
            </Drawer>
        </div>
    )
}