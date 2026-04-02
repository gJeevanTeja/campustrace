import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI, itemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  MoreVertical, 
  Send, 
  Plus, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileText, 
  Smile, 
  ShieldCheck,
  Bell,
  BellOff,
  UserX,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = {
  modern: { name: 'Modern Indigo', sentBg: 'bg-primary', sentText: 'text-white', receivedBg: 'bg-white dark:bg-slate-800', receivedText: 'text-text-primary dark:text-slate-100', header: 'bg-primary' },
  glass: { name: 'Glassmorphism', sentBg: 'bg-white/20 backdrop-blur-md border border-white/30', sentText: 'text-text-primary dark:text-slate-100', receivedBg: 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-slate-700', receivedText: 'text-text-primary dark:text-slate-100', header: 'bg-white/70 dark:bg-card/70 backdrop-blur-lg' },
  dark: { name: 'Midnight', sentBg: 'bg-slate-700 dark:bg-primary', sentText: 'text-white', receivedBg: 'bg-slate-800 dark:bg-slate-800', receivedText: 'text-slate-200 dark:text-slate-100', header: 'bg-slate-900 dark:bg-slate-900' },
};

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

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const myId = parseInt(user?.id, 10);

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
  const [isBlocked] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const themeKey = `chat_theme_${roomId}`;
  const [themeId] = useState(() => localStorage.getItem(themeKey) || 'modern');
  const theme = THEMES[themeId] || THEMES.modern;

  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const isAtBottom = useRef(true);
  const isMutedRef = useRef(isMuted);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

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

  const connectWS = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    const token = localStorage.getItem('access_token');
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${import.meta.env.VITE_API_IP || window.location.hostname}:8000`;
    const ws = new WebSocket(`${wsUrl}/ws/chat/${roomId}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('open');
      clearInterval(pollRef.current);
      pollRef.current = null;
    };

    ws.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
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

  useEffect(() => {
    loadMessages();
    connectWS();
    return () => { wsRef.current?.close(); clearInterval(pollRef.current); };
  }, [loadMessages, connectWS]);

  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottom.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 100;
  };

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
        setMessages(prev => prev.filter(m => !m.temp));
      }
    }
    setSending(false);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttachMenu(false);
    setSending(true);
    isAtBottom.current = true;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await chatAPI.uploadMedia(roomId, formData);
      setMessages(prev => [...prev, normalizeMessage({ ...data, is_mine: true }, myId)]);
    } catch {
      alert('Failed to upload file');
    }
    setSending(false);
    e.target.value = '';
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear all messages?')) return;
    try {
      await chatAPI.clearChat(roomId);
      setMessages([]);
    } catch { alert('Failed to clear chat'); }
  };

  const handleMuteToggle = async () => {
    try {
      if (isMuted) {
        await chatAPI.unmuteRoom(roomId);
        setIsMuted(false);
      } else {
        await chatAPI.muteRoom(roomId);
        setIsMuted(true);
      }
    } catch { alert('Failed to update mute setting'); }
  };

  const handleApproveClaim = async () => {
    if (!roomInfo?.claim_session?.id || approving) return;
    if (!window.confirm('Approve this verification?')) return;
    setApproving(true);
    try {
      await itemsAPI.approveClaim(roomInfo.claim_session.id);
      loadMessages();
      setShowSuccess(true);
    } catch (err) { alert('Failed to approve verification'); }
    finally { setApproving(false); }
  };

  const otherName = roomInfo?.other_participant?.name || 'User';
  const itemTitle = roomInfo?.item?.title || '';

  const grouped = messages.reduce((acc, msg, i) => {
    const dk = new Date(msg.created_at).toDateString();
    const prev = messages[i - 1];
    if (!prev || new Date(prev.created_at).toDateString() !== dk)
      acc.push({ type: 'sep', date: msg.created_at, key: `sep-${i}` });
    acc.push({ type: 'msg', ...msg, key: msg.id || `tmp-${i}` });
    return acc;
  }, []);

  if (loading) return (
     <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-slate-50 dark:bg-[#0b0f1a] transition-colors">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-text-secondary dark:text-slate-400 font-bold transition-colors">Connecting to secure chat...</p>
     </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0b0f1a] relative overflow-hidden font-sans transition-colors duration-300">
      {/* Header */}
      <header className={`relative z-50 px-4 py-3 flex items-center justify-between shadow-lg backdrop-blur-md ${theme.header} border-b border-white/10 text-white`}>
        <div className="flex items-center gap-3">
            <button onClick={() => navigate('/chat')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <ChevronLeft size={24} />
            </button>
            <div className="relative group cursor-pointer" onClick={() => navigate(`/user/${roomInfo?.other_participant?.id}`)}>
                <div className="w-10 h-10 bg-white/20 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center font-black text-lg border border-white/30 dark:border-slate-700 group-hover:scale-105 transition-transform">
                   {otherName[0]?.toUpperCase()}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-primary dark:border-slate-800 ${wsStatus === 'open' ? 'bg-success' : 'bg-slate-400'}`} />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm font-black truncate max-w-[120px] sm:max-w-sm">{otherName}</h3>
                <p className="text-[10px] font-bold opacity-70 truncate uppercase tracking-widest">
                   {itemTitle ? `RE: ${itemTitle}` : 'General Chat'}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-1">
            <button onClick={handleMuteToggle} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                {isMuted ? <BellOff size={20} className="text-white/60" /> : <Bell size={20} />}
            </button>
            <div className="relative">
                <button onClick={() => setShowDotMenu(!showDotMenu)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <MoreVertical size={20} />
                </button>
                <AnimatePresence>
                    {showDotMenu && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-56 bg-white dark:bg-card rounded-2xl shadow-2xl border border-border dark:border-slate-800 overflow-hidden text-text-primary dark:text-slate-100 py-2"
                        >
                           <button onClick={() => navigate(`/user/${roomInfo?.other_participant?.id}`)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold">
                               <UserX size={18} className="text-slate-400" /> View Profile
                           </button>
                           <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                           <button onClick={handleClearChat} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-danger/5 dark:hover:bg-danger/10 text-sm font-bold text-danger">
                               <Trash2 size={18} /> Clear Chat
                           </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </header>

      {/* AI Verification Banner */}
      {roomInfo?.claim_session?.status === 'ai_verified' && roomInfo?.item?.owner_id === myId && (
        <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 flex items-center justify-between gap-4 shadow-lg relative z-40">
           <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-xl">
                 <ShieldCheck size={20} />
              </div>
              <div>
                 <p className="text-xs font-black uppercase tracking-tighter">AI Verification Passed</p>
                 <p className="text-[10px] font-bold opacity-80">Claimant matches item profile.</p>
              </div>
           </div>
           <button onClick={handleApproveClaim} disabled={approving} className="bg-white text-orange-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase shadow-sm active:scale-95 transition-all">
              {approving ? '...' : 'Approve'}
           </button>
        </motion.div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-2 no-scrollbar"
      >
        {grouped.map((m, i) => {
          if (m.type === 'sep') {
            return (
              <div key={m.key} className="flex justify-center my-6">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800 transition-colors">
                    {new Date(m.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                 </span>
              </div>
            );
          }
          
          const isMine = m.is_mine;
          const nextSame = messages[i+1]?.sender_id === m.sender_id;
          
          return (
            <motion.div 
              key={m.key}
              initial={{ opacity: 0, x: isMine ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}
            >
              <div className={`max-w-[85%] sm:max-w-[70%] space-y-1`}>
                <div className={`
                    px-4 py-2.5 rounded-3xl shadow-sm text-sm font-medium leading-relaxed
                    ${isMine ? `${theme.sentBg} ${theme.sentText} rounded-tr-none shadow-primary/10` : `${theme.receivedBg} ${theme.receivedText} rounded-tl-none shadow-black/5 border border-slate-100 dark:border-slate-800/50`}
                    ${m.temp ? 'opacity-50' : ''}
                `}>
                   {m.message_type === 'text' && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                   {m.message_type === 'image' && (
                     <img src={m.media_url} className="rounded-2xl max-h-60 w-full object-cover cursor-pointer" alt="media" onClick={() => window.open(m.media_url)} />
                   )}
                   {m.message_type === 'video' && (
                     <video controls className="rounded-2xl max-h-60 w-full bg-black"><source src={m.media_url} /></video>
                   )}
                   {m.message_type === 'file' && (
                     <a href={m.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                        <FileText size={18} /> {m.text || 'Document'}
                     </a>
                   )}
                </div>
                {!nextSame && (
                   <p className={`text-[9px] font-bold text-slate-400 flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMine && (m.temp ? '⏳' : <CheckCircle2 size={10} className="text-primary" />)}
                   </p>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-card border-t border-slate-100 dark:border-slate-800 p-4 pb-12 sm:pb-4 relative z-50 transition-colors duration-300">
         <div className="flex items-end gap-3 max-w-5xl mx-auto">
            <div className="relative">
                <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Plus size={20} />
                </button>
                <AnimatePresence>
                    {showAttachMenu && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="absolute bottom-full left-0 mb-4 bg-white dark:bg-card rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-3 grid grid-cols-1 gap-1 w-48">
                            <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><ImageIcon size={18} /></div>
                                <span className="text-xs font-black uppercase text-slate-600">Photo</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer">
                                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><VideoIcon size={18} /></div>
                                <span className="text-xs font-black uppercase text-slate-600">Video</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer">
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl"><FileText size={18} /></div>
                                <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">File</span>
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-3xl flex items-end p-2 border border-slate-200 dark:border-slate-700 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                <textarea 
                  ref={inputRef} 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  rows={1}
                  placeholder="Type a message..."
                  className="w-full bg-transparent border-none outline-none px-3 py-2 text-sm font-medium resize-none max-h-32 text-text-primary dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 text-amber-500 hover:scale-110 transition-transform">
                    <Smile size={22} />
                </button>
            </div>

            <button 
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className={`p-4 rounded-2xl transition-all shadow-lg ${input.trim() ? 'bg-primary text-white shadow-primary/30 active:scale-90' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`}
            >
                <Send size={20} />
            </button>
         </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white dark:bg-card rounded-[40px] p-10 max-w-sm w-full text-center shadow-3xl border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="text-7xl">🎊</div>
              <h2 className="text-2xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">Verified!</h2>
              <p className="text-text-secondary dark:text-slate-400 text-sm font-medium">Claim approved successfully. Points have been updated!</p>
              <button onClick={() => setShowSuccess(false)} className="w-full bg-primary text-white py-4 rounded-2xl font-black active:scale-95 transition-all">COOL</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatRoom;