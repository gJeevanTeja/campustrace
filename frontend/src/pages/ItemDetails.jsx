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

  // Claim Verification State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimAnswers, setClaimAnswers] = useState({ brand: '', color: '', unique_mark: '' });
  const [claimCode, setClaimCode] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [confirming, setConfirming] = useState(false);

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

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Actions ───────────────────────────────────────────────────
  const handleClaim = async () => {
    if (item.type === 'found') {
      setShowClaimModal(true);
      return;
    }
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

  const handleVerifyClaim = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setClaimError('');
    try {
      const res = await itemsAPI.verifyClaim(id, claimAnswers);
      setClaimCode(res.data.claim_code);
      setClaimSuccess(true);
      setItem(prev => ({ ...prev, status: 'claimed' }));
      setShowClaimModal(false);
    } catch (err) {
      setClaimError(err.response?.data?.error || 'Verification failed. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (!enteredCode) return;
    setConfirming(true);
    try {
      await itemsAPI.confirmReturn(id, enteredCode);
      setItem(prev => ({ ...prev, status: 'returned' }));
      setEnteredCode('');
      alert('Item successfully returned!');
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid claim code.');
    } finally {
      setConfirming(false);
    }
  };

  const handleApprove = async (claimId) => {
    try {
      if (!window.confirm("Approve this claim? An OTP will be generated.")) return;
      await itemsAPI.approveClaim(claimId);
      alert('Claim approved! The user has been notified.');
      fetchItem(); // refresh to update pending claims list
    } catch (err) {
      alert('Error approving claim.');
    }
  };

  const handleReject = async (claimId) => {
    try {
      if (!window.confirm("Reject this claim?")) return;
      await itemsAPI.rejectClaim(claimId);
      fetchItem(); // Refresh pending claims list
    } catch (err) {
      alert('Error rejecting claim.');
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
        {item.can_be_claimed && !claimSuccess && item.status === 'active' && !item.my_claim && (
          <button onClick={handleClaim} disabled={claiming}
            style={{ width: '100%', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 14, padding: 14, cursor: 'pointer', fontWeight: 700, fontSize: 16, marginBottom: 12, opacity: claiming ? 0.7 : 1 }}>
            {claiming ? 'Processing...' : (item.type === 'found' ? '✋ Claim This Item' : '✋ I Found This Item')}
          </button>
        )}

        {/* Claim Status (For Claimant) */}
        {(claimSuccess || (item.my_claim && item.my_claim.status === 'pending')) && (
          <div style={{ background: '#fef9c3', border: '1px solid #fef08a', borderRadius: 14, padding: 14, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#ca8a04', fontWeight: 700, fontSize: 14 }}>⏳ Claim Pending Review</p>
            <p style={{ margin: '6px 0 0', color: '#a16207', fontSize: 13 }}>Please wait for the finder to review your answers.</p>
          </div>
        )}

        {(item.my_claim && item.my_claim.status === 'rejected') && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 14, padding: 14, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#dc2626', fontWeight: 700, fontSize: 14 }}>❌ Claim Rejected</p>
            <p style={{ margin: '6px 0 0', color: '#b91c1c', fontSize: 13 }}>The finder did not approve your answers.</p>
          </div>
        )}

        {/* Claim Code Display (For verified owners) */}
        {(claimCode || (item.my_claim && item.my_claim.status === 'approved' && item.my_claim.claim_code)) && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 16, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', color: '#1d4ed8', fontWeight: 700, fontSize: 14 }}>✅ Ownership Verified!</p>
            <p style={{ margin: '0 0 12px', color: '#3b82f6', fontSize: 13 }}>Share this code with the person who found the item.</p>
            <div style={{ background: '#ffffff', borderRadius: 8, padding: '12px', fontSize: 24, fontWeight: 800, letterSpacing: '4px', color: '#1e3a8a', border: '1px dashed #93c5fd' }}>
              {claimCode || item.my_claim.claim_code}
            </div>
            <p style={{ margin: '8px 0 0', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>Expires in 30 minutes</p>
          </div>
        )}

        {/* Pending Claims Review (For the found item reporter) */}
        {item.pending_claims?.length > 0 && (
          <div style={{ background: colors.card, border: `1px solid ${colors.accent}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.accent, marginBottom: 12 }}>🕵️ PENDING CLAIMS ({item.pending_claims.length})</div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: colors.muted }}>Review the answers below to verify the real owner.</p>
            {item.pending_claims.map(claim => (
              <div key={claim.id} style={{ padding: 12, background: colors.bg, borderRadius: 12, marginBottom: 10, border: `1px solid ${colors.border}` }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>User: {claim.claimant?.username}</p>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>Brand/Make:</p>
                  <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>{claim.answers?.brand || 'N/A'}</p>
                  <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>Color:</p>
                  <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>{claim.answers?.color || 'N/A'}</p>
                  <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>Unique Mark:</p>
                  <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>{claim.answers?.unique_mark || 'N/A'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleApprove(claim.id)} style={{ flex: 1, padding: 10, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>✅ Approve</button>
                  <button onClick={() => handleReject(claim.id)} style={{ flex: 1, padding: 10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>❌ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enter Claim Code UI (For the found item reporter) */}
        {item.status === 'active' && item.type === 'found' && user && item.user?.id === user.id && (
          <div style={{ background: colors.card, border: `1px solid ${colors.accent}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.accent, marginBottom: 12 }}>🔐 VERIFY CLAIM CODE</div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: colors.muted }}>Enter the 6-digit code shared by an approved owner to confirm return.</p>
            <form onSubmit={handleConfirmReturn} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 18, fontWeight: 700, textAlign: 'center', letterSpacing: '2px', outline: 'none' }}
              />
              <button disabled={confirming || enteredCode.length < 6} type="submit" style={{ background: colors.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '0 20px', fontWeight: 700, cursor: (confirming || enteredCode.length < 6) ? 'not-allowed' : 'pointer', opacity: (confirming || enteredCode.length < 6) ? 0.6 : 1 }}>
                {confirming ? '...' : 'Confirm'}
              </button>
            </form>
          </div>
        )}

        {/* Returned success state */}
        {item.status === 'returned' && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 14, padding: 14, marginBottom: 12, textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#16a34a', fontWeight: 700 }}>🎉 Item Successfully Returned!</p>
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

      {/* ── Claim Verification Modal ────────────────────────────── */}
      {showClaimModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: colors.bg, width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '24px 20px', boxSizing: 'border-box', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>Verify Ownership</h3>
              <button onClick={() => setShowClaimModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, color: colors.muted, cursor: 'pointer' }}>×</button>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: colors.muted }}>
              To ensure this returns to the right person, answer at least 3 details about the item correctly.
            </p>
            {claimError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
                ⚠️ {claimError}
              </div>
            )}
            <form onSubmit={handleVerifyClaim}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Brand / Make</label>
                <input required type="text" placeholder="e.g. Apple, Nike" value={claimAnswers.brand} onChange={e => setClaimAnswers(prev => ({ ...prev, brand: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1.5px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Color</label>
                <input required type="text" placeholder="e.g. Matte Black" value={claimAnswers.color} onChange={e => setClaimAnswers(prev => ({ ...prev, color: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1.5px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Unique Mark / Scratch</label>
                <input required type="text" placeholder="e.g. Scratch on top left corner" value={claimAnswers.unique_mark} onChange={e => setClaimAnswers(prev => ({ ...prev, unique_mark: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1.5px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button disabled={verifying} type="submit" style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: colors.accent, color: '#fff', fontWeight: 700, fontSize: 16, cursor: verifying ? 'not-allowed' : 'pointer', opacity: verifying ? 0.7 : 1 }}>
                {verifying ? 'Verifying...' : 'Verify Answers'}
              </button>
            </form>
          </div>
          <style>{`
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>
        </div>
      )}

      <BottomNav darkMode={dm} />
    </div>
  );
};

export default ItemDetails;