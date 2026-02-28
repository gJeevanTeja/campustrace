import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import ItemCard from '../components/ItemCard';

import { useNotifications } from '../context/NotificationContext';

const CATEGORIES = [ 
  { id: 'electronics', label: 'Electronics', icon: '🖥️' },
  { id: 'keys',        label: 'Keys',        icon: '🔑' },
  { id: 'wallet',      label: 'Wallets',     icon: '👛' },
  { id: 'books',       label: 'Books',       icon: '📚' },
  { id: 'clothing',    label: 'Clothing',    icon: '👕' },
  { id: 'other',       label: 'Other',       icon: '📦' },
];

const Home = ({ darkMode, setDarkMode }) => {
  const [recent,   setRecent]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const { unreadCount } = useNotifications();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const bg     = darkMode ? '#0f172a' : '#f8fafc';
  const card   = darkMode ? '#1e293b' : '#fff';
  const text   = darkMode ? '#e2e8f0' : '#1e293b';
  const muted  = darkMode ? '#94a3b8' : '#64748b';
  const border = darkMode ? '#334155' : '#e2e8f0';

  useEffect(() => {
    itemsAPI.getRecent()
      .then(({ data }) => setRecent(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/browse?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, paddingBottom: 90 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        padding: '24px 16px 32px',
        color: '#fff',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
              📍 CampusTrace
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>
              Hello, {user?.name?.split(' ')[0] || 'there'} 👋
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Notification bell */}
            <button
              onClick={() => navigate('/notifications')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: 12,
                padding: '8px 10px', cursor: 'pointer',
                color: '#fff', fontSize: 18, position: 'relative'
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', minWidth: 16, height: 16,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {/* Dark mode toggle */}
            <button
              onClick={() => {
                setDarkMode(!darkMode);
                localStorage.setItem('darkMode', !darkMode);
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: 12,
                padding: '8px 10px', cursor: 'pointer',
                color: '#fff', fontSize: 18
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch}>
          <div style={{
            background: '#fff', borderRadius: 14,
            display: 'flex', alignItems: 'center',
            padding: '4px 4px 4px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }}>
            <span style={{ fontSize: 18, marginRight: 8 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search lost or found items..."
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 14, color: '#1e293b', background: 'transparent'
              }}
            />
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 18px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600
              }}
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => navigate('/report?type=lost')}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              color: '#fff', border: 'none', borderRadius: 16,
              padding: '18px', cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 4px 16px rgba(239,68,68,0.3)'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>😔</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Lost Something?</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>Report a lost item</div>
          </button>
          <button
            onClick={() => navigate('/report?type=found')}
            style={{
              background: 'linear-gradient(135deg, #16a34a, #059669)',
              color: '#fff', border: 'none', borderRadius: 16,
              padding: '18px', cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 4px 16px rgba(22,163,74,0.3)'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Found Something?</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>Report a found item</div>
          </button>
        </div>

        {/* Categories */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Browse by Category</h3>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/browse?category=${cat.id}`)}
                style={{
                  background: card, border: `1px solid ${border}`,
                  borderRadius: 12, padding: '10px 14px',
                  cursor: 'pointer', color: text,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4,
                  minWidth: 72, flexShrink: 0,
                  fontSize: 12, fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Items */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Recent Items</h3>
            <button
              onClick={() => navigate('/browse')}
              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: muted }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              Loading items...
            </div>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: muted }}>
              <div style={{ fontSize: 48 }}>📭</div>
              <p style={{ marginTop: 8 }}>No items yet. Be the first to report!</p>
            </div>
          ) : (
            recent.slice(0, 6).map(item => (
              <ItemCard key={item.id} item={item} darkMode={darkMode} />
            ))
          )}
        </div>
      </div>

      <BottomNav darkMode={darkMode} />
    </div>
  );
};

export default Home;