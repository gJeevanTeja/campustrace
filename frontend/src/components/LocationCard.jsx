/**
 * GoogleLocationCard.jsx
 * Drop-in replacement for LocationCard.jsx
 *
 * Same UI as before:
 *   - Google Map embedded in card (not redirecting)
 *   - Item marker (red = lost, green = found)
 *   - Blue dot for user's location
 *   - Dashed line between user and item
 *   - Distance + direction chip
 *   - Weather (Open-Meteo free API, no key needed)
 *   - "Get Directions" → opens Google Maps navigation in new tab
 *
 * Usage:
 *   <GoogleLocationCard
 *     itemLat={item.latitude}
 *     itemLng={item.longitude}
 *     locationName={item.location_name}
 *     locationDetail={item.location_detail}
 *     itemType={item.type}
 *     darkMode={darkMode}
 *   />
 */

import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../hooks/useGoogleMaps';

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

function fmtDist(km) {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

async function fetchWeather(lat, lng) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
    );
    const data = await res.json();
    const code = data.current_weather?.weathercode ?? -1;
    const temp = Math.round(data.current_weather?.temperature ?? 0);

    let condition = 'Clear', icon = '☀️';
    if (code >= 51 && code <= 67) { condition = 'Rainy'; icon = '🌧️'; }
    else if (code >= 71 && code <= 77) { condition = 'Snowy'; icon = '❄️'; }
    else if (code >= 80 && code <= 99) { condition = 'Stormy'; icon = '⛈️'; }
    else if (code >= 1 && code <= 3) { condition = 'Cloudy'; icon = '⛅'; }
    else if (code >= 45 && code <= 48) { condition = 'Foggy'; icon = '🌫️'; }
    return { temp, condition, icon };
  } catch {
    return null;
  }
}

const GoogleLocationCard = ({
  itemLat,
  itemLng,
  locationName,
  locationDetail,
  itemType = 'lost',
  darkMode = false,
}) => {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);           // google.maps.Map instance

  const [distance, setDistance] = useState(null);   // number km
  const [direction, setDirection] = useState(null);
  const [weather, setWeather] = useState(null);
  const [locError, setLocError] = useState('');

  const itemColor = itemType === 'lost' ? '#ef4444' : '#16a34a';
  const dm = darkMode;
  const cardBg = dm ? '#1e1e1e' : '#fff';
  const text = dm ? '#e2e8f0' : '#1e1e1e';
  const muted = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#2d2d2d' : '#e2e8f0';

  useEffect(() => {
    if (!itemLat || !itemLng) return;
    let mounted = true;

    (async () => {
      try {
        await loadGoogleMaps();
        if (!mounted || !mapDivRef.current || mapRef.current) return;

        // Init map centred on item
        const map = new window.google.maps.Map(mapDivRef.current, {
          center: { lat: itemLat, lng: itemLng },
          zoom: 15,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative',
          styles: dm ? DARK_STYLES : [],
        });
        mapRef.current = map;

        // Item marker
        const itemMarker = new window.google.maps.Marker({
          position: { lat: itemLat, lng: itemLng },
          map,
          animation: window.google.maps.Animation.DROP,
          title: itemType === 'lost' ? 'Lost Here' : 'Found Here',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 13,
            fillColor: itemColor,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
        });

        // Popup on item marker
        const infoWin = new window.google.maps.InfoWindow({
          content: `<div style="font-size:13px;font-weight:700;padding:4px 6px;">
            ${itemType === 'lost' ? '🔴' : '🟢'} ${itemType === 'lost' ? 'Lost Here' : 'Found Here'}
            ${locationName ? `<br/><span style="font-weight:400;color:#64748b;font-size:12px;">${locationName}</span>` : ''}
          </div>`,
        });
        itemMarker.addListener('click', () => infoWin.open(map, itemMarker));
        infoWin.open(map, itemMarker);

        // Fetch weather for item location
        const wx = await fetchWeather(itemLat, itemLng);
        if (mounted) setWeather(wx);

        // Get user location
        if (!navigator.geolocation) {
          setLocError('Geolocation not supported');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!mounted) return;
            const uLat = pos.coords.latitude;
            const uLng = pos.coords.longitude;

            const km = haversineKm(uLat, uLng, itemLat, itemLng);
            setDistance(km);
            setDirection(compassDir(uLat, uLng, itemLat, itemLng));

            // Blue user dot marker
            new window.google.maps.Marker({
              position: { lat: uLat, lng: uLng },
              map,
              title: 'You are here',
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: '#2563eb',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3,
              },
            });

            new window.google.maps.InfoWindow({
              content: '<div style="font-size:12px;font-weight:700;padding:3px 5px;">📍 You are Here</div>',
            }).open(
              map,
              new window.google.maps.Marker({
                position: { lat: uLat, lng: uLng },
                map,
                visible: false,
              })
            );

            // Dashed line between user and item
            new window.google.maps.Polyline({
              path: [{ lat: uLat, lng: uLng }, { lat: itemLat, lng: itemLng }],
              geodesic: true,
              strokeColor: '#2563eb',
              strokeOpacity: 0,
              strokeWeight: 3,
              icons: [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                offset: '0',
                repeat: '16px',
              }],
              map,
            });

            // Fit map to show both markers
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend({ lat: uLat, lng: uLng });
            bounds.extend({ lat: itemLat, lng: itemLng });
            map.fitBounds(bounds, { top: 40, bottom: 40, left: 30, right: 30 });
          },
          () => { if (mounted) setLocError('Location access denied'); },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } catch (err) {
        console.error('[GoogleLocationCard]', err);
      }
    })();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemLat, itemLng]);

  const openDirections = () => {
    if (!itemLat || !itemLng) return;
    const dest = `${itemLat},${itemLng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    window.open(url, '_blank');
  };

  if (!itemLat || !itemLng) return null;

  return (
    <div style={{
      background: cardBg,
      borderRadius: 20,
      border: `1px solid ${border}`,
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      marginBottom: 16,
    }}>

      {/* ── Card header ──────────────────────────────────────── */}
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
          flexShrink: 0,
        }}>
          {itemType === 'lost' ? '🔴' : '🟢'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 12, color: text,
            textTransform: 'uppercase', letterSpacing: '0.6px',
          }}>
            Item {itemType === 'lost' ? 'Lost' : 'Found'} At
          </div>
          <div style={{
            fontSize: 14, color: muted, fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {locationName || 'Location on map'}
          </div>
          {locationDetail && (
            <div style={{ fontSize: 12, color: muted, marginTop: 1 }}>{locationDetail}</div>
          )}
        </div>
      </div>

      {/* ── Google Map ──────────────────────────────────────────── */}
      <div ref={mapDivRef} style={{ width: '100%', height: 220 }} />

      {/* ── Distance + Weather chips ─────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: (distance != null || locError) && weather ? '1fr 1fr' : '1fr',
        borderTop: `1px solid ${border}`,
      }}>
        {/* Distance */}
        {distance != null ? (
          <div style={{ padding: '14px 16px', borderRight: weather ? `1px solid ${border}` : 'none' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: muted,
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
            }}>
              📏 Distance from you
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>
              {fmtDist(distance)}
            </div>
            {direction && (
              <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                🧿 Head {direction}
              </div>
            )}
          </div>
        ) : locError ? (
          <div style={{ padding: '14px 16px', borderRight: weather ? `1px solid ${border}` : 'none' }}>
            <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>⚠️ {locError}</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Enable location for distance</div>
          </div>
        ) : (
          <div style={{ padding: '14px 16px', borderRight: weather ? `1px solid ${border}` : 'none' }}>
            <div style={{ fontSize: 12, color: muted }}>📍 Getting your location...</div>
          </div>
        )}

        {/* Weather */}
        {weather && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: muted,
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
            }}>
              🌡️ Weather there
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: text }}>
              {weather.icon} {weather.temp}°C
            </div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
              {weather.condition}
            </div>
          </div>
        )}
      </div>

      {/* ── Get Directions button ─────────────────────────────── */}
      <div style={{ padding: '0 16px 14px' }}>
        <button
          onClick={openDirections}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'none',
            border: '1.5px solid #2563eb',
            borderRadius: 10,
            padding: '10px',
            color: '#2563eb',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🗺️ Get Directions
        </button>
      </div>
    </div>
  );
};

const DARK_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1e1e1e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#121212' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#121212' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f2942' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2d2d2d' }] },
];

export default GoogleLocationCard;