import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

const ACCENT = '#2563eb';

// Fix for default marker icon in Leaflet
const customIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = customIcon('blue');
const redIcon = customIcon('red');
const greenIcon = customIcon('green');

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function compassDir(lat1, lng1, lat2, lng2) {
    const angle = Math.atan2(lng2 - lng1, lat2 - lat1) * 180 / Math.PI;
    const dirs = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW'];
    return dirs[Math.round(((angle % 360) + 360) % 360 / 45) % 8];
}

const LocationCard = ({
    item,
    darkMode = false,
}) => {
    const [userLoc, setUserLoc] = useState(null);
    const [distance, setDistance] = useState(null);
    const [direction, setDirection] = useState(null);
    const [weather, setWeather] = useState(null);

    const itemLat = item?.latitude;
    const itemLng = item?.longitude;
    const itemType = item?.type || 'lost';
    const locationName = item?.location_name || item?.location_display || item?.location;
    const locationDetail = item?.location_detail;

    const dm = darkMode;
    const cardBg = dm ? '#1e293b' : '#fff';
    const text = dm ? '#e2e8f0' : '#1e293b';
    const muted = dm ? '#94a3b8' : '#64748b';
    const border = dm ? '#334155' : '#e2e8f0';
    
    // Exact requested styling: ITEM LOST AT (Red), ITEM FOUND AT (Green)
    const itemColor = itemType === 'lost' ? '#ef4444' : '#16a34a';
    const leafIcon = itemType === 'lost' ? redIcon : greenIcon;

    useEffect(() => {
        if (!itemLat || !itemLng) return;

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLoc([latitude, longitude]);
                const km = haversineKm(latitude, longitude, itemLat, itemLng);
                setDistance(km);
                setDirection(compassDir(latitude, longitude, itemLat, itemLng));
            }, null, { enableHighAccuracy: true });
        }

        // Fetch weather
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${itemLat}&longitude=${itemLng}&current_weather=true`)
            .then(r => r.json())
            .then(data => {
                const cw = data.current_weather;
                const code = cw.weathercode;
                let condition = 'Clear', icon = '☀️';
                if (code >= 51 && code <= 67) { condition = 'Rainy'; icon = '🌧️'; }
                else if (code >= 71 && code <= 77) { condition = 'Snowy'; icon = '❄️'; }
                else if (code >= 80 && code <= 99) { condition = 'Stormy'; icon = '⛈️'; }
                else if (code >= 1 && code <= 3) { condition = 'Cloudy'; icon = '⛅'; }
                else if (code >= 45 && code <= 48) { condition = 'Foggy'; icon = '🌫️'; }
                setWeather({ temp: Math.round(cw.temperature), condition, icon });
            })
            .catch(() => { });
    }, [itemLat, itemLng]);

    if (!itemLat || !itemLng || isNaN(itemLat) || isNaN(itemLng)) {
        return (
            <div style={{
                background: cardBg,
                borderRadius: 20,
                border: `1px solid ${border}`,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                marginBottom: 16,
            }}>
                <div style={{
                    padding: '14px 16px',
                    background: `linear-gradient(135deg, ${itemColor}18, ${itemColor}06)`,
                    borderBottom: `1px solid ${border}`,
                }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: itemColor, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        ITEM {itemType.toUpperCase()} AT
                    </div>
                    <div style={{ fontSize: 16, color: text, fontWeight: 700, marginTop: 2 }}>
                        {locationName}
                    </div>
                </div>
                <div style={{ padding: 16 }}>
                    {locationDetail ? (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ fontSize: 18 }}>📍</div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: muted, textTransform: 'uppercase' }}>Precise Location</div>
                                <p style={{ margin: '2px 0 0', fontSize: 14, color: text, lineHeight: 1.5 }}>{locationDetail}</p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: muted, fontSize: 13, padding: '10px 0' }}>
                           Location details not specified.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const itemPos = [itemLat, itemLng];
    const mapBounds = userLoc ? [itemPos, userLoc] : [itemPos];

    return (
        <div style={{
            background: cardBg,
            borderRadius: 20,
            border: `1px solid ${border}`,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            marginBottom: 16,
        }}>
            {/* Header - Unified Layout */}
            <div style={{
                padding: '14px 16px',
                background: `linear-gradient(135deg, ${itemColor}18, ${itemColor}06)`,
                borderBottom: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${itemColor}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                    {itemType === 'lost' ? '🔴' : '🟢'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: itemColor, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        ITEM {itemType.toUpperCase()} AT
                    </div>
                    <div style={{ fontSize: 16, color: text, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                        {locationName}
                    </div>
                    {locationDetail && <div style={{ fontSize: 13, color: muted, fontWeight: 500, marginTop: 1 }}>{locationDetail}</div>}
                </div>
            </div>

            {/* Leaflet Map */}
            <div style={{ width: '100%', height: 220, position: 'relative', zIndex: 0 }}>
                <MapContainer
                    center={itemPos}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                    bounds={userLoc ? mapBounds : undefined}
                    boundsOptions={{ padding: [30, 30] }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={itemPos} icon={leafIcon}>
                        <Popup>
                            <strong>{itemType === 'lost' ? 'Lost' : 'Found'} Here</strong><br />
                            {locationName}
                        </Popup>
                    </Marker>
                    {userLoc && (
                        <>
                            <Marker position={userLoc} icon={blueIcon}>
                                <Popup>You are Here</Popup>
                            </Marker>
                            <Polyline
                                positions={[itemPos, userLoc]}
                                color={ACCENT}
                                dashArray="10, 10"
                                weight={3}
                            />
                        </>
                    )}
                </MapContainer>
            </div>

            {/* Info Chips */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: (distance != null || userLoc) && weather ? '1fr 1fr' : '1fr',
                borderTop: `1px solid ${border}`,
            }}>
                {/* Distance */}
                <div style={{ padding: '14px 16px', borderRight: weather ? `1px solid ${border}` : 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: 'uppercase', marginBottom: 4 }}>📏 Distance</div>
                    {distance != null ? (
                        <>
                            <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>
                                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                            </div>
                            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>Head {direction}</div>
                        </>
                    ) : (
                        <div style={{ fontSize: 12, color: muted }}>Locating...</div>
                    )}
                </div>

                {/* Weather */}
                {weather && (
                    <div style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: 'uppercase', marginBottom: 4 }}>🌡️ Weather</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: text }}>
                            {weather.icon} {weather.temp}°C
                        </div>
                        <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{weather.condition}</div>
                    </div>
                )}
            </div>

            {/* Get Directions */}
            <div style={{ padding: '0 16px 14px' }}>
                <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${itemLat},${itemLng}`, '_blank')}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, background: 'none', border: `1.5px solid ${ACCENT}`,
                        borderRadius: 10, padding: '10px', color: ACCENT,
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    <Navigation size={16} /> Get Directions
                </button>
            </div>
        </div>
    );
};

export default LocationCard;