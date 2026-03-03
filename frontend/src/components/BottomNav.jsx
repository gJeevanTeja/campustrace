import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

const BottomNav = ({ darkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, unreadChatCount } = useNotifications();
  const dm = darkMode;

  const { user } = useAuth();
  const tabs = [
    { path: '/', icon: <HomeRoundedIcon sx={{ fontSize: 26 }} />, label: 'Home' },
    { path: '/browse', icon: <SearchRoundedIcon sx={{ fontSize: 26 }} />, label: 'Browse' },
    { path: '/report', icon: <AddCircleRoundedIcon sx={{ fontSize: 26 }} />, label: 'Report', special: true },
    { path: '/chat', icon: <ChatBubbleRoundedIcon sx={{ fontSize: 26 }} />, label: 'Chat' },
    { path: '/profile', icon: <PersonRoundedIcon sx={{ fontSize: 26 }} />, label: 'Profile' }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {showAddMenu && (
        <div
          onClick={() => setShowAddMenu(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 90,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* Popup Menu */}
      <div style={{
        position: 'fixed', bottom: showAddMenu ? 74 : -250, left: '50%', transform: 'translateX(-50%)',
        width: '90%', maxWidth: 360, background: dm ? '#1e1e1e' : '#fff',
        borderRadius: 20, padding: 20, zIndex: 91,
        transition: 'bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', gap: 12,
        visibility: showAddMenu ? 'visible' : 'hidden',
      }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 16, textAlign: 'center', color: dm ? '#fff' : '#000' }}>Choose Report Type</h3>

        <button
          onClick={() => { setShowAddMenu(false); navigate('/report?type=lost'); }}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '16px', cursor: 'pointer', textAlign: 'center',
            fontWeight: 700, fontSize: 15,
            boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
          }}
        >
          Lost Something
        </button>

        <button
          onClick={() => { setShowAddMenu(false); navigate('/report?type=found'); }}
          style={{
            background: 'linear-gradient(135deg, #16a34a, #059669)',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '16px', cursor: 'pointer', textAlign: 'center',
            fontWeight: 700, fontSize: 15,
            boxShadow: '0 4px 12px rgba(22,163,74,0.3)'
          }}
        >
          Found Something
        </button>
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: dm ? '#1e1e1e' : '#ffffff',
        borderTop: `1px solid ${dm ? '#333333' : '#e2e8f0'}`,
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
                onClick={() => setShowAddMenu(!showAddMenu)}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
                  transform: showAddMenu ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                  transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
              >
                {tab.icon}
              </button>
            );
          }
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 12px', minWidth: 56,
                position: 'relative'
              }}
            >
              <div style={{
                position: 'relative',
                color: active ? '#3b82f6' : (dm ? '#94a3b8' : '#9ca3af')
              }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
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

              </div>

              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? '#3b82f6' : (dm ? '#94a3b8' : '#9ca3af')
              }}>
                {tab.label}
              </span>
              {active && (
                <div style={{
                  position: 'absolute', bottom: -2, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 16, height: 3, borderRadius: 2,
                  background: '#3b82f6'
                }} />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default BottomNav;
