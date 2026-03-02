import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
import BottomNav from '../components/BottomNav';
import { Package, CheckCircle2, PartyPopper, RefreshCw, Lock, Bell, User, Shield, Trash2, BellOff, X } from 'lucide-react';

// ── Notification type config (NO "message" type — chat is its own tab) ──────
const TYPE_CONFIG = {
  new_item: { icon: <Package size={20} />, label: 'New Item', color: '#3b82f6', bg: '#eff6ff' },
  item_claimed: { icon: <CheckCircle2 size={20} />, label: 'Item Claimed', color: '#10b981', bg: '#f0fdf4' },
  item_found: { icon: <PartyPopper size={20} />, label: 'Item Found', color: '#10b981', bg: '#f0fdf4' },
  item_returned: { icon: <RefreshCw size={20} />, label: 'Returned', color: '#8b5cf6', bg: '#f5f3ff' },
  password_changed: { icon: <Lock size={20} />, label: 'Security', color: '#f59e0b', bg: '#fffbeb' },
  system: { icon: <Bell size={20} />, label: 'System', color: '#64748b', bg: '#f1f5f9' },
  account: { icon: <User size={20} />, label: 'Account', color: '#ec4899', bg: '#fdf2f8' },
  default: { icon: <Bell size={20} />, label: 'Notification', color: '#64748b', bg: '#f1f5f9' },
};

// Filter tabs — Messages intentionally excluded (use Chat tab for that)
const FILTER_TABS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'unread', label: 'Unread', icon: <Bell size={16} /> },
  { id: 'new_item', label: 'Items', icon: <Package size={16} /> },
  { id: 'claimed', label: 'Claimed', icon: <CheckCircle2 size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
];

const Notifications = ({ darkMode }) => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [clearing, setClearing] = useState(false);

  const dm = darkMode;
  const bg = dm ? '#121212' : '#f8fafc';
  const card = dm ? '#1e1e1e' : '#ffffff';
  const text = dm ? '#e2e8f0' : '#1a1a1a';
  const muted = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#2d2d2d' : '#e4e6ea';
  const headerBg = 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)';

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsAPI.getAll();
      const list = Array.isArray(data) ? data : (data.results || []);
      // Exclude chat/message type notifications — those belong in Chat
      const filtered = list.filter(n =>
        !['new_message', 'message', 'chat'].includes(n.notification_type)
      );
      setNotifications(filtered);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Actions ───────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.deleteOne(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    setClearing(true);
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
    } catch { } finally {
      setClearing(false);
    }
  };

  const handleTap = (notif) => {
    if (!notif.is_read) handleMarkRead(notif.id);
    if (notif.item_id) navigate(`/item/${notif.item_id}`);
  };

  // ── Filter logic ──────────────────────────────────────────────────
  const getFiltered = () => {
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.is_read);
      case 'new_item': return notifications.filter(n => ['new_item', 'item_found', 'item_returned'].includes(n.notification_type));
      case 'claimed': return notifications.filter(n => ['item_claimed', 'claim_accepted', 'claim_rejected'].includes(n.notification_type));
      case 'security': return notifications.filter(n => ['password_changed', 'account', 'system'].includes(n.notification_type));
      default: return notifications;
    }
  };

  const displayed = getFiltered();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Time formatter ────────────────────────────────────────────────
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.default;

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: headerBg, padding: '20px 16px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex' }}><Bell size={26} /></span>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Notifications</h1>
              {unreadCount > 0 && (
                <div style={{ background: '#ef4444', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                  {unreadCount}
                </div>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8 }}>Tap any to see item details</p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={14} /> All read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={handleClearAll} disabled={clearing}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs — no Messages tab */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTER_TABS.map(tab => {
            const active = filter === tab.id;
            return (
              <button key={tab.id} onClick={() => setFilter(tab.id)}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', background: active ? '#fff' : 'rgba(255,255,255,0.2)', color: active ? '#7c3aed' : '#fff', fontWeight: active ? 700 : 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                {tab.icon && <span style={{ display: 'flex' }}>{tab.icon}</span>}
                {tab.label}
                {tab.id === 'all' && notifications.length > 0 && (
                  <span style={{ background: active ? '#7c3aed' : 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 11 }}>
                    {notifications.length}
                  </span>
                )}
                {tab.id === 'unread' && unreadCount > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 11 }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: muted }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><RefreshCw size={36} className="animate-spin" /></div>
            <p>Loading notifications...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 70 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🔕</div>
            <p style={{ color: text, fontWeight: 700, fontSize: 18, margin: '0 0 6px' }}>
              {filter === 'unread' ? 'All caught up!' : 'No notifications'}
            </p>
            <p style={{ color: muted, fontSize: 14 }}>
              {filter === 'unread' ? "You've read everything." : "You'll be notified when something happens."}
            </p>
          </div>
        ) : (
          displayed.map(notif => {
            const cfg = getTypeConfig(notif.notification_type);
            const unread = !notif.is_read;
            return (
              <div key={notif.id} onClick={() => handleTap(notif)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 16px', cursor: 'pointer',
                  background: unread ? (dm ? '#1e1e1e' : '#f0f4ff') : card,
                  borderBottom: `1px solid ${border}`,
                  borderLeft: unread ? `4px solid ${cfg.color}` : '4px solid transparent',
                  transition: 'background 0.15s',
                }}>

                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: dm ? `${cfg.color}25` : cfg.bg, color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${dm ? cfg.color + '40' : cfg.color + '30'}`,
                }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: text, fontWeight: unread ? 600 : 400, flex: 1 }}>
                      {notif.message}
                    </p>
                    <button onClick={(e) => handleDelete(notif.id, e)}
                      style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', display: 'flex', flexShrink: 0, padding: 4 }}>
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                    <span style={{ fontSize: 11, background: dm ? `${cfg.color}25` : cfg.bg, color: cfg.color, padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 11, color: muted }}>{formatTime(notif.created_at)}</span>
                    {unread && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    )}
                  </div>

                  {notif.item_id && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#3b82f6', fontWeight: 500 }}>
                      Tap to view item →
                    </p>
                  )}
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

export default Notifications;