import { useState, useEffect, useRef } from "react";
import { Box, Tooltip } from "@mui/material";
import { IClient } from "./index";

interface Marker {
    id: string;
    x: number; // percentage from left
    y: number; // percentage from top
    count: number;
}

const getContinentName = (id: string): string => {
    switch (id) {
        case 'na': return 'North America';
        case 'sa': return 'South America';
        case 'eu': return 'Europe';
        case 'af': return 'Africa';
        case 'as': return 'Asia';
        case 'au': return 'Australia';
        default: return '';
    }
};

export default function WorldMap({ nodes }: { nodes: IClient[] }) {
    const [markerPositions, setMarkerPositions] = useState<{ [key: string]: { x: number, y: number } }>({});
    const [markers, setMarkers] = useState<Marker[]>([
        { id: "na", x: 25, y: 40, count: 0 }, // North America
        { id: "sa", x: 33, y: 68, count: 0 }, // South America
        { id: "eu", x: 48, y: 38, count: 0 }, // Europe
        { id: "af", x: 55, y: 60, count: 0 }, // Africa
        { id: "as", x: 72, y: 45, count: 0 }, // Asia
        { id: "au", x: 85, y: 78, count: 0 }, // Australia
    ]);
    const mapRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        console.log("Counting nodes by continent...")
        // Group nodes by continent and calculate counts
        const counts: { [key: string]: number } = {};
        nodes.forEach(node => {
            const continent = node.continent?.toLowerCase() || 'unknown';
            counts[continent] = (counts[continent] || 0) + 1;
        });

        // Update marker counts based on continent
        const updatedMarkers = markers.map(marker => {
            const continent = marker.id === 'na' ? 'north america' :
                            marker.id === 'sa' ? 'south america' :
                            marker.id === 'eu' ? 'europe' :
                            marker.id === 'af' ? 'africa' :
                            marker.id === 'as' ? 'asia' :
                            marker.id === 'au' ? 'australia' : '';
            
            return {
                ...marker,
                count: counts[continent] || 0
            };
        });

        // Update markers array
        setMarkers(updatedMarkers);
    }, [nodes]);

    useEffect(() => {
        const updateMarkerPositions = () => {
            if (!mapRef.current || !imgRef.current) return;

            const mapRect = mapRef.current.getBoundingClientRect();
            const imgRect = imgRef.current.getBoundingClientRect();
            
            // Calculate the offsets to center the image
            const offsetX = (mapRect.width - imgRect.width) / 2;
            const offsetY = (mapRect.height - imgRect.height) / 2;
            
            const newPositions: { [key: string]: { x: number, y: number } } = {};
            
            markers.forEach(marker => {
                // Calculate position based on the actual image dimensions and add the offsets
                const x = offsetX + (imgRect.width * marker.x / 100);
                const y = offsetY + (imgRect.height * marker.y / 100);
                
                newPositions[marker.id] = { x, y };
            });
            
            setMarkerPositions(newPositions);
        };

        // Initial update
        updateMarkerPositions();

        // Update on window resize
        window.addEventListener('resize', updateMarkerPositions);
        return () => window.removeEventListener('resize', updateMarkerPositions);
    }, []);

    return (
        <Box>
            <Box
                sx={{
                    borderRadius: "4px",
                    background: "#FFF",
                    overflow: "hidden",
                    height: "450px",
                    position: "relative",
                    width: "100%",
                    minWidth: "600px",
                    padding: "4px"
                }}
            >
                <Box
                    ref={mapRef}
                    className="map-container"
                    sx={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <img 
                            ref={imgRef}
                            src={"static://assets/FullWorldMap.svg"} 
                            alt="Nodes" 
                            style={{ 
                                maxWidth: "100%",
                                maxHeight: "100%",
                                width: "auto",
                                height: "auto",
                                objectFit: "contain",
                                userSelect: "none",
                                display: "block"
                            }} 
                        />
                        {markers.map((marker) => (
                            <Tooltip 
                                key={marker.id}
                                title={`${getContinentName(marker.id)}: ${marker.count} nodes`}
                                arrow
                                placement="top"
                            >
                                <Box
                                    sx={{
                                        position: "absolute",
                                        left: markerPositions[marker.id]?.x || 0,
                                        top: markerPositions[marker.id]?.y || 0,
                                        transform: `translate(-50%, -50%)`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "40px",
                                        height: "40px",
                                        flexShrink: 0,
                                        borderRadius: "28px",
                                        background: "rgba(0, 72, 229, 0.2)",
                                        zIndex: 2,
                                        cursor: "pointer"
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            width: "24px",
                                            height: "24px",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            flexShrink: 0,
                                            borderRadius: "28px",
                                            background: "#FFF",
                                            color: "#0048E5",
                                            fontFamily: '"SF Pro Display"',
                                            fontSize: "12px",
                                            fontStyle: "normal",
                                            fontWeight: 600,
                                            lineHeight: "24px"
                                        }}
                                    >
                                        {marker.count}
                                    </Box>
                                </Box>
                            </Tooltip>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
} 