import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

// WhatsApp style popup animation & styles
const styles = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    pointerEvents: 'none',
  },
  toast: {
    pointerEvents: 'auto',
    minWidth: '300px',
    maxWidth: '350px',
    padding: '16px',
    borderRadius: '12px',
    color: '#fff',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    transition: 'opacity 0.3s, transform 0.3s',
  },
  toastRed: { backgroundColor: '#ef4444' },    // LOST
  toastGreen: { backgroundColor: '#10b981' },  // FOUND
  toastBlue: { backgroundColor: '#3b82f6' },   // CHAT
  toastDefault: { backgroundColor: '#64748b' },// GENERAL

  title: {
    margin: 0,
    fontWeight: 'bold',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  message: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    opacity: 0.9,
    lineHeight: 1.4
  },
  icon: {
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.2)',
    padding: '8px',
    borderRadius: '50%'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    marginLeft: 'auto',
    padding: '4px',
    fontSize: '16px'
  }
};

const Toast = ({ popup, removePopup }) => {
  const [isClosing, setIsClosing] = useState(false);

  // Auto dismiss
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => removePopup(popup.id), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [popup.id, removePopup]);

  const handleClose = (e) => {
    e.stopPropagation();
    setIsClosing(true);
    setTimeout(() => removePopup(popup.id), 300);
  };

  const handleClick = () => {
    if (popup.item_id && popup.item_type !== 'chat') {
      window.location.href = `/item/${popup.item_id}`;
    } else if (popup.item_id && popup.item_type === 'chat') {
      window.location.href = `/chat/${popup.item_id}`;
    }
  };

  const isLost = popup.item_type?.toLowerCase() === 'lost';
  const isFound = popup.item_type?.toLowerCase() === 'found';
  const isChat = popup.notification_type === 'chat_message';

  const bgColorStyle = isLost ? styles.toastRed
    : isFound ? styles.toastGreen
      : isChat ? styles.toastBlue
        : styles.toastDefault;

  const iconText = isLost ? '🔍' : isFound ? '🎉' : isChat ? '💬' : '🔔';

  // Custom text per type
  let titleText = 'Notification';
  if (isLost) titleText = 'New Lost Item';
  if (isFound) titleText = 'New Found Item';
  if (isChat) titleText = `Message from ${popup.sender_name || 'Someone'}`;

  return (
    <div
      style={{
        ...styles.toast,
        ...bgColorStyle,
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? 'translateX(100px)' : 'translateX(0)',
      }}
      onClick={handleClick}
    >
      <div style={styles.icon}>{iconText}</div>
      <div style={{ flex: 1 }}>
        <h4 style={styles.title}>{titleText}</h4>
        <p style={styles.message}>{popup.message}</p>
      </div>
      <button style={styles.closeBtn} onClick={handleClose}>×</button>
    </div>
  );
};


export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0); // Add chat unread tracker
  const [popups, setPopups] = useState([]); // Currently active toasts

  const wsRef = useRef(null);
  const audioRef = useRef(null);
  const chatAudioRef = useRef(null); // Separate tracker for chat pings

  // Pre-load notification sound
  useEffect(() => {
    try {
      // Crisp bell sound for item notifications
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audioRef.current.volume = 0.5;

      // Soft 'pop' sound for chat notifications (WhatsApp style)
      chatAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      chatAudioRef.current.volume = 0.6;
    } catch { }
  }, []);

  const playSound = (isChat) => {
    try {
      const activeAudio = isChat ? chatAudioRef.current : audioRef.current;
      if (activeAudio) {
        activeAudio.currentTime = 0;
        activeAudio.play().catch(e => console.log('Audio play blocked:', e));
      }
    } catch { }
  };

  const removePopup = useCallback((id) => {
    setPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationsAPI.getAll();
      const list = Array.isArray(data) ? data : (data.results || []);
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);

      // Fetch initial chat unread count too
      const chatData = await notificationsAPI.getUnreadCount();
      if (chatData?.data?.unread_count !== undefined) {
        setUnreadChatCount(chatData.data.unread_count);
      }
    } catch { }
  }, [user]);

  // Connect to WebSocket for real-time notifications (No Polling)
  const connectWS = useCallback(() => {
    if (!user) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Use environment variable IP or fallback to localhost
    const apiHost = process.env.REACT_APP_API_IP || 'localhost';
    const ws = new WebSocket(`ws://${apiHost}:8000/ws/notifications/?token=${token}`);

    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'send_notification' || data.message) {

          setNotifications(prev => {
            if (prev.find(n => n.id === data.id)) return prev; // prevent duplicate

            // --- Smart Chat Notification Intercept ---
            const isChatMsg = data.notification_type === 'chat_message';
            if (isChatMsg) {
              // Mute if the user is literally looking at that exact chat room
              if (window.location.pathname === `/chat/${data.item_id}`) {
                return prev; // silently swallow without popups or unread clicks
              }
            }

            // Only play sound and show popup if it passed the mute check
            playSound(isChatMsg);

            // Dynamically split badge updates
            if (isChatMsg) {
              setUnreadChatCount(c => c + 1);
            } else {
              setUnreadCount(c => c + 1);
            }

            // Only add to popups if it has a message string
            if (data.message) {
              setPopups(curr => [...curr, data]);
            }

            return [data, ...prev];
          });

          if (window.Notification && Notification.permission === 'granted') {
            new Notification('CampusTrace', { body: data.message, icon: '/favicon.ico' });
          }
        }
      } catch (err) {
        console.error('WS MSG Error:', err);
      }
    };

    ws.onclose = () => {
      // Reconnect after 3s if disconnected
      setTimeout(() => {
        if (user && wsRef.current?.readyState === WebSocket.CLOSED) {
          connectWS();
        }
      }, 3000);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setPopups([]);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    fetchNotifications();
    connectWS();

    // Request browser notification permission
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, fetchNotifications, connectWS]);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { }
  };

  const deleteNotif = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => {
        const notif = prev.find(n => n.id === id);
        if (notif && !notif.is_read) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n.id !== id);
      });
    } catch { }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      unreadChatCount,
      setUnreadChatCount,
      fetchNotifications,
      markRead,
      markAllRead,
      deleteNotif
    }}>
      {children}

      {/* Toast Popups Container */}
      <div style={styles.container}>
        {popups.map(popup => (
          <Toast key={popup.id + '-' + Date.now()} popup={popup} removePopup={removePopup} />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
