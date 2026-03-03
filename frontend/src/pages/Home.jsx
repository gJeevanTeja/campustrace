import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import ItemCard from '../components/ItemCard';
import { Shield, Bell, Sun, Moon, MapPin, Search, AlertCircle, CheckCircle, Inbox, Loader2 } from 'lucide-react';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BadgeIcon from '@mui/icons-material/Badge';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

import { useNotifications } from '../context/NotificationContext';

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: <SmartphoneIcon sx={{ fontSize: 26, color: '#3b82f6' }} /> },
  { id: 'keys', label: 'Keys', icon: <VpnKeyIcon sx={{ fontSize: 26, color: '#f59e0b' }} /> },
  { id: 'idcards', label: 'ID Cards', icon: <BadgeIcon sx={{ fontSize: 26, color: '#14b8a6' }} /> },
  { id: 'wallet', label: 'Wallets', icon: <AccountBalanceWalletIcon sx={{ fontSize: 26, color: '#10b981' }} /> },
  { id: 'books', label: 'Books', icon: <MenuBookIcon sx={{ fontSize: 26, color: '#8b5cf6' }} /> },
  { id: 'other', label: 'Other', icon: <MoreHorizIcon sx={{ fontSize: 26, color: '#64748b' }} /> },
];

const Home = ({ darkMode, setDarkMode }) => {
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { user } = useAuth();

  const bg = darkMode ? '#121212' : '#f8fafc';
  const card = darkMode ? '#1e1e1e' : '#fff';
  const text = darkMode ? '#e2e8f0' : '#1e1e1e';
  const muted = darkMode ? '#94a3b8' : '#64748b';
  const border = darkMode ? '#333333' : '#e2e8f0';

  useEffect(() => {
    itemsAPI.getRecent()
      .then(({ data }) => setRecent(Array.isArray(data) ? data : data.results || []))
      .catch(() => { })
      .finally(() => setLoading(false));
    // Check for login success flag
    const showToast = localStorage.getItem('login_success');
    if (showToast === 'true') {
      setShowWelcomeToast(true);
      localStorage.removeItem('login_success');
      setTimeout(() => setShowWelcomeToast(false), 3000); // hide after 3 seconds
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/browse?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, paddingBottom: 90 }}>

      {/* Header */}
      <div style={{
        background: darkMode ? '#1e1e1e' : '#ffffff',
        borderBottom: `1px solid ${border}`,
        color: text,
      }}>
        <div style={{ padding: '24px 20px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%' }}>
            {/* Left Logo */}
            <div>
              <h1 style={{
                margin: 0, fontSize: 'clamp(20px, 6vw, 24px)', fontWeight: 800, letterSpacing: -0.5,
                display: 'flex', alignItems: 'center', gap: 6, color: darkMode ? '#ffffff' : '#2563eb',
                whiteSpace: 'nowrap'
              }}>
                <MapPin size={26} color={darkMode ? "#3b82f6" : "#2563eb"} strokeWidth={2.5} style={{ flexShrink: 0 }} /> CampusTrace
              </h1>
            </div>

            {/* Right Icons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Notification bell */}
              <button
                onClick={() => navigate('/notifications')}
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  border: `1px solid ${darkMode ? '#333' : '#e2e8f0'}`, borderRadius: 12,
                  padding: '8px 10px', cursor: 'pointer',
                  color: text, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    background: '#ef4444', color: '#fff',
                    borderRadius: '50%', minWidth: 16, height: 16,
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${darkMode ? '#1e1e1e' : '#ffffff'}`
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
                  background: darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  border: `1px solid ${darkMode ? '#333' : '#e2e8f0'}`, borderRadius: 12,
                  padding: '8px 10px', cursor: 'pointer',
                  color: text, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch}>
            <div style={{
              background: darkMode ? '#121212' : '#f8fafc',
              border: `1px solid ${border}`, borderRadius: 14,
              display: 'flex', alignItems: 'center',
              padding: '6px 6px 6px 16px',
            }}>
              <Search size={18} color="#94a3b8" style={{ marginRight: 8, flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 14, color: text, background: 'transparent',
                  minWidth: 0, textOverflow: 'ellipsis'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 18px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, flexShrink: 0
                }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Admin Quick Access Banner */}
          {(user?.role === 'super_admin' || user?.role === 'college_admin' || user?.role === 'moderator') && (
            <div
              onClick={() => navigate('/admin')}
              style={{
                marginTop: 18, background: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.2)' : '#bfdbfe'}`,
                borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', color: darkMode ? '#93c5fd' : '#1d4ed8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe', color: '#2563eb', padding: 6, borderRadius: 8, display: 'flex' }}>
                  <Shield size={16} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Go to Admin Panel</span>
              </div>
              <span style={{ fontSize: 18 }}>→</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Removed */}
      <div style={{ padding: '24px 20px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Categories */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Browse by Category</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/browse?category=${cat.id}`)}
                style={{
                  background: card, border: `1px solid ${border}`,
                  borderRadius: 16, padding: '14px 6px',
                  cursor: 'pointer', color: text,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 8,
                  fontSize: 12, fontWeight: 600,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cat.icon}</div>
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

          {/* Tabs for Recent Items */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: darkMode ? '#121212' : '#f1f5f9', padding: 4, borderRadius: 10 }}>
            {['all', 'lost', 'found'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, transition: 'all .2s',
                  background: activeTab === tab ? card : 'transparent',
                  color: activeTab === tab ? '#2563eb' : muted,
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,.10)' : 'none',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: muted }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><Loader2 size={32} /></div>
              Loading items...
            </div>
          ) : recent.filter(item => activeTab === 'all' || item.type === activeTab).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: muted }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Inbox size={48} strokeWidth={1.5} /></div>
              <p style={{ margin: 0 }}>No {activeTab !== 'all' ? activeTab : ''} items currently found.</p>
            </div>
          ) : (
            recent.filter(item => activeTab === 'all' || item.type === activeTab).slice(0, 6).map(item => (
              <ItemCard key={item.id} item={item} darkMode={darkMode} />
            ))
          )}
        </div>
      </div>

      <BottomNav darkMode={darkMode} />

      {/* Welcome Toast Popup */}
      {showWelcomeToast && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: darkMode ? '#333333' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1e1e1e',
          padding: '12px 24px',
          borderRadius: 30,
          boxShadow: darkMode ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 9999,
          fontSize: 14,
          fontWeight: 600,
          animation: 'slideDown 0.3s ease-out',
        }}>
          <span>👋 Hello, {user?.name?.split(' ')[0] || 'there'}!</span>
        </div>
      )}

      {/* Slide Down Animation */}
      <style>{`
        @keyframes slideDown {
          from { top: -50px; opacity: 0; }
          to { top: 20px; opacity: 1; }
        }
      `}</style>
    </div >
  );
};

export default Home;
