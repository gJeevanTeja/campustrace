import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, MessageSquare, Package, ChevronRight, Filter, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatSkeleton } from '../components/ui/SkeletonLoaders';

const Chat = ({ darkMode: dm }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      setTimeout(() => setLoading(false), 500);
    }
  };

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

  const filteredRooms = rooms.filter(room => 
    getOtherUser(room).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.item?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`space-y-8 min-h-screen pb-32 ${dm ? 'dark' : ''}`}>
      {/* Header Section */}
      <section className="glass-effect dark:bg-slate-900/60 rounded-3xl p-8 border border-white/40 dark:border-slate-800 shadow-xl overflow-hidden relative bg-primary-gradient text-white transition-all duration-300">
        <div className="absolute top-0 right-0 p-8 text-white/10 -mr-8 -mt-8 rotate-12 pointer-events-none">
            <MessageSquare size={120} />
        </div>
        
        <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center text-white">
                <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase">Messages</h2>
                    <p className="text-white/70 text-sm font-medium">Continue your conversations about items.</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                    <MessageSquare size={24} />
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts or items..."
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-white/20 transition-all font-medium placeholder:text-white/40 shadow-inner text-white"
                />
            </div>
        </div>
      </section>

      {error && (
        <div className="bg-danger/10 text-danger p-4 rounded-2xl border border-danger/20 flex items-center gap-3 font-bold text-sm">
           <AlertCircle size={18} />
           {error}
        </div>
      )}

      {/* Chat List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 text-sm text-text-secondary dark:text-slate-400 transition-colors">
            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                <Filter size={12} className="text-primary" />
                Recent Conversations
            </div>
            <span className="font-bold">{filteredRooms.length} chats</span>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border dark:border-slate-800 shadow-sm transition-colors">
            <ChatSkeleton />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800 text-center transition-colors">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-950 rounded-[30px] flex items-center justify-center mb-6 text-3xl transition-colors">
                💬
            </div>
            <h3 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-2 transition-colors">
                {searchQuery ? 'No results found' : 'No messages yet'}
            </h3>
            <p className="text-text-secondary dark:text-slate-400 text-sm max-w-xs transition-colors">
                {searchQuery ? 'Try a different search term or clear the filter.' : "Start a conversation from any item's detail page to begin."}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border dark:border-slate-800 overflow-hidden shadow-sm divide-y divide-gray-50 dark:divide-slate-800 transition-colors">
            {filteredRooms.map((room, idx) => {
              const name = getOtherUser(room);
              const hasUnread = room.unread_count > 0;
              return (
                <motion.div 
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/chat/${room.id}`)}
                  className={`group flex items-center gap-4 p-5 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 relative ${hasUnread ? 'bg-primary/5 dark:bg-primary/20' : ''}`}
                >
                  {hasUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-primary-gradient flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                      {getInitial(room)}
                    </div>
                    {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                            {room.unread_count}
                        </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`text-base font-black truncate ${hasUnread ? 'text-text-primary dark:text-slate-100' : 'text-text-primary/80 dark:text-slate-300'} group-hover:text-primary transition-colors`}>
                        {name}
                      </h4>
                      <span className={`text-[10px] font-bold ${hasUnread ? 'text-primary' : 'text-text-secondary'}`}>
                        {formatTime(room.last_message_time || room.updated_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <p className={`text-sm truncate ${hasUnread ? 'font-bold text-text-primary dark:text-slate-100' : 'text-text-secondary dark:text-slate-400'}`}>
                        {room.last_message || `RE: ${room.item?.title || room.item_title || 'Item'}`}
                      </p>
                      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Package size={12} className="text-secondary" />
                      <span className="text-[10px] font-black uppercase tracking-tighter truncate text-secondary">
                        {room.item?.title || room.item_title}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;