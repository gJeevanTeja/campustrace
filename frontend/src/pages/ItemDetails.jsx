/**
 * ItemDetails.jsx
 * Change from original: uses GoogleLocationCard instead of LocationCard.
 * All distance/weather/directions logic is now inside GoogleLocationCard.
 * The local calcDistance / getDirection / fetchWeather / userLocation state
 * is removed from this file — GoogleLocationCard handles it internally.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsAPI, chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import GoogleLocationCard from '../components/LocationCard';  // ← replaces LocationCard

const ItemDetails = ({ darkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [startingChat, setStartingChat] = useState(false);

  const dm = darkMode;
  const colors = {
    bg: dm ? '#0f172a' : '#f8fafc',
    card: dm ? '#1e293b' : '#ffffff',
    text: dm ? '#e2e8f0' : '#1e293b',
    muted: dm ? '#94a3b8' : '#64748b',
    border: dm ? '#334155' : '#e2e8f0',
    accent: '#3b82f6',
    tag: dm ? '#0f2942' : '#eff6ff',
    tagText: dm ? '#93c5fd' : '#1d4ed8',
    nearbyBg: dm ? '#162032' : '#f0fdf4',
    nearbyBorder: dm ? '#1a4d2c' : '#bbf7d0',
  };

  // ── Fetch item ────────────────────────────────────────────────
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await itemsAPI.getById(id);
        setItem(res.data);
      } catch {
        setError('Item not found or has been removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  // ── Actions ───────────────────────────────────────────────────
  const handleClaim = async () => {
    if (!window.confirm('Are you sure you want to claim this item?')) return;
    setClaiming(true);
    try {
      await itemsAPI.claimItem(id);
      setClaimSuccess(true);
      setItem(prev => ({ ...prev, status: 'claimed' }));
    } catch {
      alert('Could not claim item. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const handleStartChat = async () => {
    if (user && item && (item.user?.id === user.id || item.user === user.id)) {
      alert("You can't chat with yourself.");
      return;
    }
    setStartingChat(true);
    try {
      const res = await chatAPI.startChat({ item_id: item.id });
      const roomId = res.data.id || res.data.room_id;
      navigate(`/chat/${roomId}`);
    } catch (e) {
      alert(e?.response?.data?.error || 'Could not start chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  const handleCall = () => {
    const phone = item?.contact_phone || item?.user?.phone;
    if (!phone) return alert('No phone number available');
    window.location.href = `tel:+91${phone.replace(/\D/g, '').slice(-10)}`;
  };

  const handleWhatsApp = () => {
    const phone = item?.contact_phone || item?.user?.phone;
    if (!phone) return alert('No phone number available');
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    const msg = encodeURIComponent(
      `Hi, I saw your ${item.type} item "${item.title}" on CampusTrace (Ref: ${item.reference_number}). I wanted to connect with you.`
    );
    window.open(`https://wa.me/91${cleaned}?text=${msg}`, '_blank');
  };

  // ── Helpers ───────────────────────────────────────────────────
  const getStatusColor = (s) => {
    if (s === 'active') return { bg: '#dcfce7', text: '#16a34a' };
    if (s === 'claimed') return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#f1f5f9', text: '#64748b' };
  };
  const getTypeColor = (t) =>
    t === 'lost'
      ? { bg: '#fee2e2', text: '#dc2626' }
      : { bg: '#dcfce7', text: '#16a34a' };

  const allPhotos = item
    ? [
      item.image_url,
      ...(item.photos?.filter(p => !p.is_primary).map(p => p.photo_url) || []),
    ].filter(Boolean)
    : [];

  // ── Loading / error screens ───────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <p style={{ color: colors.muted }}>Loading item details...</p>
      </div>
    </div>
  );

  if (error || !item) return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 50 }}>😕</div>
      <p style={{ color: colors.text, fontSize: 16 }}>{error || 'Item not found'}</p>
      <button onClick={() => navigate(-1)} style={{ background: colors.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>
        Go Back
      </button>
    </div>
  );

  const statusColor = getStatusColor(item.status);
  const typeColor = getTypeColor(item.type);

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, paddingBottom: 100 }}>

      {/* ── Sticky header ─────────────────────────────────────── */}
      <div style={{ background: colors.card, padding: '14px 16px', borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: colors.text }}>←</button>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: colors.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Item Details
        </h1>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusColor.bg, color: statusColor.text }}>
          {item.status?.toUpperCase()}
        </span>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: 16 }}>

        {/* ── Photo gallery ─────────────────────────────────────── */}
        {allPhotos.length > 0 ? (
          <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: colors.card, border: `1px solid ${colors.border}` }}>
            <div style={{ position: 'relative', height: 260 }}>
              <img src={allPhotos[activePhoto]} alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }} />
              <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: typeColor.bg, color: typeColor.text }}>
                {item.type?.toUpperCase()}
              </span>
            </div>
            {allPhotos.length > 1 && (
              <div style={{ display: 'flex', gap: 6, padding: '8px 10px', overflowX: 'auto' }}>
                {allPhotos.map((photo, i) => (
                  <img key={i} src={photo} alt="" onClick={() => setActivePhoto(i)}
                    style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', flexShrink: 0, border: `2px solid ${i === activePhoto ? colors.accent : 'transparent'}` }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: 200, borderRadius: 16, marginBottom: 16, background: dm ? '#1e293b' : '#f1f5f9', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 50 }}>📦</div>
            <p style={{ color: colors.muted, fontSize: 13 }}>No photo available</p>
          </div>
        )}

        {/* ── Title + badges ─────────────────────────────────────── */}
        <div style={{ background: colors.card, borderRadius: 16, padding: '18px 16px', marginBottom: 12, border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: typeColor.bg, color: typeColor.text }}>{item.type?.toUpperCase()}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: colors.tag, color: colors.tagText }}>{item.category}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: dm ? '#1e293b' : '#f1f5f9', color: colors.muted }}>#{item.reference_number}</span>
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: colors.text }}>{item.title}</h2>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: colors.muted, lineHeight: 1.6 }}>{item.description}</p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: colors.muted, fontSize: 13 }}>
            <span>🕐</span><span>{item.time_ago}</span>
            {item.incident_datetime && (
              <span style={{ marginLeft: 8 }}>· {item.type === 'lost' ? 'Lost on' : 'Found on'}: {new Date(item.incident_datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(item.incident_datetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
            )}
          </div>
        </div>

        {/* ── Google Location Card (replaces old LocationCard) ─── */}
        {item.latitude && item.longitude ? (
          <GoogleLocationCard
            itemLat={item.latitude}
            itemLng={item.longitude}
            locationName={item.location_name || item.location_display || item.location}
            locationDetail={item.location_detail}
            itemType={item.type}
            darkMode={dm}
          />
        ) : (
          /* Fallback text card when no GPS coordinates */
          <div style={{ background: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              📍 Location Details
            </div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: colors.text }}>
              {item.location_name || item.location_display || item.location}
            </p>
            {item.location_detail && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.muted }}>{item.location_detail}</p>
            )}
          </div>
        )}

        {/* ── Posted by ─────────────────────────────────────────── */}
        <div style={{ background: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>👤 Posted By</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: dm ? '#334155' : '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: colors.accent, flexShrink: 0, overflow: 'hidden' }}>
              {item.user?.avatar
                ? <img src={item.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : item.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: colors.text }}>{item.user?.name || 'Unknown'}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.muted }}>
                {item.user?.department || ''}
                {item.user?.college_year ? ` · ${item.user.college_year}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* ── Contact actions ───────────────────────────────────── */}
        {item.status === 'active' && !(user && item && (item.user?.id === user.id || item.user === user.id)) && (
          <div style={{ background: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>📲 Contact Owner</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={handleStartChat} disabled={startingChat}
                style={{ flex: 1, minWidth: 100, background: colors.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 8px', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: startingChat ? 0.7 : 1 }}>
                💬 {startingChat ? 'Opening...' : 'Chat'}
              </button>
              <button onClick={handleCall}
                style={{ flex: 1, minWidth: 100, background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 8px', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                📞 Call
              </button>
              <button onClick={handleWhatsApp}
                style={{ flex: 1, minWidth: 100, background: '#25d366', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 8px', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                WhatsApp
              </button>
            </div>
            {(item.contact_phone || item.user?.phone) && (
              <p style={{ margin: '10px 0 0', fontSize: 13, color: colors.muted, textAlign: 'center' }}>
                +91 {(item.contact_phone || item.user?.phone)?.replace(/\D/g, '').slice(-10)}
              </p>
            )}
          </div>
        )}

        {/* ── Claim button ──────────────────────────────────────── */}
        {item.can_be_claimed && !claimSuccess && (
          <button onClick={handleClaim} disabled={claiming}
            style={{ width: '100%', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 14, padding: 14, cursor: 'pointer', fontWeight: 700, fontSize: 16, marginBottom: 12, opacity: claiming ? 0.7 : 1 }}>
            {claiming ? 'Claiming...' : '✋ I Found This Item'}
          </button>
        )}
        {claimSuccess && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 14, padding: 14, marginBottom: 12, textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#16a34a', fontWeight: 600 }}>✅ Item marked as found! The owner will be notified.</p>
          </div>
        )}

        {/* ── Nearby matches ────────────────────────────────────── */}
        {item.nearby_matches?.length > 0 && (
          <div style={{ background: colors.nearbyBg, border: `1px solid ${colors.nearbyBorder}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
              🎯 Nearby Matches ({item.nearby_matches.length})
            </div>
            {item.nearby_matches.map(match => (
              <div key={match.id} onClick={() => navigate(`/item/${match.id}`)}
                style={{ background: colors.card, borderRadius: 10, padding: 12, marginBottom: 8, cursor: 'pointer', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>{match.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.muted }}>{match.time_ago}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: match.type === 'found' ? '#dcfce7' : '#fee2e2', color: match.type === 'found' ? '#16a34a' : '#dc2626' }}>
                    {match.type?.toUpperCase()}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: colors.accent, fontWeight: 600 }}>
                    📍 {match.distance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Item meta ─────────────────────────────────────────── */}
        <div style={{ background: colors.card, borderRadius: 16, padding: 16, border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
            ℹ️ Item Info
          </div>
          {[
            ['Reference', `#${item.reference_number}`],
            ['Category', item.category],
            ['Type', item.type],
            ['Status', item.status],
            ['Posted', item.time_ago],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 13, color: colors.muted }}>{label}</span>
              <span style={{ fontSize: 13, color: colors.text, fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
            </div>
          ))}
        </div>

      </div>
      <BottomNav darkMode={dm} />
    </div>
  );
};

export default ItemDetails;