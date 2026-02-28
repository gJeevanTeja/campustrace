// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmojiPicker from '../components/EmojiPicker';

const THEMES = {
  messenger: { name: '💙 Messenger', bg: '#e5ddd5', sentBg: '#0084ff', sentText: '#fff', receivedBg: '#fff', receivedText: '#050505', header: '#0084ff' },
  dark: { name: '🌑 Dark', bg: '#0f172a', sentBg: '#3b82f6', sentText: '#fff', receivedBg: '#1e293b', receivedText: '#e2e8f0', header: '#1e293b' },
  green: { name: '🌿 Forest', bg: '#d4edda', sentBg: '#2d6a4f', sentText: '#fff', receivedBg: '#fff', receivedText: '#1b1b1b', header: '#2d6a4f' },
  rose: { name: '🌸 Rose', bg: '#fce4ec', sentBg: '#e91e63', sentText: '#fff', receivedBg: '#fff', receivedText: '#1b1b1b', header: '#e91e63' },
  midnight: { name: '🔮 Midnight', bg: '#1a1a2e', sentBg: '#7c3aed', sentText: '#fff', receivedBg: '#16213e', receivedText: '#e0e0e0', header: '#7c3aed' },
};

const COLORS = ['#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

// ── Utility: normalize raw message from REST or WebSocket ──────────────
function normalizeMessage(raw, myId) {
  return {
    ...raw,
    is_mine: parseInt(raw.sender_id, 10) === myId || raw.is_mine === true,
    text: raw.message || raw.text || '',
    message_type: raw.message_type || 'text',
    media_url: raw.media_url || null,
    is_forwarded: raw.is_forwarded || false,
    original_sender: raw.original_sender || null,
  };
}

const ChatRoom = ({ darkMode }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const myId = parseInt(user?.id, 10);  // always int

  // ── State ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showDotMenu, setShowDotMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaTab, setMediaTab] = useState('all');
  const [mediaData, setMediaData] = useState(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Search
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);  // null = not searched yet

  // Forward
  const [forwardMode, setForwardMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState(new Set());
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  const [allRooms, setAllRooms] = useState([]);

  const themeKey = `chat_theme_${roomId}`;
  const [themeId, setThemeId] = useState(() => localStorage.getItem(themeKey) || 'messenger');
  const theme = THEMES[themeId] || THEMES.messenger;

  // ── Refs ──────────────────────────────────────────────────────
  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const isAtBottom = useRef(true);
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // ── Polling fallback ──────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await chatAPI.getMessages(roomId);
        const msgs = data.messages || (Array.isArray(data) ? data : []);
        setMessages(msgs.map(m => normalizeMessage(m, myId)));
      } catch { }
    }, 3000);
  }, [roomId, myId]);

  // ── Load messages ─────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      const { data } = await chatAPI.getMessages(roomId);
      if (data.messages) {
        setMessages(data.messages.map(m => normalizeMessage(m, myId)));
        setRoomInfo(data);
        setIsMuted(data.is_muted || false);
      } else if (Array.isArray(data)) {
        setMessages(data.map(m => normalizeMessage(m, myId)));
      }
    } catch { }
    finally { setLoading(false); }
  }, [roomId, myId]);

  // ── WebSocket ─────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    const token = localStorage.getItem('access_token');
    const host = process.env.REACT_APP_API_IP || window.location.hostname;
    const ws = new WebSocket(`ws://${host}:8000/ws/chat/${roomId}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('open');
      clearInterval(pollRef.current);
      pollRef.current = null;
    };

    ws.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        if (!isMutedRef.current) {
          try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=').play().catch(() => { }); } catch { }
        }
        const msg = normalizeMessage(raw, myId);
        setMessages(prev => {
          if (msg.is_mine) {
            if (prev.some(m => m.temp)) return [...prev.filter(m => !m.temp), msg];
          }
          if (msg.id && prev.some(m => m.id === msg.id)) return prev;
          return [...prev.filter(m => !m.temp), msg];
        });
      } catch { }
    };

    ws.onerror = () => { setWsStatus('polling'); startPolling(); };
    ws.onclose = () => { setWsStatus('polling'); startPolling(); };
  }, [roomId, myId, startPolling]);

  // ── Lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    loadMessages();
    connectWS();
    return () => { wsRef.current?.close(); clearInterval(pollRef.current); };
  }, [loadMessages, connectWS]);

  // ── Auto scroll ───────────────────────────────────────────────
  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: messages.length <= 20 ? 'auto' : 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottom.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 60;
  };

  // ── Send text ─────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const txt = (text !== undefined ? text : input).trim();
    if (!txt || sending || isBlocked) return;
    if (text === undefined) setInput('');
    setSending(true);
    isAtBottom.current = true;

    const temp = {
      temp: true, id: null, message: txt, text: txt,
      message_type: 'text', sender_id: myId, is_mine: true,
      created_at: new Date().toISOString(),
      is_forwarded: false, original_sender: null,
    };
    setMessages(prev => [...prev, temp]);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message: txt, message_type: 'text' }));
    } else {
      try {
        const { data } = await chatAPI.sendMessage(roomId, txt);
        setMessages(prev => [...prev.filter(m => !m.temp), normalizeMessage({ ...data, is_mine: true }, myId)]);
      } catch {
        if (text === undefined) setInput(txt);
        setMessages(prev => prev.filter(m => !m.temp));
      }
    }
    setSending(false);
    inputRef.current?.focus();
  };

  // ── File upload ───────────────────────────────────────────────
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttachMenu(false);
    setSending(true);
    isAtBottom.current = true;

    const icon = type === 'image' ? '🖼️' : type === 'video' ? '🎥' : '📄';
    const temp = {
      temp: true, id: null,
      message: `${icon} Sending ${file.name}...`, text: `${icon} Sending...`,
      message_type: type, sender_id: myId, is_mine: true,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, temp]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await chatAPI.uploadMedia(roomId, formData);
      setMessages(prev => [...prev.filter(m => !m.temp), normalizeMessage({ ...data, is_mine: true }, myId)]);
    } catch {
      setMessages(prev => prev.filter(m => !m.temp));
    }
    setSending(false);
    e.target.value = '';
  };

  // ── Clear Chat ────────────────────────────────────────────────
  const handleClearChat = async () => {
    if (!window.confirm('Clear all messages in this chat? This cannot be undone.')) return;
    setShowDotMenu(false);
    setClearingChat(true);
    try {
      await chatAPI.clearChat(roomId);
      setMessages([]);
    } catch { alert('Failed to clear chat. Please try again.'); }
    setClearingChat(false);
  };

  // ── Mute / Unmute ─────────────────────────────────────────────
  const handleMuteToggle = async () => {
    setShowDotMenu(false);
    try {
      if (isMuted) {
        await chatAPI.unmuteRoom(roomId);
        setIsMuted(false);
      } else {
        await chatAPI.muteRoom(roomId);
        setIsMuted(true);
      }
    } catch { alert('Failed to update mute setting.'); }
  };

  // ── Block User ────────────────────────────────────────────────
  const handleBlockUser = async () => {
    const otherId = roomInfo?.other_participant?.id;
    if (!otherId) return;
    if (!window.confirm(`Block ${otherName}? They will not be able to message you.`)) return;
    setShowDotMenu(false);
    try {
      await chatAPI.blockUser(otherId);
      setIsBlocked(true);
      alert(`${otherName} has been blocked.`);
    } catch { alert('Failed to block user.'); }
  };

  // ── Search ────────────────────────────────────────────────────
  const handleSearch = async (q) => {
    if (!q.trim()) { setSearchResults(null); return; }
    try {
      const { data } = await chatAPI.searchMessages(roomId, q);
      setSearchResults(data.results || []);
    } catch { setSearchResults([]); }
  };

  // ── Forward ───────────────────────────────────────────────────
  const toggleSelectMessage = (msgId) => {
    setSelectedMsgIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
  };

  const openForwardPicker = async () => {
    if (selectedMsgIds.size === 0) { alert('Select at least one message to forward.'); return; }
    try {
      const { data } = await chatAPI.getRooms();
      setAllRooms(data.filter(r => r.id !== parseInt(roomId, 10)));
      setShowForwardPicker(true);
    } catch { }
  };

  const handleForward = async (targetRoomId) => {
    setShowForwardPicker(false);
    for (const msgId of selectedMsgIds) {
      try { await chatAPI.forwardMessage(msgId, targetRoomId); } catch { }
    }
    setForwardMode(false);
    setSelectedMsgIds(new Set());
    alert('Message(s) forwarded!');
  };

  // ── Media viewer ──────────────────────────────────────────────
  const openMediaViewer = async () => {
    setShowDotMenu(false);
    setShowMediaViewer(true);
    setMediaLoading(true);
    try {
      const { data } = await chatAPI.getMedia(roomId);
      setMediaData(data);
    } catch { setMediaData({ media: [], links: [], counts: {} }); }
    setMediaLoading(false);
  };

  // ── Theme ─────────────────────────────────────────────────────
  const applyTheme = (id) => {
    setThemeId(id);
    localStorage.setItem(themeKey, id);
    setShowThemePicker(false);
    setShowDotMenu(false);
  };

  // ── Helpers ───────────────────────────────────────────────────
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const formatDateSep = (d) => {
    const date = new Date(d);
    const diff = Math.floor((new Date() - date) / 86400000);
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'YESTERDAY';
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
  };

  const otherName = roomInfo?.other_participant?.name || 'User';
  const otherUserId = roomInfo?.other_participant?.id;
  const itemTitle = roomInfo?.item?.title || '';
  const avatarColor = COLORS[(otherName.charCodeAt(0) || 0) % COLORS.length];

  // ── Dot menu items ────────────────────────────────────────────
  // ✅ View Profile → own profile | clicking header → other user's profile
  const dotMenuItems = [
    { label: '👤 View Profile', action: () => { navigate('/profile'); setShowDotMenu(false); } },
    { label: '🔍 Search', action: () => { setSearchMode(true); setShowDotMenu(false); } },
    { label: '🖼️ Media & Links', action: openMediaViewer },
    { label: isMuted ? '🔔 Unmute' : '🔕 Mute', action: handleMuteToggle },
    { label: '🎨 Chat Theme', action: () => { setShowThemePicker(true); setShowDotMenu(false); } },
    { label: '📨 Forward Message', action: () => { setForwardMode(true); setShowDotMenu(false); } },
    { label: '📞 View Contact', action: () => { navigate(`/user/${otherUserId}`); setShowDotMenu(false); } },
    { label: '🚫 Block User', action: handleBlockUser, danger: true },
    { label: clearingChat ? '⏳ Clearing...' : '🗑️ Clear Chat', action: handleClearChat, danger: true },
  ];

  // ── Grouped messages with date separators ─────────────────────
  const displayMessages = searchMode && searchResults !== null ? searchResults : messages;
  const grouped = displayMessages.reduce((acc, msg, i) => {
    const dk = new Date(msg.created_at).toDateString();
    const prev = displayMessages[i - 1];
    if (!prev || new Date(prev.created_at).toDateString() !== dk)
      acc.push({ type: 'sep', date: msg.created_at, key: `sep-${i}` });
    acc.push({ type: 'msg', ...msg, key: msg.id || `tmp-${i}` });
    return acc;
  }, []);

  // ── Render message bubble content ─────────────────────────────
  const renderContent = (item) => {
    const mtype = item.message_type || 'text';
    const txt = item.text || item.message || '';
    const isMe = item.is_mine;

    if (mtype === 'image' && item.media_url) {
      return (
        <div>
          {item.is_forwarded && (
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
              ↪ Forwarded{item.original_sender ? ` from ${item.original_sender}` : ''}
            </div>
          )}
          <img
            src={item.media_url} alt="media"
            style={{ maxWidth: '100%', borderRadius: 10, display: 'block', maxHeight: 220, cursor: 'pointer' }}
            onClick={() => window.open(item.media_url, '_blank')}
          />
        </div>
      );
    }

    if (mtype === 'video' && item.media_url) {
      return (
        <div>
          {item.is_forwarded && (
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
              ↪ Forwarded{item.original_sender ? ` from ${item.original_sender}` : ''}
            </div>
          )}
          <video controls style={{ maxWidth: '100%', borderRadius: 10, maxHeight: 220, display: 'block' }}>
            <source src={item.media_url} />
          </video>
        </div>
      );
    }

    if (mtype === 'file' && item.media_url) {
      return (
        <a href={item.media_url} target="_blank" rel="noreferrer"
          style={{ color: isMe ? '#fff' : '#0084ff', textDecoration: 'underline', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 6 }}>
          {item.is_forwarded && <span style={{ fontSize: 11, opacity: 0.7 }}>↪ </span>}
          📄 {txt || 'Download file'}
        </a>
      );
    }

    // Text — auto linkify URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = txt.split(urlRegex);
    return (
      <span style={{ wordBreak: 'break-word' }}>
        {item.is_forwarded && (
          <span style={{ fontSize: 11, opacity: 0.7, display: 'block', marginBottom: 2 }}>
            ↪ Forwarded{item.original_sender ? ` from ${item.original_sender}` : ''}
          </span>
        )}
        {parts.map((part, i) =>
          urlRegex.test(part) ? (
            <a key={i} href={part} target="_blank" rel="noreferrer"
              style={{ color: isMe ? '#cfe8ff' : '#0084ff', textDecoration: 'underline' }}>
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${theme.header}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: '#65676b', fontSize: 14 }}>Loading messages...</p>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: theme.bg, overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      onClick={() => { setShowDotMenu(false); setShowEmoji(false); setShowAttachMenu(false); setShowThemePicker(false); }}
    >

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div
        style={{ background: theme.header, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Back */}
        <button onClick={() => navigate('/chat')}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#fff', padding: '4px 6px 4px 0' }}>←</button>

        {/* Avatar — clicks to OTHER user's profile */}
        <div style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => otherUserId && navigate(`/user/${otherUserId}`)}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, border: '2px solid rgba(255,255,255,0.4)' }}>
            {otherName[0]?.toUpperCase()}
          </div>
          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: wsStatus === 'open' ? '#31a24c' : '#ccc', border: `2px solid ${theme.header}` }} />
        </div>

        {/* Name — clicks to OTHER user's profile */}
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => otherUserId && navigate(`/user/${otherUserId}`)}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {otherName} {isMuted ? '🔕' : ''}
          </div>
          {itemTitle && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Re: {itemTitle} {roomInfo?.item?.incident_datetime && `(Occurred on ${new Date(roomInfo.item.incident_datetime).toLocaleDateString()})`}
            </div>
          )}
        </div>

        {/* 3-dot menu */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowDotMenu(v => !v)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ⋮
          </button>

          {showDotMenu && (
            <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', minWidth: 210, zIndex: 300, border: '1px solid #e4e6eb', overflow: 'hidden' }}>
              {dotMenuItems.map((item, i) => (
                <button key={i} onClick={item.action}
                  disabled={clearingChat}
                  style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: item.danger ? '#dc2626' : '#1a1a1a', borderBottom: i < dotMenuItems.length - 1 ? '1px solid #f0f2f5' : 'none', display: 'block', fontWeight: item.danger ? 600 : 400 }}
                  onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#fff5f5' : '#f0f2f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FORWARD TOOLBAR ────────────────────────────────────── */}
      {forwardMode && (
        <div style={{ background: '#1e293b', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>
            {selectedMsgIds.size === 0 ? 'Tap messages to select' : `${selectedMsgIds.size} selected`}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={openForwardPicker}
              disabled={selectedMsgIds.size === 0}
              style={{ padding: '6px 14px', borderRadius: 20, border: 'none', background: selectedMsgIds.size > 0 ? '#3b82f6' : '#475569', color: '#fff', fontSize: 13, cursor: selectedMsgIds.size > 0 ? 'pointer' : 'not-allowed' }}>
              Forward ➤
            </button>
            <button onClick={() => { setForwardMode(false); setSelectedMsgIds(new Set()); }}
              style={{ padding: '6px 14px', borderRadius: 20, border: 'none', background: '#475569', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── SEARCH BAR ─────────────────────────────────────────── */}
      {searchMode && (
        <div style={{ background: '#fff', padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #e4e6eb' }}>
          <input
            autoFocus value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
            placeholder="Search messages..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: '#f0f2f5', borderRadius: 20, padding: '8px 14px' }}
          />
          <button onClick={() => { setSearchMode(false); setSearchQuery(''); setSearchResults(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.header, fontWeight: 600, fontSize: 14 }}>
            Cancel
          </button>
        </div>
      )}

      {/* ── MESSAGES ───────────────────────────────────────────── */}
      <div ref={scrollRef} onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 4px' }}>

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#65676b', paddingTop: 80 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28 }}>
              {otherName[0]?.toUpperCase()}
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{otherName}</p>
            <p style={{ fontSize: 13, margin: 0 }}>Say hi to start the conversation! 👋</p>
          </div>
        )}

        {/* Search empty */}
        {searchMode && searchResults !== null && searchResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#65676b' }}>No messages found for "{searchQuery}"</div>
        )}

        {grouped.map((item) => {
          if (item.type === 'sep') return (
            <div key={item.key} style={{ textAlign: 'center', margin: '16px 0 8px' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#65676b', background: 'rgba(255,255,255,0.7)', padding: '3px 12px', borderRadius: 12 }}>
                {formatDateSep(item.date)}
              </span>
            </div>
          );

          const isMe = item.is_mine;
          const isSelected = selectedMsgIds.has(item.id);

          return (
            <div
              key={item.key}
              onClick={() => forwardMode && item.id && toggleSelectMessage(item.id)}
              style={{
                display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 8, marginBottom: 4,
                background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderRadius: 8, cursor: forwardMode ? 'pointer' : 'default',
                transition: 'background 0.15s', padding: forwardMode ? '2px 4px' : 0,
              }}
            >
              {/* Forward checkbox */}
              {forwardMode && item.id && (
                <div style={{ display: 'flex', alignItems: 'center', order: isMe ? 1 : -1, flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? '#3b82f6' : '#94a3b8'}`, background: isSelected ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
                    {isSelected ? '✓' : ''}
                  </div>
                </div>
              )}

              {!isMe && (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarColor, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11 }}>
                  {otherName[0]?.toUpperCase()}
                </div>
              )}

              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  background: isMe ? theme.sentBg : theme.receivedBg,
                  color: isMe ? theme.sentText : theme.receivedText,
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '9px 14px', fontSize: 15, lineHeight: 1.4,
                  opacity: item.temp ? 0.6 : 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)', minWidth: 40,
                }}>
                  {renderContent(item)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: '#65676b' }}>{formatTime(item.created_at)}</span>
                  {isMe && <span style={{ fontSize: 12, color: item.temp ? '#ccc' : theme.header }}>{item.temp ? '⏳' : '✓✓'}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* ── BLOCKED BANNER ─────────────────────────────────────── */}
      {isBlocked && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
          🚫 You have blocked this user. Unblock to send messages.
        </div>
      )}

      {/* ── INPUT BAR ──────────────────────────────────────────── */}
      {!isBlocked && (
        <div
          style={{ background: '#fff', borderTop: '1px solid #e4e6eb', padding: '8px 10px', display: 'flex', alignItems: 'flex-end', gap: 8, flexShrink: 0, paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Attach */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => { setShowAttachMenu(v => !v); setShowEmoji(false); }}
              style={{ width: 36, height: 36, borderRadius: '50%', background: theme.header, border: 'none', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              ➕
            </button>
            {showAttachMenu && (
              <div style={{ position: 'absolute', bottom: '110%', left: 0, background: '#fff', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb', zIndex: 200, overflow: 'hidden', minWidth: 160 }}>
                {[
                  { label: '🖼️ Image', accept: 'image/*', type: 'image' },
                  { label: '🎥 Video', accept: 'video/*', type: 'video' },
                  { label: '📄 File', accept: '*/*', type: 'file' },
                ].map((opt, i) => (
                  <label key={opt.type}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: '#1a1a1a', borderBottom: i < 2 ? '1px solid #f0f2f5' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <input type="file" accept={opt.accept} style={{ display: 'none' }} onChange={e => handleFileUpload(e, opt.type)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Text input */}
          <div style={{ flex: 1, background: '#f0f2f5', borderRadius: 22, display: 'flex', alignItems: 'flex-end', border: '1px solid #e4e6eb', overflow: 'visible', position: 'relative' }}>
            <textarea
              ref={inputRef} value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onKeyDown={handleKey} placeholder="Aa" rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '9px 12px', color: '#050505', fontSize: 15, resize: 'none', maxHeight: 100, fontFamily: 'inherit', lineHeight: 1.4 }}
            />
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => { setShowEmoji(v => !v); setShowAttachMenu(false); }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '8px 10px', color: '#f59e0b' }}>
                😊
              </button>
              {showEmoji && (
                <EmojiPicker
                  onSelect={emoji => { setInput(prev => prev + emoji); inputRef.current?.focus(); }}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>
          </div>

          {/* Send */}
          <button onClick={() => sendMessage()} disabled={!input.trim() || sending}
            style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() && !sending ? theme.header : '#e4e6eb', border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, transition: 'background 0.15s', color: input.trim() && !sending ? '#fff' : '#65676b' }}>
            ➤
          </button>
        </div>
      )}

      {/* ── THEME PICKER ───────────────────────────────────────── */}
      {showThemePicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowThemePicker(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>🎨 Chat Theme</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(THEMES).map(([id, t]) => (
                <button key={id} onClick={() => applyTheme(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: id === themeId ? `2px solid ${t.header}` : '2px solid #e4e6eb', borderRadius: 14, background: id === themeId ? `${t.header}15` : '#fafafa', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: t.bg, border: `2px solid ${t.header}`, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <div style={{ width: 20, height: 10, borderRadius: 5, background: t.sentBg }} />
                      <div style={{ width: 20, height: 10, borderRadius: 5, background: t.receivedBg, border: '1px solid #e4e6eb' }} />
                    </div>
                  </div>
                  {id === themeId && <span style={{ marginLeft: 'auto', color: t.header, fontWeight: 800 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FORWARD ROOM PICKER ─────────────────────────────────── */}
      {showForwardPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowForwardPicker(false)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e6eb' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Forward to...</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {allRooms.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#65676b' }}>No other chats available.</div>
              ) : (
                allRooms.map(r => (
                  <button key={r.id} onClick={() => handleForward(r.id)}
                    style={{ width: '100%', padding: '14px 20px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 12 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: COLORS[(r.other_user_name?.charCodeAt(0) || 0) % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                      {r.other_user_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.other_user_name}</div>
                      <div style={{ fontSize: 12, color: '#65676b' }}>{r.item_title}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MEDIA VIEWER ───────────────────────────────────────── */}
      {showMediaViewer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', flexDirection: 'column' }}
          onClick={() => setShowMediaViewer(false)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', marginTop: 'auto', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Media & Links</h3>
              <button onClick={() => setShowMediaViewer(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#65676b' }}>✕</button>
            </div>
            <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid #e4e6eb', gap: 4 }}>
              {[
                { id: 'all', label: `All (${(mediaData?.counts?.images || 0) + (mediaData?.counts?.videos || 0) + (mediaData?.counts?.files || 0)})` },
                { id: 'image', label: `📷 ${mediaData?.counts?.images || 0}` },
                { id: 'video', label: `🎥 ${mediaData?.counts?.videos || 0}` },
                { id: 'file', label: `📄 ${mediaData?.counts?.files || 0}` },
                { id: 'links', label: `🔗 ${mediaData?.links?.length || 0}` },
              ].map(tab => (
                <button key={tab.id} onClick={() => setMediaTab(tab.id)}
                  style={{ padding: '10px 12px', border: 'none', background: 'none', fontSize: 13, fontWeight: mediaTab === tab.id ? 700 : 400, color: mediaTab === tab.id ? theme.header : '#65676b', borderBottom: mediaTab === tab.id ? `2px solid ${theme.header}` : '2px solid transparent', cursor: 'pointer' }}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {mediaLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
              ) : !mediaData || (mediaData.media.length === 0 && mediaData.links.length === 0) ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#65676b' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                  <p>No media or links yet.</p>
                </div>
              ) : (
                <>
                  {(mediaTab === 'all' || ['image', 'video', 'file'].includes(mediaTab)) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                      {mediaData.media
                        .filter(m => mediaTab === 'all' || m.message_type === mediaTab)
                        .map(m => (
                          <div key={m.id}
                            onClick={() => m.media_url && window.open(m.media_url, '_blank')}
                            style={{ borderRadius: 10, overflow: 'hidden', background: '#f0f2f5', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, cursor: m.media_url ? 'pointer' : 'default' }}>
                            {m.media_url && m.message_type === 'image'
                              ? <img src={m.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : m.message_type === 'video' ? '🎥' : '📄'}
                          </div>
                        ))}
                    </div>
                  )}
                  {(mediaTab === 'all' || mediaTab === 'links') && (mediaData.links || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {mediaData.links.map((l, i) => (
                        <a key={i} href={l.url} target="_blank" rel="noreferrer"
                          style={{ display: 'block', padding: '10px 14px', background: '#f0f2f5', borderRadius: 12, color: theme.header, fontSize: 13, textDecoration: 'none', wordBreak: 'break-all' }}>
                          🔗 {l.url}
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{l.sender} · {new Date(l.created_at).toLocaleDateString()}</div>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatRoom;