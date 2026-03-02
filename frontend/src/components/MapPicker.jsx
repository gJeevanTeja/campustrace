/**
 * GoogleMapPicker.jsx
 * Drop-in replacement for MapPicker.jsx
 *
 * Features:
 *   - Live location (continuous GPS watch)
 *   - Current location (one-shot GPS)
 *   - Manual: Google Places Autocomplete (real-time suggestions as you type)
 *   - Click / drag marker on map
 *   - Dark map style when darkMode=true
 *   - Calls onLocationSelect({ lat, lng, address }) on every location change
 *
 * Usage (same API as old MapPicker):
 *   <GoogleMapPicker
 *     onLocationSelect={({ lat, lng, address }) => ...}
 *     initialLat={17.385}
 *     initialLng={78.4867}
 *     darkMode={darkMode}
 *   />
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps } from '../hooks/useGoogleMaps';

const ACCENT = '#2563eb';

const GoogleMapPicker = ({
  onLocationSelect,
  initialLat,
  initialLng,
  darkMode = false,
}) => {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const acInputRef = useRef(null);          // autocomplete input DOM element
  const acRef = useRef(null);          // google.maps.places.Autocomplete instance
  const watchIdRef = useRef(null);          // geolocation watch ID

  const [mapStatus, setMapStatus] = useState('loading'); // loading|ready|error
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [activeMode, setActiveMode] = useState('none');  // none|live|current|manual
  const [liveActive, setLiveActive] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const dm = darkMode;
  const text = dm ? '#e2e8f0' : '#1e1e1e';
  const muted = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#333333' : '#e2e8f0';
  const inputBg = dm ? '#121212' : '#f8fafc';

  // ── Reverse geocode lat/lng → address string ─────────────────
  const reverseGeocode = useCallback((lat, lng) => {
    setCoords({ lat, lng });
    if (!window.google?.maps) return;
    new window.google.maps.Geocoder().geocode(
      { location: { lat, lng } },
      async (results, gStatus) => {
        if (gStatus !== 'OK') {
          console.error(`[GoogleMapPicker] Geocoding API Failed. Status: ${gStatus}. Check if 'Geocoding API' is enabled for this API Key in Google Cloud Console.`);

          // Fallback to free OpenStreetMap Nominatim API if Google is disabled
          try {
            const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const osmData = await osmRes.json();
            if (osmData && osmData.display_name) {
              const addr = osmData.display_name;
              setSelectedAddress(addr);
              setSearchQuery(addr);
              onLocationSelect?.({ lat, lng, address: addr });
              return; // Halt here so we don't apply the coordinate text below
            }
          } catch (err) {
            console.error('[GoogleMapPicker] OSM Fallback also failed:', err);
          }
        }

        const addr =
          gStatus === 'OK' && results[0]
            ? results[0].formatted_address
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setSelectedAddress(addr);
        setSearchQuery(addr);
        onLocationSelect?.({ lat, lng, address: addr });
      }
    );
  }, [onLocationSelect]);

  // ── Place / move marker on map ───────────────────────────────
  const placeMarker = useCallback((lat, lng) => {
    if (!mapRef.current || !window.google?.maps) return;
    const pos = { lat, lng };

    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: ACCENT,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
      });
      markerRef.current.addListener('dragend', () => {
        const p = markerRef.current.getPosition();
        reverseGeocode(p.lat(), p.lng());
      });
    }
    mapRef.current.panTo(pos);
  }, [reverseGeocode]);

  // ── Stop live GPS watch ──────────────────────────────────────
  const stopLive = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLiveActive(false);
  }, []);

  // ── Start live GPS watch ─────────────────────────────────────
  const startLive = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this device.');
      return;
    }
    stopLive();
    setActiveMode('live');
    setLiveActive(true);
    setGpsLoading(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsLoading(false);
        placeMarker(lat, lng);
        reverseGeocode(lat, lng);
        mapRef.current?.setZoom(17);
      },
      (err) => {
        setGpsLoading(false);
        console.error('Live GPS error:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 12000 }
    );
  }, [stopLive, placeMarker, reverseGeocode]);

  // ── Current location (one-shot) ──────────────────────────────
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this device.');
      return;
    }
    stopLive();
    setActiveMode('current');
    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsLoading(false);
        mapRef.current?.setZoom(17);
        placeMarker(lat, lng);
        reverseGeocode(lat, lng);
      },
      () => {
        setGpsLoading(false);
        alert('Could not get your location. Please allow location permission.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [stopLive, placeMarker, reverseGeocode]);

  // ── Init Google Map ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await loadGoogleMaps();
        if (!mounted || !mapDivRef.current) return;

        const startLat = initialLat || 17.385;
        const startLng = initialLng || 78.4867;

        const map = new window.google.maps.Map(mapDivRef.current, {
          center: { lat: startLat, lng: startLng },
          zoom: 15,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: dm ? DARK_STYLES : [],
        });
        mapRef.current = map;

        // Click anywhere on map to place marker
        map.addListener('click', (e) => {
          stopLive();
          setActiveMode('manual');
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          placeMarker(lat, lng);
          reverseGeocode(lat, lng);
        });

        // Restore initial position
        if (initialLat && initialLng) {
          placeMarker(initialLat, initialLng);
          reverseGeocode(initialLat, initialLng);
        }

        setMapStatus('ready');
      } catch (err) {
        console.error('[GoogleMapPicker] init error:', err);
        setMapStatus('error');
      }
    })();

    return () => {
      mounted = false;
      stopLive();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Attach Places Autocomplete once map is ready ─────────────
  useEffect(() => {
    if (mapStatus !== 'ready' || !acInputRef.current || acRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(acInputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['geometry', 'formatted_address', 'name'],
    });
    acRef.current = ac;

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place?.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const addr = place.formatted_address || place.name || `${lat}, ${lng}`;

      stopLive();
      setActiveMode('manual');
      setSelectedAddress(addr);
      setSearchQuery(addr);
      setCoords({ lat, lng });
      mapRef.current?.setZoom(17);
      placeMarker(lat, lng);
      onLocationSelect?.({ lat, lng, address: addr });
    });
  }, [mapStatus, placeMarker, stopLive, onLocationSelect]);

  // ── Button styling helper ────────────────────────────────────
  const btnStyle = (isActive, color = ACCENT) => ({
    flex: 1,
    padding: '9px 4px',
    borderRadius: 10,
    border: `1.5px solid ${isActive ? color : border}`,
    background: isActive ? `${color}18` : inputBg,
    color: isActive ? color : muted,
    fontSize: 12,
    fontWeight: isActive ? 700 : 500,
    cursor: 'pointer',
    transition: 'all 0.18s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ width: '100%' }}>

      {/* ── Mode selector ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button
          type="button"
          onClick={liveActive ? stopLive : startLive}
          style={btnStyle(liveActive, '#ef4444')}
          disabled={gpsLoading}
        >
          {gpsLoading && activeMode === 'live' ? '⏳' : liveActive ? '⏹' : '📡'}
          {liveActive ? ' Stop Live' : ' Live'}
        </button>

        <button
          type="button"
          onClick={getCurrentLocation}
          style={btnStyle(activeMode === 'current' && !liveActive, '#16a34a')}
          disabled={gpsLoading}
        >
          {gpsLoading && activeMode === 'current' ? '⏳' : '📍'}
          {' '}Current
        </button>

        <button
          type="button"
          onClick={() => {
            stopLive();
            setActiveMode('manual');
            setTimeout(() => acInputRef.current?.focus(), 50);
          }}
          style={btnStyle(activeMode === 'manual', '#7c3aed')}
        >
          ✏️ Manual
        </button>
      </div>

      {/* ── Google Places search input ─────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          ref={acInputRef}
          type="text"
          placeholder="Search location (type to see suggestions)..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setActiveMode('manual');
            stopLive();
          }}
          style={{
            width: '100%',
            padding: '11px 42px 11px 14px',
            borderRadius: 10,
            border: `1.5px solid ${activeMode === 'manual' ? '#7c3aed' : border}`,
            background: inputBg,
            color: text,
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
        />
        <span style={{
          position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-50%)', fontSize: 16,
          pointerEvents: 'none', color: muted,
        }}>
          🔍
        </span>
      </div>

      {/* ── Live indicator ─────────────────────────────────────── */}
      {liveActive && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 8, padding: '7px 12px',
          background: '#fee2e2', borderRadius: 8,
        }}>
          <span style={{
            display: 'inline-block', width: 9, height: 9,
            borderRadius: '50%', background: '#ef4444',
            animation: 'gmpulse 1s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
            Live GPS active — map updates as you move
          </span>
        </div>
      )}
      <style>{`@keyframes gmpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.3)}}`}</style>

      {/* ── Google Map canvas ──────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <div
          ref={mapDivRef}
          style={{
            width: '100%',
            height: 280,
            borderRadius: 14,
            border: `1.5px solid ${border}`,
            overflow: 'hidden',
            background: inputBg,
            display: mapStatus === 'ready' ? 'block' : 'none',
          }}
        />

        {mapStatus === 'loading' && (
          <div style={{
            width: '100%', height: 280, borderRadius: 14,
            border: `1.5px solid ${border}`, background: inputBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 10, color: muted,
          }}>
            <div style={{
              width: 32, height: 32, border: `3px solid ${ACCENT}`,
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'gmspin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 13 }}>Loading Google Maps...</span>
          </div>
        )}
        <style>{`@keyframes gmspin{to{transform:rotate(360deg)}}`}</style>

        {mapStatus === 'error' && (
          <div style={{
            width: '100%', height: 280, borderRadius: 14,
            border: `1.5px solid #fca5a5`, background: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8, color: '#dc2626',
          }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Google Maps failed to load</span>
            <span style={{ fontSize: 12, color: '#991b1b' }}>Check API key & enable Maps JavaScript API in Google Cloud Console</span>
          </div>
        )}
      </div>

      {/* ── Selected location display ──────────────────────────── */}
      {selectedAddress ? (
        <div style={{
          marginTop: 10, padding: '10px 14px',
          background: dm ? '#121212' : '#f0f9ff',
          border: `1px solid ${border}`, borderRadius: 10,
          fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <span style={{ flexShrink: 0, fontSize: 16 }}>📍</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2, color: ACCENT }}>Selected Location</div>
            <div style={{ color: muted, lineHeight: 1.5 }}>{selectedAddress}</div>
            {coords && (
              <div style={{ color: muted, fontSize: 11, marginTop: 3 }}>
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
            )}
          </div>
        </div>
      ) : (
        mapStatus === 'ready' && (
          <div style={{ marginTop: 8, fontSize: 13, color: muted, textAlign: 'center' }}>
            Tap map • Search above • 📍 Current • 📡 Live
          </div>
        )
      )}
    </div>
  );
};

// Dark map style
const DARK_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1e1e1e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#121212' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#333333' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#121212' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f2942' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
];

export default GoogleMapPicker;
