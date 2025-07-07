import { Box, Button, Paper, Typography, TextField, Tooltip, IconButton, Slider, Select, MenuItem, Checkbox, FormControlLabel, Switch, Divider } from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import { Visibility, VisibilityOff, InfoOutlined } from "@mui/icons-material";

export interface IFormField {
    id: string,
    label: string,
    value: string,
    type: "text" | "password" | "slider" | "toggle" | "checkbox" | "select" | "map" | "divider" | "label",
    validate?: (value: unknown) => boolean,
    isReadOnly?: boolean,
    options?: Array<{label: string, value: string}>, // For select type
    min?: number,  // For slider type
    max?: number,  // For slider type
    step?: number, // For slider type
    mapFields?: Record<string, string>, // For map type - predefined keys and their values
    hint?: string, // For hover tooltip
    variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "subtitle1" | "subtitle2" | "body1" | "body2", // For label type
    color?: string, // For label type
    dividerVariant?: "fullWidth" | "inset" | "middle", // For divider type
    dividerColor?: string, // For divider type
}

export interface IProps {
    title: string,
    showSaveButton?: boolean,
    onSave?: (values: Record<string, unknown>) => void,
    onSavedFields?: (fields: Record<string, string>) => void,
    fields?: IFormField[][]  // This is correct for array of arrays
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
    width: '100%',
    height: '44px'
}

export default function Component({ title, showSaveButton = false, onSave, onSavedFields, fields = [] }: IProps) : JSX.Element {
    const [values, setValues] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        fields.flat().forEach(field => {
            if (field.type === 'toggle' || field.type === 'checkbox') {
                initial[field.id] = field.value === 'true';
            } else if (field.type === 'map') {
                initial[field.id] = field.value || {};
            } else {
                initial[field.id] = field.value || '';
            }
        });
        return initial;
    });
    
    const [initialValues, setInitialValues] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        fields.flat().forEach(field => {
            if (field.type === 'toggle' || field.type === 'checkbox') {
                initial[field.id] = field.value === 'true';
            } else if (field.type === 'map') {
                initial[field.id] = field.value || {};
            } else {
                initial[field.id] = field.value || '';
            }
        });
        return initial;
    });

    const hasChanges = useMemo(() => {
        return Object.keys(initialValues).some(key => {
            // For objects (like map type), do a deep comparison
            if (typeof initialValues[key] === 'object' && initialValues[key] !== null) {
                return JSON.stringify(initialValues[key]) !== JSON.stringify(values[key]);
            }
            // For primitive values, do a direct comparison
            return initialValues[key] !== values[key];
        });
    }, [initialValues, values]);

    const handleChange = (key: string, value: unknown) => {
        setValues(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = () => {
        if (onSave) {
            onSave(values);
        }
        if (onSavedFields) {
            // Convert values to strings for the onSavedFields callback, except for objects
            const stringValues: Record<string, string> = {};
            Object.entries(values).forEach(([key, value]) => {
                if (typeof value !== 'object' || value === null) {
                    stringValues[key] = String(value);
                } else {
                    stringValues[key] = value;
                }
            });
            onSavedFields(stringValues);
        }
        // Update initialValues to match the new values after saving
        setInitialValues({...values});
    };

    return fields.length > 0 && <Paper sx={{...{
        borderRadius: "4px",
        border: "1px solid #E4E4E7",
        background: "#FFF",
        boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
        padding: "16px",
        height: "266px",
    }, height: "fit-content", padding: "24px"}}>
        <Box
            display="flex"
            flexDirection={"column"}
            gap={"24px"}
        >
            { /* Header */ }
            <Box
                display="flex"
                flexDirection={"row"}
                gap={"8px"}
                alignItems="center"
            >
                <Typography sx={{
                    fontSize: "16px",
                    fontWeight: "600",
                    lineHeight: "24px",
                    color: "#1A1A1E",
                }}>
                    {title}
                </Typography>
            </Box>

            { /* Content */ }
            <Box
                display="flex"
                flexDirection={"column"}
                gap={"8px"}
            >
                {fields?.map((rowFields, rowIndex) => (
                    <Box 
                        key={rowIndex}
                        display="flex"
                        flexDirection="row"
                        gap="8px"
                    >
                        {rowFields.map((field, colIndex) => (
                            <Box key={`${rowIndex}-${colIndex}`} flex={1} display="flex" flexDirection="column" justifyContent="center">
                                {(() => {
                                    switch (field.type) {
                                        case "text":
                                            return (
                                                <Box display="flex" flexDirection="column" gap="6px">
                                                    <LabelWithHint label={field.label} hint={field.hint} />
                                                    <TextField
                                                        value={values[field.id]}
                                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                                        sx={inputSx}
                                                        fullWidth
                                                        disabled={field.isReadOnly}
                                                    />
                                                </Box>
                                            );
                                        case "password":
                                            return <PasswordField
                                                key={colIndex}
                                                label={field.label}
                                                value={values[field.id]}
                                                onChange={(value) => handleChange(field.id, value)}
                                                hint={field.hint}
                                                isReadOnly={field.isReadOnly}
                                            />;
                                        case "slider":
                                            return <SliderField
                                                key={colIndex}
                                                label={field.label}
                                                value={values[field.id] || field.value}
                                                min={field.min || 0}
                                                max={field.max || 100}
                                                step={field.step || 1}
                                                onChange={(value) => handleChange(field.id, value)}
                                                hint={field.hint}
                                                isReadOnly={field.isReadOnly}
                                            />;
                                        case "select":
                                            return <SelectField
                                                key={colIndex}
                                                label={field.label}
                                                value={values[field.id] || field.value}
                                                options={field.options || []}
                                                onChange={(value) => handleChange(field.id, value)}
                                                hint={field.hint}
                                                isReadOnly={field.isReadOnly}
                                            />;
                                        case "toggle":
                                            return <ToggleField
                                                key={colIndex}
                                                label={field.label}
                                                value={values[field.id]}
                                                onChange={(value) => handleChange(field.id, value)}
                                            />;
                                        case "checkbox":
                                            return <CheckboxField
                                                key={colIndex}
                                                label={field.label}
                                                value={values[field.id] || field.value}
                                                onChange={(value) => handleChange(field.id, value)}
                                            />;
                                        case "map":
                                            return <MapField
                                                key={colIndex}
                                                label={field.label}
                                                fields={field.mapFields || {}}
                                                values={values[field.id] as Record<string, string> || {}}
                                                onChange={(value) => handleChange(field.id, value)}
                                                hint={field.hint}
                                            />;
                                        case "divider":
                                            return <DividerField
                                                key={colIndex}
                                                variant={field.dividerVariant}
                                                color={field.dividerColor}
                                            />;
                                        case "label":
                                            return <LabelField
                                                key={colIndex}
                                                label={field.label}
                                                variant={field.variant}
                                                color={field.color}
                                            />;
                                        // Add other cases for toggle, checkbox, select
                                    }
                                })()}
                            </Box>
                        ))}
                    </Box>
                ))}
            </Box>

            { /* Footer */ }
            {
                showSaveButton &&
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
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    </Box>
                </Box>
            }
        </Box>
    </Paper>
}

// Component implementations
const LabelWithHint = ({ label, hint }: { label: string, hint?: string }) => (
    <Box display="flex" alignItems="center" gap={1}>
        <Typography sx={labelSx}>{label}</Typography>
        {hint && (
            <Tooltip title={hint} arrow placement="top">
                <InfoOutlined sx={{ fontSize: 16, color: '#71717A', cursor: 'help' }} />
            </Tooltip>
        )}
    </Box>
);

const PasswordField = ({ label, value, onChange, hint, isReadOnly }: {
    label: string,
    value: string,
    onChange: (value: string) => void,
    hint?: string,
    isReadOnly?: boolean
}) => {
    const [showPassword, setShowPassword] = useState(false);
    
    return (
        <Box display="flex" flexDirection="column" gap="6px">
            <LabelWithHint label={label} hint={hint} />
            <Box sx={{ display: 'flex', gap: '8px' }}>
                <TextField 
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    sx={inputSx}
                    fullWidth
                    variant="outlined"
                    disabled={isReadOnly}
                    slotProps={{
                        input: {
                            endAdornment: !isReadOnly && (
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            ),
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

const SliderField = ({ label, value, min, max, step, onChange, hint, isReadOnly }: {
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (value: number) => void,
    hint?: string,
    isReadOnly?: boolean
}) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    return (
        <Box display="flex" flexDirection="column" gap="6px">
            <LabelWithHint label={`${label}: ${numericValue}`} hint={hint} />
            <Box sx={{ px: 1 }}>
                <Slider
                    value={numericValue}
                    onChange={(_, value) => onChange(value as number)}
                    min={min}
                    max={max}
                    step={step}
                    marks
                    valueLabelDisplay="auto"
                    disabled={isReadOnly}
                />
            </Box>
        </Box>
    );
};

const MapField = ({ label, fields, values, onChange, hint }: {
    label: string,
    fields: Record<string, string>,
    values: Record<string, string>,
    onChange: (values: Record<string, string>) => void,
    hint?: string
}) => {
    const handleFieldChange = (key: string, value: string) => {
        onChange({
            ...values,
            [key]: value
        });
    };

    return (
        <Box display="flex" flexDirection="column" gap="8px">
            <LabelWithHint label={label} hint={hint} />
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px',
                '& .MuiTextField-root': {
                    margin: 0
                }
            }}>
                {Object.entries(fields).map(([key, defaultValue], index) => (
                    <Box key={index} display="flex" flexDirection="row" gap="6px">
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 14px',
                            backgroundColor: '#F4F4F5',
                            borderRadius: '4px',
                            color: '#52525A',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            {key}
                        </Box>
                        <TextField
                            key={index}
                            value={values[key] ?? defaultValue}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            sx={inputSx}
                            fullWidth
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

const SelectField = ({ label, value, options, onChange, hint, isReadOnly }: {
    label: string,
    value: string,
    options: Array<{label: string, value: string}>,
    onChange: (value: string) => void,
    hint?: string,
    isReadOnly?: boolean
}) => {
    return (
        <Box display="flex" flexDirection="column" gap="6px">
            <LabelWithHint label={label} hint={hint} />
            <Select
                value={value}
                onChange={(e) => onChange(e.target.value as string)}
                sx={{
                    ...valueSx,
                    '& .MuiSelect-select': {
                        padding: '10px 14px',
                    },
                    '& .MuiMenuItem-root': {
                        color: '#1A1A1E',
                    }
                }}
                disabled={isReadOnly}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            '& .MuiMenuItem-root': {
                                color: '#1A1A1E',
                            }
                        }
                    }
                }}
                fullWidth
            >
                {options.map((option, index) => (
                    <MenuItem key={index} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </Box>
    );
};

const CheckboxField = ({ label, value, onChange }: {
    label: string,
    value: string | boolean,
    onChange: (value: boolean) => void
}) => {
    const isChecked = typeof value === 'boolean' ? value : value === 'true';
    
    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={isChecked}
                    onChange={(e) => onChange(e.target.checked)}
                />
            }
            label={<Typography sx={labelSx}>{label}</Typography>}
        />
    );
};

const ToggleField = ({ label, value, onChange }: {
    label: string,
    value: string | boolean,
    onChange: (value: boolean) => void
}) => {
    // Debug the incoming value    
    return (
        <Box 
            display="flex" 
            alignItems="center"
            sx={{ mt: "24px" }}
        >
            <FormControlLabel
                control={
                    <Switch
                        checked={typeof value === 'boolean' ? value : value === 'true'}
                        onChange={(e) => {
                            onChange(e.target.checked);
                        }}
                    />
                }
                label={<Typography sx={labelSx}>{label}</Typography>}
            />
        </Box>
    );
};

const LabelField = ({ label, variant = "h6", color = "#1A1A1E" }: {
    label: string,
    variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "subtitle1" | "subtitle2" | "body1" | "body2",
    color?: string
}) => {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography 
                variant={variant} 
                sx={{ 
                    color,
                    fontWeight: 600,
                    lineHeight: "24px",
                }}
            >
                {label}
            </Typography>
        </Box>
    );
};

const DividerField = ({ variant = "fullWidth", color = "#E4E4E7" }: {
    variant?: "fullWidth" | "inset" | "middle",
    color?: string
}) => {
    return (
        <Box sx={{ my: 2 }}>
            <Divider 
                variant={variant}
                sx={{ 
                    borderColor: color,
                    width: "100%"
                }}
            />
        </Box>
    );
};