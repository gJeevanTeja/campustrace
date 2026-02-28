import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const Chat = ({ darkMode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dm = darkMode;
  const bg = dm ? '#0f172a' : '#f0f2f5';
  const text = dm ? '#e2e8f0' : '#1a1a1a';
  const muted = dm ? '#94a3b8' : '#65676b';
  const border = dm ? '#334155' : '#e4e6ea';
  const headerBg = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)';

  // ── Open direct room from URL param ──────────────────────────────
  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId) {
      navigate(`/chat/${roomId}`, { replace: true });
      return;
    }
    loadRooms();
  }, [navigate, searchParams]);

  const loadRooms = async () => {
    try {
      const { data } = await chatAPI.getRooms();
      setRooms(Array.isArray(data) ? data : (data.results || []));
    } catch {
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  // ── Resolve "other user" name from room ──────────────────────────
  const getOtherUser = (room) => {
    if (room.other_participant?.name) return room.other_participant.name;
    if (!user) return room.participant1_name || 'User';
    if (room.participant1 === user.id) return room.participant2_name;
    return room.participant1_name;
  };

  const getInitial = (room) => getOtherUser(room)?.[0]?.toUpperCase() || 'U';

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const AVATAR_COLORS = [
    'linear-gradient(135deg,#f97316,#ef4444)',
    'linear-gradient(135deg,#8b5cf6,#6366f1)',
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
    'linear-gradient(135deg,#ec4899,#db2777)',
  ];

  const getAvatarColor = (name) => {
    const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 70 }}>

      {/* Header */}
      <div style={{ background: headerBg, padding: '20px 16px 18px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Messages</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, opacity: 0.8 }}>Private conversations</p>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            💬
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 16px', fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ padding: '12px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: muted }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
            <p>Loading conversations...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 70 }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>💬</div>
            <p style={{ color: text, fontWeight: 700, fontSize: 18, margin: '0 0 6px' }}>No conversations yet</p>
            <p style={{ color: muted, fontSize: 14 }}>Start a chat from any item's detail page.</p>
          </div>
        ) : (
          rooms.map(room => {
            const name = getOtherUser(room);
            const hasUnread = room.unread_count > 0;
            return (
              <div key={room.id} onClick={() => navigate(`/chat/${room.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 16px', cursor: 'pointer',
                  background: hasUnread ? (dm ? '#1e3a5f' : '#e8f0fe') : 'transparent',
                  borderBottom: `1px solid ${border}`,
                  transition: 'background 0.15s',
                }}>

                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: '50%',
                    background: getAvatarColor(name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 22,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                    {getInitial(room)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontWeight: hasUnread ? 800 : 600, fontSize: 16, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                      {name}
                    </span>
                    <span style={{ fontSize: 12, color: hasUnread ? '#2563eb' : muted, fontWeight: hasUnread ? 700 : 400, flexShrink: 0 }}>
                      {formatTime(room.last_message_time || room.updated_at)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: hasUnread ? (dm ? '#93c5fd' : '#1d4ed8') : muted, fontWeight: hasUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {room.last_message
                        ? (room.last_message.length > 40 ? room.last_message.slice(0, 40) + '…' : room.last_message)
                        : `Re: ${room.item?.title || room.item_title || 'Item'}`}
                    </span>
                    {hasUnread && (
                      <div style={{ background: '#2563eb', color: '#fff', borderRadius: '50%', minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0, marginLeft: 8 }}>
                        {room.unread_count > 9 ? '9+' : room.unread_count}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📦 {room.item?.title || room.item_title}
                    {room.item?.incident_datetime && ` • ${room.item.type === 'lost' ? 'Lost on' : 'Found on'}: ${new Date(room.item.incident_datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at ${new Date(room.item.incident_datetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav darkMode={darkMode} />
    </div>
  );
};

export default Chat;