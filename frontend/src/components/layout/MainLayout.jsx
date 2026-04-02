import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  PlusSquare, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  Building2,
  Users,
  MapPin,
  Layers,
  TrendingUp,
  ShieldAlert,
  Settings,
  CheckSquare,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Browse Items', href: '/browse', icon: Search },
  { name: 'Report Item', href: '/report', icon: PlusSquare },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Stats', href: '/leaderboard', icon: BarChart3 },
];

const adminNavigation = [
  { name: 'Admin Dash', href: '/admin', icon: ShieldCheck, role: 'any' },
  { name: 'Colleges', href: '/admin/colleges', icon: Building2, role: 'super_admin' },
  { name: 'Requests', href: '/admin/requests', icon: ShieldAlert, role: 'super_admin' },
  { name: 'Users', href: '/admin/users', icon: Users, role: 'any' },
  { name: 'Blocks', href: '/admin/blocks', icon: MapPin, role: 'any' },
  { name: 'Categories', href: '/admin/categories', icon: Layers, role: 'any' },
  { name: 'Resolutions', href: '/admin/resolutions', icon: CheckSquare, role: 'college_admin' },
  { name: 'College Info', href: '/admin/college-info', icon: Settings, role: 'college_admin' },
  { name: 'Global Stats', href: '/admin/analytics', icon: TrendingUp, role: 'super_admin' },
];

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'college_admin';
  const isSuperAdmin = user?.role === 'super_admin' || user?.is_superuser;
  const anyAdmin = isAdmin || isSuperAdmin;
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0b0f1a] font-sans transition-colors duration-300">
      {/* Desktop Sidebar (visible for >= 1024px) */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? '80px' : '260px' }}
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 glass-effect dark:bg-card/80 border-r border-border/50 dark:border-slate-800 z-50 overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-extrabold text-2xl bg-primary-gradient bg-clip-text text-transparent"
              >
                UniTrace
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg bg-primary/5 dark:bg-primary/10 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="mb-4">
            {!isSidebarCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-[2px] opacity-70">Menu</p>
            )}
            {mainNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  id={`tour-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 dark:shadow-primary/10' 
                      : 'text-text-secondary dark:text-slate-400 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary-light'}
                  `}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeGlow"
                      className="absolute inset-0 bg-primary/20 blur-md rounded-xl -z-10"
                    />
                  )}
                  <item.icon size={22} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-semibold"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {anyAdmin && (
            <div className="pt-4 border-t border-border/50 dark:border-slate-800">
              {!isSidebarCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-[2px] opacity-70">Admin Panel</p>
              )}
              {adminNavigation.map((item) => {
                const showItem = item.role === 'any' || 
                               (item.role === 'super_admin' && isSuperAdmin) ||
                               (item.role === 'college_admin' && isAdmin);
                
                if (!showItem) return null;

                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 dark:shadow-primary/10' 
                        : 'text-text-secondary dark:text-slate-400 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary-light'}
                    `}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeGlowAdmin"
                        className="absolute inset-0 bg-primary/20 blur-md rounded-xl -z-10"
                      />
                    )}
                    <item.icon size={22} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                    {!isSidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-semibold text-sm"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-4 mt-auto">
          {!isSidebarCollapsed && (
            <div className="glass-card bg-primary/5 dark:bg-primary/10 border-primary/10 dark:border-primary/20 p-4">
              <p className="text-xs font-bold text-primary dark:text-primary-light uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-sm font-medium text-text-primary dark:text-slate-200">System Online</span>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileSidebar}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-card z-[1001] shadow-2xl flex flex-col border-r border-border/50 dark:border-slate-800"
            >
              <div className="p-6 flex items-center justify-between border-b border-border/50 dark:border-slate-800">
                <div className="font-extrabold text-2xl bg-primary-gradient bg-clip-text text-transparent">
                  UniTrace
                </div>
                <button 
                  onClick={closeMobileSidebar}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-text-secondary dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <div className="mb-6">
                  <p className="px-3 mb-3 text-[10px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-[2px] opacity-70">Main Menu</p>
                  {mainNavigation.map((item) => {
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={closeMobileSidebar}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200
                          ${isActive 
                            ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                            : 'text-text-secondary dark:text-slate-400 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary-light'}
                        `}
                      >
                        <item.icon size={22} />
                        <span className="font-bold">{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>

                {anyAdmin && (
                  <div className="pt-6 border-t border-border/50 dark:border-slate-800">
                    <p className="px-3 mb-3 text-[10px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-[2px] opacity-70">Admin Panel</p>
                    {adminNavigation.map((item) => {
                      const showItem = item.role === 'any' || 
                                     (item.role === 'super_admin' && isSuperAdmin) ||
                                     (item.role === 'college_admin' && isAdmin);
                      
                      if (!showItem) return null;

                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={closeMobileSidebar}
                          className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200
                            ${isActive 
                              ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                              : 'text-text-secondary dark:text-slate-400 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary-light'}
                          `}
                        >
                          <item.icon size={22} />
                          <span className="font-bold">{item.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-[260px]'} pb-0`}>
        {/* Top Header (Mobile & Desktop) */}
        <header className="sticky top-0 z-40 glass-effect bg-white/70 dark:bg-card/70 border-b border-border/40 dark:border-slate-800/60 px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-text-secondary dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="lg:hidden">
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="font-extrabold text-lg sm:text-xl bg-primary-gradient bg-clip-text text-transparent cursor-pointer truncate"
                 onClick={() => navigate('/')}
               >
                 UniTrace
               </motion.div>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">
                {mainNavigation.find(n => n.href === location.pathname)?.name || 
                 adminNavigation.find(n => n.href === location.pathname)?.name || 
                 'Command Center'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/notifications')}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 relative group transition-all hover:border-primary/20 dark:hover:border-primary/40"
            >
              <Bell size={20} className="text-text-secondary dark:text-slate-400 group-hover:text-primary dark:group-hover:text-primary-light" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse" />
            </motion.button>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/profile')}
              id="tour-profile"
              className="flex items-center gap-3 p-1.5 pr-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[20px] cursor-pointer hover:border-primary/20 dark:hover:border-primary/40 transition-all shadow-sm"
            >
              <div className="w-9 h-9 rounded-full bg-primary-gradient p-0.5 shadow-lg shadow-primary/20 dark:shadow-primary/40">
                 <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-primary dark:text-primary-light font-black text-xs uppercase tracking-tighter">
                   {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'CT'}
                 </div>
              </div>
              <div className="hidden sm:block">
                 <p className="text-[10px] font-black uppercase tracking-widest text-text-primary dark:text-slate-100 leading-tight">{user?.name?.split(' ')[0] || 'Operator'}</p>
                 <p className="text-[8px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-[2px] leading-tight opacity-70">{user?.role || 'Guest'}</p>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
             <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
             >
               {children}
             </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation (visible < 1024px) */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] h-16 glass-effect bg-white/80 dark:bg-card/80 border border-white/40 dark:border-slate-800 rounded-3xl shadow-2xl z-50 flex items-center justify-around px-2 transition-colors duration-300">
        {mainNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300"
            >
              {isActive && (
                <motion.div 
                  layoutId="bubble"
                  className="absolute inset-0 bg-primary-gradient rounded-2xl shadow-lg shadow-primary/30"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon size={22} className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-text-secondary dark:text-slate-400'}`} />
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default MainLayout;
