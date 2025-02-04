import { Box, Button, Paper, Typography, TextField, Tooltip, IconButton, Slider } from "@mui/material";
import { useState } from "react";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export interface IProps {
    publicKey: string;
    privateKey: string;
    openaiKey: string;
    anthropicKey: string;
    mobileNodeKey: string;
    apiKeyId: string;
    apiKey: string;
    numOfBrowser: number
    onKeysChange: (openaiKey: string, anthropicKey: string, mobileNodeKey: string, numOfBrowser:number, apiKeyId: string, apiKey: string) => void;
}


export default function View({ publicKey, privateKey, openaiKey, anthropicKey, mobileNodeKey, apiKeyId, apiKey, onKeysChange, numOfBrowser }: IProps) : JSX.Element {
    const [copiedPublicKey, setCopiedPublicKey] = useState(false);
    const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
    const [copiedOpenAI, setCopiedOpenAI] = useState(false);
    const [copiedAnthropic, setCopiedAnthropic] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [copiedMobileNode, setCopiedMobileNode] = useState(false);
    const [copiedApiKey, setCopiedApiKey] = useState(false);
    const [copiedApiKeyId, setCopiedApiKeyId] = useState(false);
    const [openaiInputKey, setOpenaiInputKey] = useState(openaiKey);
    const [anthropicInputKey, setAnthropicInputKey] = useState(anthropicKey);
    const [mobileNodeInputKey, setMobileNodeInputKey] = useState(mobileNodeKey);
    const [apiKeyIdInputKey, setApiKeyIdInputKey] = useState(apiKeyId);
    const [apiKeyInputKey, setApiKeyInputKey] = useState(apiKey);
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);
    const [showAnthropicKey, setShowAnthropicKey] = useState(false);
    const [showMobileNodeKey, setShowMobileNodeKey] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showApiKeyId, setShowApiKeyId] = useState(false);
    const [browserCount, setBrowserCount] = useState(numOfBrowser);
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

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            '& fieldset': {
                borderColor: '#E4E4E7',
            },
            '&:hover fieldset': {
                borderColor: '#E4E4E7',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#2563EB',
            },
            '& input': {
                color: '#1A1A1E',
                fontSize: '16px',
                lineHeight: '24px',
                padding: '10px 14px',
            }
        }
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

    const handleCopy = (field: 'public' | 'private' | 'openai' | 'anthropic' | 'mobileNode' | 'apiKey' | 'apiKeyId', value: string) => {
        navigator.clipboard.writeText(value).then(() => {
            switch (field) {
                case 'public':
                    setCopiedPublicKey(true);
                    setTimeout(() => setCopiedPublicKey(false), 2000);
                    break;
                case 'private':
                    setCopiedPrivateKey(true);
                    setTimeout(() => setCopiedPrivateKey(false), 2000);
                    break;
                case 'openai':
                    setCopiedOpenAI(true);
                    setTimeout(() => setCopiedOpenAI(false), 2000);
                    break;
                case 'anthropic':
                    setCopiedAnthropic(true);
                    setTimeout(() => setCopiedAnthropic(false), 2000);
                    break;
                case 'mobileNode':
                    setCopiedMobileNode(true);
                    setTimeout(() => setCopiedMobileNode(false), 2000);
                    break;
                case 'apiKey':
                    setCopiedApiKey(true);
                    setTimeout(() => setCopiedApiKey(false), 2000);
                    break;
                case 'apiKeyId':
                    setCopiedApiKeyId(true);
                    setTimeout(() => setCopiedApiKeyId(false), 2000);
                    break;
            }
        });
    };

    const hasChanges = openaiInputKey !== openaiKey || 
                      anthropicInputKey !== anthropicKey || 
                      mobileNodeInputKey !== mobileNodeKey ||
                      apiKeyIdInputKey !== apiKeyId ||
                      apiKeyInputKey !== apiKey ||
                      browserCount !== numOfBrowser;

    return (
        <Box
            display="flex"
            flexDirection="column"
            gap="16px"
        >
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
                            Wallet
                        </Typography>
                    </Box>

                    <Box
                        display="flex"
                        flexDirection={"column"}
                        gap={"8px"}
                    >
                        <Box display="flex" flexDirection="column" gap="6px">
                            <Typography sx={labelSx}>Wallet Public Key</Typography>
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
                            <Typography sx={labelSx}>Wallet Private Key</Typography>
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

            <Paper sx={{...paperSx, height: "fit-content", padding: "24px"}}>
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
                        <Typography sx={titleSx}>
                            API Keys
                        </Typography>
                    </Box>

                    <Box
                        display="flex"
                        flexDirection={"column"}
                        gap={"8px"}
                    >
                        <Box display="flex" flexDirection="column" gap="6px">
                            <Typography sx={labelSx}>OpenAI API Key</Typography>
                            <Box sx={{ display: 'flex', gap: '8px' }}>
                                <TextField 
                                    type={showOpenAIKey ? "text" : "password"}
                                    placeholder="Enter your OpenAI API key"
                                    value={openaiInputKey}
                                    onChange={(e) => setOpenaiInputKey(e.target.value)}
                                    sx={inputSx}
                                    fullWidth
                                    variant="outlined"
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <IconButton
                                                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                                                    edge="end"
                                                >
                                                    {showAnthropicKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            ),
                                        }
                                    }}
                                />
                                <Tooltip 
                                    open={copiedOpenAI}
                                    title="Copied!"
                                    placement="top"
                                    arrow
                                    onClose={() => setCopiedOpenAI(false)}
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
                                        onClick={() => handleCopy('openai', openaiKey)}
                                    >
                                        {copiedOpenAI ? (
                                            <img src={"static://assets/success.svg"} alt="copied" width={"20px"} height={"20px"}/>
                                        ) : (
                                            <img src={"static://assets/copy.svg"} alt="copy" width={"20px"} height={"20px"}/>
                                        )}
                                    </Box>
                                </Tooltip>
                            </Box>
                        </Box>
                        <Box display="flex" flexDirection="column" gap="6px">
                            <Typography sx={labelSx}>Anthropic API Key</Typography>
                            <Box sx={{ display: 'flex', gap: '8px' }}>
                                <TextField 
                                    type={showAnthropicKey ? "text" : "password"}
                                    placeholder="Enter your Anthropic API key"
                                    value={anthropicInputKey}
                                    onChange={(e) => setAnthropicInputKey(e.target.value)}
                                    sx={inputSx}
                                    fullWidth
                                    variant="outlined"
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <IconButton
                                                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                                                    edge="end"
                                                >
                                                    {showAnthropicKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            ),
                                        }
                                    }}
                                />
                                <Tooltip 
                                    open={copiedAnthropic}
                                    title="Copied!"
                                    placement="top"
                                    arrow
                                    onClose={() => setCopiedAnthropic(false)}
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
                                        onClick={() => handleCopy('anthropic', anthropicKey)}
                                    >
                                        {copiedAnthropic ? (
                                            <img src={"static://assets/success.svg"} alt="copied" width={"20px"} height={"20px"}/>
                                        ) : (
                                            <img src={"static://assets/copy.svg"} alt="copy" width={"20px"} height={"20px"}/>
                                        )}
                                    </Box>
                                </Tooltip>
                            </Box>
                        </Box>
                        {/*
                        <Box display="flex" flexDirection="column" gap="6px">
                            <Typography sx={labelSx}>Node API Key</Typography>
                            <Box sx={{ display: 'flex', gap: '8px' }}>
                                <TextField 
                                    type={showMobileNodeKey ? "text" : "password"}
                                    placeholder="Enter your MoNode API key"
                                    value={mobileNodeInputKey}
                                    onChange={(e) => setMobileNodeInputKey(e.target.value)}
                                    sx={inputSx}
                                    fullWidth
                                    variant="outlined"
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <IconButton
                                                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                                                    edge="end"
                                                >
                                                    {showAnthropicKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            ),
                                        }
                                    }}
                                />
                                <Tooltip 
                                    open={copiedMobileNode}
                                    title="Copied!"
                                    placement="top"
                                    arrow
                                    onClose={() => setCopiedMobileNode(false)}
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
                                        onClick={() => handleCopy('mobileNode', mobileNodeKey)}
                                    >
                                        {copiedMobileNode ? (
                                            <img src={"static://assets/success.svg"} alt="copied" width={"20px"} height={"20px"}/>
                                        ) : (
                                            <img src={"static://assets/copy.svg"} alt="copy" width={"20px"} height={"20px"}/>
                                        )}
                                    </Box>
                                </Tooltip>
                            </Box>
                        </Box>*/}
                        <Box display="flex" flexDirection="row" gap="8px">
                            <Box display="flex" flexDirection="column" gap="6px" width={"35%"}>
                                <Typography sx={labelSx}>API Key ID</Typography>
                                <Box sx={{ display: 'flex', gap: '8px' }}>
                                    <TextField 
                                        type={showApiKeyId ? "text" : "password"}
                                        placeholder="Enter your API Key ID"
                                        value={apiKeyIdInputKey}
                                        onChange={(e) => setApiKeyIdInputKey(e.target.value)}
                                        sx={inputSx}
                                        fullWidth
                                        variant="outlined"
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <IconButton
                                                        onClick={() => setShowApiKeyId(!showApiKeyId)}
                                                        edge="end"
                                                    >
                                                        {showApiKeyId ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                ),
                                            }
                                        }}
                                    />
                                    <Tooltip 
                                        open={copiedApiKeyId}
                                        title="Copied!"
                                        placement="top"
                                        arrow
                                        onClose={() => setCopiedApiKeyId(false)}
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
                                            onClick={() => handleCopy('apiKeyId', apiKeyId)}
                                        >
                                            {copiedApiKeyId ? (
                                                <img src={"static://assets/success.svg"} alt="copied" width={"20px"} height={"20px"}/>
                                            ) : (
                                                <img src={"static://assets/copy.svg"} alt="copy" width={"20px"} height={"20px"}/>
                                            )}
                                        </Box>
                                    </Tooltip>
                                </Box>
                            </Box>
                            <Box display="flex" flexDirection="column" gap="6px" flexGrow={1}>
                                <Typography sx={labelSx}>Node API Key</Typography>
                                <Box sx={{ display: 'flex', gap: '8px' }}>
                                    <TextField 
                                        type={showApiKey ? "text" : "password"}
                                        placeholder="Enter your API Key"
                                        value={apiKeyInputKey}
                                        onChange={(e) => setApiKeyInputKey(e.target.value)}
                                        sx={inputSx}
                                        fullWidth
                                        variant="outlined"
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <IconButton
                                                        onClick={() => setShowApiKey(!showApiKey)}
                                                        edge="end"
                                                    >
                                                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                ),
                                            }
                                        }}
                                    />
                                    <Tooltip 
                                        open={copiedApiKey}
                                        title="Copied!"
                                        placement="top"
                                        arrow
                                        onClose={() => setCopiedApiKey(false)}
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
                                            onClick={() => handleCopy('apiKey', apiKey)}
                                        >
                                            {copiedApiKey ? (
                                                <img src={"static://assets/success.svg"} alt="copied" width={"20px"} height={"20px"}/>
                                            ) : (
                                                <img src={"static://assets/copy.svg"} alt="copy" width={"20px"} height={"20px"}/>
                                            )}
                                        </Box>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Box>
                        <Box display="flex" flexDirection="column" gap="6px" mt="16px">
                            <Typography sx={labelSx}>Number of Browsers: {browserCount}</Typography>
                            <Box sx={{ px: 1 }}>
                                <Slider
                                    value={browserCount}
                                    onChange={(_, value) => setBrowserCount(value as number)}
                                    min={1}
                                    max={20}
                                    marks
                                    valueLabelDisplay="auto"
                                    aria-label="Number of browsers"
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Box
                        display="flex"
                        justifyContent="flex-end"
                    >
                        <Box
                            width="200px"
                        >
                            <Button 
                                variant="contained" 
                                color="primary" 
                                disabled={!hasChanges}
                                sx={{width:"100%"}}
                                onClick={() => onKeysChange(openaiInputKey, anthropicInputKey, mobileNodeInputKey, browserCount, apiKeyIdInputKey, apiKeyInputKey)}
                            >
                                Save
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    )
}