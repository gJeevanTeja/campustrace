import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
import { 
  Bell, 
  Package, 
  CheckCircle, 
  RefreshCcw, 
  Lock, 
  User, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  Clock,
  Inbox,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_CONFIG = {
  new_item:         { icon: Package, label: 'New Item',      color: 'text-primary', bg: 'bg-primary/10' },
  item_claimed:     { icon: CheckCircle, label: 'Item Claimed',   color: 'text-success', bg: 'bg-success/10' },
  item_found:       { icon: Sparkles, label: 'Item Found',     color: 'text-success', bg: 'bg-success/10' },
  item_returned:    { icon: RefreshCcw, label: 'Returned',       color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  password_changed: { icon: Lock, label: 'Security',       color: 'text-amber-500', bg: 'bg-amber-500/10' },
  system:           { icon: Bell, label: 'System',         color: 'text-slate-500', bg: 'bg-slate-500/10' },
  account:          { icon: User, label: 'Account',        color: 'text-rose-500', bg: 'bg-rose-500/10' },
  default:          { icon: Bell, label: 'Event',         color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

const FILTER_TABS = [
  { id: 'all',       label: 'All Activity' },
  { id: 'unread',    label: 'Unread' },
  { id: 'new_item',  label: 'Items' },
  { id: 'claimed',   label: 'Claims' },
  { id: 'security',  label: 'Security' },
];

const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsAPI.getAll();
      const list = Array.isArray(data) ? data : (data.results || []);
      const filtered = list.filter(n => !['new_message', 'message', 'chat'].includes(n.notification_type));
      setNotifications(filtered);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.deleteOne(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear activity?')) return;
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
    } catch {}
  };

  const handleTap = (notif) => {
    if (!notif.is_read) handleMarkRead(notif.id);
    
    const itemId = notif.item_details?.id || notif.item || notif.item_id;
    
    if (['password_changed', 'account', 'system', 'security'].includes(notif.notification_type)) {
      navigate('/profile');
    } else if (['new_message', 'chat', 'chat_message'].includes(notif.notification_type)) {
      navigate(notif.room_id ? `/chat/${notif.room_id}` : '/chat');
    } else if (itemId) {
      navigate(`/item/${itemId}`);
    } else {
      // Fallback for notifications without a specific navigation target
      console.log('Notification tapped, no navigation target found:', notif);
    }
  };

  const getFiltered = () => {
    switch (filter) {
      case 'unread':   return notifications.filter(n => !n.is_read);
      case 'new_item': return notifications.filter(n => ['new_item','item_found','item_returned'].includes(n.notification_type));
      case 'claimed':  return notifications.filter(n => ['item_claimed','claim_accepted','claim_rejected'].includes(n.notification_type));
      case 'security': return notifications.filter(n => ['password_changed','account','system'].includes(n.notification_type));
      default:         return notifications;
    }
  };

  const displayed = getFiltered();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="font-black text-text-secondary uppercase tracking-widest text-xs">Syncing Notifications...</p>
     </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
       {/* Header */}
       <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8">
          <div className="space-y-1">
             <h1 className="text-4xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter flex items-center gap-3">
                Inbox 
                {unreadCount > 0 && <span className="bg-primary text-white text-[10px] h-6 w-6 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-xl">{unreadCount}</span>}
             </h1>
             <p className="text-text-secondary dark:text-slate-400 font-medium uppercase text-[10px] tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-success" />
                Real-time security alerts & updates
             </p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleMarkAllRead} className="px-5 py-3 bg-white dark:bg-card border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                Mark all read
             </button>
             <button onClick={handleClearAll} className="p-3 bg-white dark:bg-card border border-slate-100 dark:border-slate-800 rounded-2xl text-danger hover:bg-danger/10 transition-all shadow-sm">
                <Trash2 size={20} />
             </button>
          </div>
       </header>

       {/* Tabs */}
       <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
           {FILTER_TABS.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setFilter(tab.id)}
               className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white dark:bg-card text-text-secondary dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
             >
                {tab.label}
             </button>
           ))}
       </div>

       {/* Notifications List */}
       <div className="space-y-4">
          <AnimatePresence initial={false}>
             {displayed.length === 0 ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-6">
                   <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-[32px] flex items-center justify-center mx-auto text-slate-300 dark:text-slate-700">
                      <Inbox size={48} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">Pure Silence</h3>
                      <p className="text-sm font-medium text-text-secondary dark:text-slate-400">Your inbox is empty. We'll alert you of any activity.</p>
                   </div>
               </motion.div>
            ) : (
              displayed.map((notif, idx) => {
                const cfg = TYPE_CONFIG[notif.notification_type] || TYPE_CONFIG.default;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleTap(notif)}
                    className={`relative p-6 rounded-[32px] border transition-all cursor-pointer group hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] ${notif.is_read ? 'bg-white dark:bg-card border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-900/50 border-primary/20 dark:border-primary/40 shadow-xl shadow-primary/5 dark:shadow-primary/20'}`}
                  >
                     <div className="flex gap-6 items-start">
                        <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl shadow-sm ${cfg.bg} ${cfg.color} dark:bg-opacity-20`}>
                           <cfg.icon size={28} />
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-black uppercase tracking-[2px] ${cfg.color} opacity-80`}>{cfg.label}</span>
                              <span className="text-[10px] font-bold text-text-secondary dark:text-slate-500 flex items-center gap-1">
                                 <Clock size={10} /> {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                           <h4 className={`text-base font-bold leading-relaxed text-text-primary dark:text-slate-100 ${!notif.is_read ? 'pr-8' : ''}`}>
                              {notif.message}
                           </h4>
                           <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-2">
                                 {notif.is_read ? (
                                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase">Read</span>
                                 ) : (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase">
                                       <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                       New Activity
                                    </span>
                                 )}
                              </div>
                              <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={(e) => handleDelete(notif.id, e)} className="p-2 text-text-secondary dark:text-slate-500 hover:text-danger transition-colors">
                                    <Trash2 size={16} />
                                 </button>
                                 <ChevronRight size={16} className="text-primary" />
                              </div>
                           </div>
                        </div>
                     </div>
                     {!notif.is_read && (
                        <div className="absolute top-6 right-6 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-900 shadow-lg" />
                     )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
       </div>
    </div>
  );
};

export default Notifications; 
