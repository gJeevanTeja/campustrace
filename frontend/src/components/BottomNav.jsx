import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, MessageCircle, User, BarChart2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const BottomNav = ({ darkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, unreadChatCount } = useNotifications();
  const dm = darkMode;

  const { user } = useAuth();
  const tabs = [
    { path: '/', icon: <Home size={22} />, label: 'Home' },
    { path: '/browse', icon: <Search size={22} />, label: 'Browse' },
    { path: '/report', icon: <Plus size={24} />, label: 'Report', special: true },
    { path: '/chat', icon: <MessageCircle size={22} />, label: 'Chat' },
    { path: '/profile', icon: <User size={22} />, label: 'Profile' },
    {
      path: (user?.role === 'student' || !user?.role) ? '/dashboard' : '/admin',
      icon: <BarChart2 size={22} />,
      label: 'Stats'
    }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: dm ? '#1e1e1e' : '#ffffff',
      borderTop: `1px solid ${dm ? '#2d2d2d' : '#e2e8f0'}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom, 4px)',
      height: 54,
      zIndex: 100,
      boxShadow: '0 -1px 8px rgba(0,0,0,0.07)',
    }}>
      {tabs.map(tab => {
        const active = isActive(tab.path);
        if (tab.special) {
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
              }}
            >
              <Plus size={24} color="#fff" />
            </button>
          );
        }
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 10px', minWidth: 48,
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#3b82f6' : (dm ? '#64748b' : '#94a3b8'), marginBottom: 2 }}>
                {tab.icon}
              </span>

              {/* Overlays for Badges */}
              {tab.label === 'Chat' && unreadChatCount > 0 && (
                <div style={{
                  position: 'absolute', top: -5, right: -8,
                  background: '#ef4444', color: 'white',
                  fontSize: '10px', fontWeight: 'bold',
                  minWidth: '16px', height: '16px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', border: `2px solid ${dm ? '#1e1e1e' : '#ffffff'}`
                }}>
                  {unreadChatCount}
                </div>
              )}

              {tab.label === 'Stats' && unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: -5, right: -8,
                  background: '#ef4444', color: 'white',
                  fontSize: '10px', fontWeight: 'bold',
                  minWidth: '16px', height: '16px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', border: `2px solid ${dm ? '#1e1e1e' : '#ffffff'}`
                }}>
                  {unreadCount}
                </div>
              )}
            </div>

            <span style={{
              fontSize: 9, fontWeight: active ? 700 : 500,
              color: active ? '#3b82f6' : (dm ? '#64748b' : '#94a3b8'),
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
            {active && (
              <div style={{
                position: 'absolute', bottom: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 16, height: 2, borderRadius: 2,
                background: '#3b82f6',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;