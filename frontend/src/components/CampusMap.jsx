import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Search, X, RotateCcw } from 'lucide-react';

const ACCENT = '#2563eb';
const GLOBAL_CENTER = [17.3850, 78.4867];

// Fix for default marker icon in Leaflet
const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const CampusMap = ({
    onLocationSelect,
    darkMode = false,
    height = 400,
    selectedLat = null,
    selectedLng = null,
    restrictedLocations = null, // Array of {name, latitude, longitude, description}
}) => {
    const [position, setPosition] = useState(GLOBAL_CENTER);
    const [markerPos, setMarkerPos] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const [activeMode, setActiveMode] = useState('manual');
    const [gpsLoading, setGpsLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    const dm = darkMode;
    const text = dm ? '#e2e8f0' : '#1e293b';
    const muted = dm ? '#94a3b8' : '#64748b';
    const border = dm ? '#334155' : '#e2e8f0';
    const cardBg = dm ? '#1e293b' : '#fff';

    // Update map when external coordinates change
    useEffect(() => {
        if (selectedLat && selectedLng) {
            const lat = parseFloat(selectedLat);
            const lng = parseFloat(selectedLng);
            if (!isNaN(lat) && !isNaN(lng)) {
                setPosition([lat, lng]);
                setMarkerPos([lat, lng]);
                reverseGeocode(lat, lng);
            }
        }
    }, [selectedLat, selectedLng]);

    // Helper to fetch address from coordinates (Nominatim)
    const reverseGeocode = async (lat, lon) => {
        try {
            setSelectedAddress("Locating address...");
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`, {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'UniTrace/1.0'
                }
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            const a = data.address || {};
            // Pick the best fields for a "perfect" address
            const main = a.road || a.pedestrian || a.suburb || a.neighbourhood || a.hamlet || a.building || a.amenity || "";
            const area = a.city || a.town || a.village || a.county || "";
            const state = a.state || "";

            let addr = [main, area, state].filter(Boolean).join(', ');
            if (!addr && data.display_name) {
                addr = data.display_name.split(',')[0];
            }

            const finalAddr = addr || "Selected Location";
            setSelectedAddress(finalAddr);
            return finalAddr;
        } catch (err) {
            console.error("Geocode error:", err);
            setSelectedAddress("Selected Location");
            return "Selected Location";
        }
    };

    // Component to handle map clicks
    const MapEvents = () => {
        useMapEvents({
            click(e) {
                // Only allow manual selection if not in restricted mode
                // or if the user clicks exactly on a location (handled by marker)
            },
        });
        return null;
    };

    // Component to smoothly fly the map to a new center (avoids _leaflet_pos crash from remounting)
    function FlyTo({ center }) {
        const map = useMap();
        useEffect(() => {
            if (!map || !center) return;
            try {
                map.flyTo(center, map.getZoom(), { animate: true, duration: 0.8 });
            } catch (e) {
                // Map may have been removed — silently ignore
            }
        }, [center, map]);
        return null;
    }

    const startLive = () => {
        if (!navigator.geolocation) return;
        setActiveMode('live');
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setPosition([latitude, longitude]);
            setMarkerPos([latitude, longitude]);
            const addr = await reverseGeocode(latitude, longitude);
            setGpsLoading(false);
            onLocationSelect?.({ location_name: addr, lat: latitude, lng: longitude });
        }, () => setGpsLoading(false), { enableHighAccuracy: true });
    };

    const getCurrent = () => {
        if (!navigator.geolocation) return;
        setActiveMode('current');
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setPosition([latitude, longitude]);
            setMarkerPos([latitude, longitude]);
            const addr = await reverseGeocode(latitude, longitude);
            setGpsLoading(false);
            onLocationSelect?.({ location_name: addr, lat: latitude, lng: longitude });
        }, () => setGpsLoading(false), { enableHighAccuracy: true });
    };

    const searchTimeout = useRef(null);
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSuggestions([]);
            setSearchLoading(false);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        setSearchLoading(true);
        searchTimeout.current = setTimeout(async () => {
            if (restrictedLocations) {
                // Search within verified library
                const filtered = restrictedLocations.filter(loc => 
                    loc.name.toLowerCase().includes(query.toLowerCase()) || 
                    loc.description.toLowerCase().includes(query.toLowerCase())
                ).map(loc => ({
                    display_name: loc.name,
                    lat: loc.latitude,
                    lon: loc.longitude,
                    address: { road: loc.name },
                    isVerified: true
                }));
                setSuggestions(filtered);
                setSearchLoading(false);
                return;
            }

            try {
                // Biased search around Hyderabad/University area (for better local results)
                const viewbox = '78.3,17.4,78.6,17.7'; // Broad Hyderabad viewbox
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&viewbox=${viewbox}`, {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'UniTrace/1.0'
                    }
                });
                const data = await res.json();

                // If it's a very specific uni block search, try with the uni name as fallback if no results
                if (data.length === 0 && query.length > 3) {
                    const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + " Malla Reddy")}&limit=5&addressdetails=1`, {
                        headers: {
                            'Accept-Language': 'en',
                            'User-Agent': 'UniTrace/1.0'
                        }
                    });
                    const fallbackData = await fallbackRes.json();
                    setSuggestions(fallbackData);
                } else {
                    setSuggestions(data);
                }
            } catch (err) {
                setSuggestions([]);
            } finally {
                setSearchLoading(false);
            }
        }, 800); // 800ms debounce to be safer with Nominatim limits
    };

    const selectSuggestion = (item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        setPosition([lat, lon]);
        setMarkerPos([lat, lon]);

        const a = item.address || {};
        const main = a.road || a.pedestrian || a.suburb || a.neighbourhood || a.hamlet || "";
        const area = a.city || a.town || a.village || a.county || "";
        const addr = [main, area].filter(Boolean).join(', ') || item.display_name.split(',')[0];

        setSearchQuery(addr);
        setSelectedAddress(item.display_name);
        setSuggestions([]);
        onLocationSelect?.({
            location_name: item.display_name,
            lat: lat,
            lng: lon
        });
    };

    const handleLocationChange = (lat, lng, name) => {
        setPosition([lat, lng]);
        setMarkerPos([lat, lng]);
        setSelectedAddress(name);
        onLocationSelect?.({
            location_name: name,
            lat: lat,
            lng: lng
        });
    };


    return (
        <div style={{ width: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Mode Buttons */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button
                    onClick={startLive}
                    disabled={gpsLoading && activeMode === 'live'}
                    style={{
                        flex: 1, padding: '10px', borderRadius: 12,
                        border: `1.5px solid ${activeMode === 'live' ? ACCENT : border}`,
                        background: activeMode === 'live' ? `${ACCENT}15` : cardBg,
                        color: activeMode === 'live' ? ACCENT : text,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        opacity: (gpsLoading && activeMode === 'live') ? 0.7 : 1
                    }}
                >
                    <Navigation size={14} className={gpsLoading && activeMode === 'live' ? 'animate-pulse' : ''} />
                    {gpsLoading && activeMode === 'live' ? 'Locating...' : 'Live'}
                </button>
                <button
                    onClick={getCurrent}
                    disabled={gpsLoading && activeMode === 'current'}
                    style={{
                        flex: 1, padding: '10px', borderRadius: 12,
                        border: `1.5px solid ${activeMode === 'current' ? ACCENT : border}`,
                        background: activeMode === 'current' ? `${ACCENT}15` : cardBg,
                        color: activeMode === 'current' ? ACCENT : text,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        opacity: (gpsLoading && activeMode === 'current') ? 0.7 : 1
                    }}
                >
                    <MapPin size={14} className={gpsLoading && activeMode === 'current' ? 'animate-pulse' : ''} />
                    {gpsLoading && activeMode === 'current' ? 'Locating...' : 'Current'}
                </button>
                <button
                    onClick={() => setActiveMode('manual')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: 12,
                        border: `1.5px solid ${activeMode === 'manual' ? ACCENT : border}`,
                        background: activeMode === 'manual' ? `${ACCENT}15` : cardBg,
                        color: activeMode === 'manual' ? ACCENT : text,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                >
                    <RotateCcw size={14} /> Manual
                </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', background: cardBg,
                    borderRadius: 14, padding: '8px 12px', border: `2px solid ${border}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                    <Search size={18} style={{ color: muted, marginRight: 10 }} />
                    <input
                        placeholder="Search location..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{
                            flex: 1, border: 'none', background: 'transparent',
                            fontSize: 14, color: text, outline: 'none'
                        }}
                    />
                    {searchQuery && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {searchLoading && <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid #ccc', borderTopColor: ACCENT, borderRadius: '50%' }} />}
                            <X size={16} style={{ cursor: 'pointer', color: muted }} onClick={() => { setSearchQuery(''); setSuggestions([]); }} />
                        </div>
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {(suggestions.length > 0 || searchLoading) && (
                    <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: cardBg, borderRadius: 12, marginTop: 4,
                        border: `1px solid ${border}`, boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                        zIndex: 1000, overflow: 'hidden'
                    }}>
                        {searchLoading && (
                            <div style={{ padding: '12px 16px', fontSize: 13, color: muted }}>Searching...</div>
                        )}
                        {suggestions.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => selectSuggestion(item)}
                                style={{
                                    padding: '12px 16px', fontSize: 13, color: text,
                                    cursor: 'pointer', borderBottom: idx === suggestions.length - 1 ? 'none' : `1px solid ${border}`,
                                    display: 'flex', alignItems: 'center', gap: 10
                                }}
                                onMouseEnter={(e) => {
                                    const target = e.currentTarget;
                                    target.style.background = dm ? '#1e293b' : '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    const target = e.currentTarget;
                                    target.style.background = 'transparent';
                                }}
                            >
                                <MapPin size={14} style={{ color: muted, flexShrink: 0 }} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.display_name}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Canvas */}
            <div style={{ width: '100%', height, borderRadius: 16, overflow: 'hidden', border: `2px solid ${border}`, position: 'relative', zIndex: 0 }}>
                <MapContainer 
                    center={position} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents />
                    <FlyTo center={position} />
                    
                    {/* Render all campus locations if restricted */}
                    {restrictedLocations && restrictedLocations.map((loc, idx) => (
                        <Marker 
                            key={idx} 
                            position={[loc.latitude, loc.longitude]} 
                            icon={customIcon}
                            eventHandlers={{
                                click: () => handleLocationChange(loc.latitude, loc.longitude, loc.name)
                            }}
                        >
                            <Tooltip 
                                permanent 
                                direction="top" 
                                offset={[0, -35]}
                                className="custom-tooltip"
                            >
                                {loc.name}
                            </Tooltip>
                            <Popup>
                                <div style={{ padding: '8px', minWidth: 150 }}>
                                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: ACCENT }}>✅ Verified Location</p>
                                    <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{loc.name}</p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>{loc.description}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Manual selection marker (only if not restricted or if selected) */}
                    {markerPos && !restrictedLocations?.some(l => l.latitude === markerPos[0] && l.longitude === markerPos[1]) && (
                        <Marker position={markerPos} icon={customIcon}>
                            <Popup>
                                <div style={{ padding: '8px', minWidth: 150 }}>
                                    <p style={{ margin: '0 0 8px', fontWeight: 600 }}>📍 Selected Location</p>
                                    <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{selectedAddress}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            <p style={{ fontSize: 11, color: muted, textAlign: 'center', marginTop: 8 }}>
                Tap map • Search above • Current • Live
            </p>

            {selectedAddress && (
                <div style={{
                    marginTop: 12,
                    padding: '12px 14px',
                    background: dm ? '#1e293b' : '#f8fafc',
                    borderRadius: 12,
                    border: `1.5px solid ${border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected Address</p>
                    <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 600, lineHeight: 1.4 }}>{selectedAddress}</p>
                </div>
            )}

            <style>{`
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .leaflet-container { font-family: inherit; }
            `}</style>
        </div>
    );
};

export default CampusMap;
