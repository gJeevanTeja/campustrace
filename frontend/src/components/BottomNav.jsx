import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { 
    LayoutDashboard, 
    Search, 
    PlusCircle, 
    MessageSquare, 
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { unreadChatCount } = useNotifications();
    
    

    const tabs = [
        { path: '/', icon: LayoutDashboard, label: 'Home' },
        { path: '/browse', icon: Search, label: 'Browse' },
        { path: '/report', icon: PlusCircle, label: 'Report', special: true },
        { path: '/chat', icon: MessageSquare, label: 'Chat', count: unreadChatCount },
        { path: '/profile', icon: User, label: 'Profile' },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] h-16 glass-effect bg-white/80 border border-white/40 rounded-[28px] shadow-2xl z-50 flex items-center justify-around px-3">
            {tabs.map((tab) => {
                const active = isActive(tab.path);
                
                if (tab.special) {
                    return (
                        <motion.button
                            key={tab.path}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(tab.path)}
                            className="w-12 h-12 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-lg shadow-primary/30 -mt-2 transition-all"
                        >
                            <PlusCircle size={24} strokeWidth={3} />
                        </motion.button>
                    );
                }

                return (
                    <button
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        className="relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300"
                    >
                        <AnimatePresence>
                            {active && (
                                <motion.div 
                                    layoutId="bottom-nav-active"
                                    className="absolute inset-x-0 inset-y-0 bg-primary/10 rounded-xl"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </AnimatePresence>
                        
                        <div className="relative">
                            <tab.icon 
                                size={20} 
                                strokeWidth={active ? 2.5 : 2}
                                className={`transition-colors duration-300 ${active ? 'text-primary' : 'text-text-secondary'}`} 
                            />
                            
                            {tab.count > 0 && (
                                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-danger text-white text-[8px] font-black flex items-center justify-center rounded-full ring-2 ring-white">
                                    {tab.count > 9 ? '9+' : tab.count}
                                </span>
                            )}
                        </div>
                        
                        {active && (
                            <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -bottom-1.5 text-[8px] font-black uppercase tracking-tighter text-primary"
                            >
                                {tab.label}
                            </motion.span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;