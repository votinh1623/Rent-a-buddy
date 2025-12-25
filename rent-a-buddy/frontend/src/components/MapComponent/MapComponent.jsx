import React, { useEffect, useState, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.scss';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for destination
const createCustomIcon = (isPopular = false) => {
    return L.divIcon({
        html: `
            <div class="custom-marker ${isPopular ? 'popular' : ''}">
                <div class="marker-pin"></div>
                <div class="marker-label">📍</div>
            </div>
        `,
        className: 'custom-marker-container',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
};

// Backup coordinates for famous destinations
const BACKUP_COORDINATES = {
    'My Khe Beach': [16.0594, 108.2408],
    'Marble Mountains': [16.0019, 108.2692],
    'Dragon Bridge': [16.0619, 108.2295],
    'Ba Na Hills': [15.9956, 107.9953],
    'Han Market': [16.0700, 108.2210],
    'Museum of Cham Sculpture': [16.0622, 108.2250],
    'Linh Ung Pagoda (Lady Buddha)': [16.1156, 108.2867],
    'Linh Ung Pagoda': [16.1156, 108.2867],
    'Son Tra Peninsula (Monkey Mountain)': [16.1118, 108.2557],
    'Son Tra Peninsula': [16.1118, 108.2557],
    'Monkey Mountain': [16.1118, 108.2557],
    'Nui Than Tai Hot Springs': [15.9500, 108.1500],
    'Cham Islands': [15.9522, 108.5317],
    'Love Lock Bridge': [16.0692, 108.2281],
    'Asia Park (Sun World Danang Wonders)': [16.0684, 108.2301],
    'Asia Park': [16.0684, 108.2301],
    'Sun World Danang Wonders': [16.0684, 108.2301],
    'Han River Bridge': [16.0672, 108.2236],
    'Da Nang Cathedral': [16.0700, 108.2208],
    'Helio Night Market': [16.0686, 108.2356],
    '3D Museum': [16.0678, 108.2294],
    'Da Nang Museum': [16.0497, 108.2264],
    'Cham Museum': [16.0622, 108.2250],
    'Tien Sa Port': [16.1122, 108.2331]
};

// Default coordinates for Da Nang city center
const DANANG_CENTER = [16.0544, 108.2022];

const MapComponent = ({ destination, height = '400px', interactive = true, showControls = true }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [circle, setCircle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Memoize coordinates to prevent unnecessary recalculations
    const coordinates = useMemo(() => {
        if (!destination) return DANANG_CENTER;
        
        // Priority 1: Use coordinates from database location
        if (destination?.location?.latitude && destination?.location?.longitude) {
            console.log('✅ Using coordinates from database for:', destination.name, destination.location);
            return [destination.location.latitude, destination.location.longitude];
        }
        
        // Priority 2: Try to find in backup coordinates by exact name match
        if (destination?.name) {
            const exactMatch = BACKUP_COORDINATES[destination.name];
            if (exactMatch) {
                console.log('✅ Found exact match in backup for:', destination.name, exactMatch);
                return exactMatch;
            }
            
            // Try partial match
            const destName = destination.name.toLowerCase();
            for (const [key, coords] of Object.entries(BACKUP_COORDINATES)) {
                if (destName.includes(key.toLowerCase()) || key.toLowerCase().includes(destName)) {
                    console.log('✅ Found partial match in backup for:', destination.name, '->', key, coords);
                    return coords;
                }
            }
        }
        
        console.log('⚠️ No coordinates found for:', destination?.name || 'Unknown', 'Using Da Nang center');
        return DANANG_CENTER;
    }, [destination]);

    // Initialize map
    useEffect(() => {
        if (!destination) {
            console.log('🚫 No destination provided');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        console.log('📍 Initializing map for:', destination.name);
        console.log('📌 Using coordinates:', coordinates);

        // Clean up existing map
        if (map) {
            map.remove();
            setMap(null);
            setMarker(null);
            setCircle(null);
        }

        // Create map
        const leafletMap = L.map(mapRef.current, {
            center: coordinates,
            zoom: 15,
            zoomControl: showControls,
            scrollWheelZoom: interactive,
            dragging: interactive,
            touchZoom: interactive,
            doubleClickZoom: interactive,
            boxZoom: interactive,
            keyboard: interactive
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(leafletMap);

        // Add marker with custom icon
        const customIcon = createCustomIcon(destination.isPopular);
        const newMarker = L.marker(coordinates, { 
            icon: customIcon,
            title: destination.name
        }).addTo(leafletMap);

        // Add popup with information
        const popupContent = createPopupContent(destination, coordinates);
        newMarker.bindPopup(popupContent, {
            maxWidth: 300,
            minWidth: 200,
            className: 'destination-popup'
        });

        // Add circle to show surrounding area
        const newCircle = L.circle(coordinates, {
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.1,
            radius: 500 // 500 meters
        }).addTo(leafletMap);

        // Add scale control
        if (showControls) {
            L.control.scale({ imperial: false }).addTo(leafletMap);
        }

        // Fit bounds with padding
        leafletMap.fitBounds([
            [coordinates[0] - 0.01, coordinates[1] - 0.01],
            [coordinates[0] + 0.01, coordinates[1] + 0.01]
        ], { padding: [50, 50] });

        setMap(leafletMap);
        setMarker(newMarker);
        setCircle(newCircle);
        setIsLoading(false);

        // Cleanup
        return () => {
            if (leafletMap) {
                leafletMap.remove();
            }
        };
    }, [destination, interactive, showControls]); // coordinates removed from dependencies

    // Update map when coordinates change
    useEffect(() => {
        if (map && marker && circle && destination) {
            console.log('🔄 Updating map position for:', destination.name);
            console.log('📌 New coordinates:', coordinates);
            
            map.setView(coordinates, 15);
            marker.setLatLng(coordinates);
            circle.setLatLng(coordinates);
            
            // Update popup content
            const popupContent = createPopupContent(destination, coordinates);
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                minWidth: 200,
                className: 'destination-popup'
            });
        }
    }, [coordinates, map, marker, circle, destination]);

    // Helper function to create popup content
    const createPopupContent = (dest, coords) => {
        const address = dest.address || 'Da Nang, Vietnam';
        
        return `
            <div class="map-popup-content">
                <div class="popup-header">
                    <h4>${dest.name}</h4>
                    ${dest.isPopular ? '<span class="popular-badge">⭐ Popular</span>' : ''}
                </div>
                <div class="popup-body">
                    <p><strong>📍 Address:</strong> ${address}</p>
                    <p><strong>🏙️ City:</strong> ${dest.city || 'Da Nang'}</p>
                    <p><strong>🌍 Country:</strong> ${dest.country || 'Vietnam'}</p>
                    ${dest.description ? `<p class="description">${dest.description.substring(0, 100)}...</p>` : ''}
                    <p><strong>📐 Coordinates:</strong> ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}</p>
                    <div class="popup-actions">
                        <button class="popup-btn directions" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}', '_blank')">
                            🚗 Get Directions
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    // Helper functions
    const openDirections = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates[0]},${coordinates[1]}`;
        window.open(url, '_blank');
    };

    const resetView = () => {
        if (map && destination) {
            map.setView(coordinates, 15);
        }
    };

    return (
        <div className="leaflet-map-container">
            {isLoading && (
                <div className="map-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading map...</p>
                </div>
            )}
            
            <div 
                ref={mapRef}
                className="leaflet-map"
                style={{ height }}
            />
            
            {showControls && interactive && (
                <div className="map-controls">
                    <div className="control-group">
                        <button 
                            className="map-btn directions-btn"
                            onClick={openDirections}
                            title="Get directions to this location"
                        >
                            <span>📍</span> Directions
                        </button>
                        <button 
                            className="map-btn reset-view-btn"
                            onClick={resetView}
                            title="Reset map view"
                        >
                            <span>↺</span> Reset View
                        </button>
                    </div>
                    
                    <div className="location-info">
                        <div className="info-item">
                            <strong>Coordinates:</strong> 
                            <span className="coordinates">
                                {coordinates[0].toFixed(6)}, 
                                {coordinates[1].toFixed(6)}
                            </span>
                        </div>
                        {destination?.address && (
                            <div className="info-item">
                                <strong>Address:</strong> 
                                <span className="address">{destination.address}</span>
                            </div>
                        )}
                        {!destination?.location?.latitude && (
                            <div className="info-item warning">
                                <small>⚠️ Using estimated coordinates</small>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <div className="map-attribution">
                <small>Map © OpenStreetMap contributors | Location: {destination?.name || 'Da Nang'}</small>
            </div>
        </div>
    );
};

export default MapComponent;