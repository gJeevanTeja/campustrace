import React, { useEffect, useState } from 'react';

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getDirection(lat1, lng1, lat2, lng2) {
  const angle = Math.atan2(lng2 - lng1, lat2 - lat1) * 180 / Math.PI;
  const dirs = ['North','NE','East','SE','South','SW','West','NW'];
  return dirs[Math.round(((angle % 360) + 360) % 360 / 45) % 8];
}

function getTravelTime(km) {
  const walkMins = Math.round(km * 12);
  const bikeMins = Math.round(km * 3);
  const carMins  = Math.round(km * 1.5);
  const fmt = m => m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
  return { walk: fmt(walkMins), bike: fmt(bikeMins), car: fmt(carMins) };
}

/**
 * DistanceCard
 * Props: itemLat, itemLng, darkMode
 */
const DistanceCard = ({ itemLat, itemLng, darkMode }) => {
  const [distance, setDistance]   = useState(null);
  const [direction, setDirection] = useState(null);
  const [travel, setTravel]       = useState(null);
  const [weather, setWeather]     = useState(null);
  const [status, setStatus]       = useState('loading'); // loading | ready | denied | nocoords

  const card   = darkMode ? '#1e1e1e' : '#fff';
  const text   = darkMode ? '#e2e8f0' : '#1e1e1e';
  const muted  = darkMode ? '#94a3b8' : '#64748b';
  const border = darkMode ? '#2d2d2d' : '#e2e8f0';

  useEffect(() => {
    if (!itemLat || !itemLng) { setStatus('nocoords'); return; }

    // Fetch weather
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${itemLat}&longitude=${itemLng}&current_weather=true`)
      .then(r => r.json())
      .then(data => {
        const cw = data.current_weather;
        const code = cw.weathercode;
        let condition = 'Clear', icon = '☀️';
        if (code >= 51 && code <= 67) { condition = 'Rainy';  icon = '🌧️'; }
        else if (code >= 71 && code <= 77) { condition = 'Snowy'; icon = '❄️'; }
        else if (code >= 80 && code <= 99) { condition = 'Stormy'; icon = '⛈️'; }
        else if (code >= 1  && code <= 3)  { condition = 'Cloudy'; icon = '⛅'; }
        else if (code >= 45 && code <= 48) { condition = 'Foggy';  icon = '🌫️'; }
        setWeather({ temp: Math.round(cw.temperature), condition, icon });
      })
      .catch(() => {});

    // Get user location
    if (!navigator.geolocation) { setStatus('denied'); return; }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: uLat, longitude: uLng } = pos.coords;
        const dist = getDistanceKm(uLat, uLng, itemLat, itemLng);
        setDistance(dist);
        setDirection(getDirection(uLat, uLng, itemLat, itemLng));
        setTravel(getTravelTime(dist));
        setStatus('ready');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [itemLat, itemLng]);

  const formatDist = (d) => d < 1 ? `${Math.round(d*1000)} m` : `${d.toFixed(1)} km`;

  if (status === 'nocoords') return null;

  return (
    <div style={{
      background: card, borderRadius: 16,
      border: `1px solid ${border}`,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      marginBottom: 12
    }}>
      {/* Distance row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: weather ? '1fr 1fr' : '1fr',
        borderBottom: travel ? `1px solid ${border}` : 'none'
      }}>
        {/* Distance */}
        <div style={{
          padding: '16px',
          borderRight: weather ? `1px solid ${border}` : 'none'
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            📏 Distance from you
          </div>
          {status === 'loading' && (
            <div style={{ fontSize: 13, color: muted }}>Detecting location...</div>
          )}
          {status === 'denied' && (
            <div>
              <div style={{ fontSize: 13, color: '#f59e0b' }}>⚠️ Location access denied</div>
              <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Enable in browser settings</div>
            </div>
          )}
          {status === 'ready' && distance !== null && (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>
                {formatDist(distance)}
              </div>
              <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                Head {direction}
              </div>
            </>
          )}
        </div>

        {/* Weather */}
        {weather && (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              🌡️ Weather there
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: text }}>
              {weather.icon} {weather.temp}°C
            </div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
              {weather.condition}
            </div>
          </div>
        )}
      </div>

      {/* Travel time row */}
      {travel && status === 'ready' && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          background: darkMode ? '#121212' : '#f8fafc'
        }}>
          {[
            { icon: '🚶', label: 'Walk', time: travel.walk },
            { icon: '🏍️', label: 'Bike', time: travel.bike },
            { icon: '🚗', label: 'Drive', time: travel.car },
          ].map((t, i) => (
            <div key={i} style={{
              padding: '10px 8px', textAlign: 'center',
              borderRight: i < 2 ? `1px solid ${border}` : 'none'
            }}>
              <div style={{ fontSize: 16 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{t.time}</div>
              <div style={{ fontSize: 11, color: muted }}>{t.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DistanceCard;