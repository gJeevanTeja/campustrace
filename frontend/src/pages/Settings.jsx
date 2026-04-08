import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { 
  ChevronLeft, 
  Moon, 
  Bell, 
  Volume2, 
  Mail, 
  Info, 
  LogOut, 
  ShieldCheck, 
  Sparkles,
  Zap,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const Settings = ({ darkMode, setDarkMode }) => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        notifications_enabled: true,
        notification_sound: true,
        email_notifications: true,
        upi_id: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await authAPI.getSettings();
                setSettings(res.data);
            } catch (err) {
                console.error('Failed to fetch settings', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleToggle = async (key) => {
        if (key === 'dark_mode') {
            if (typeof setDarkMode === 'function') {
                setDarkMode(!darkMode);
            }
            try { await authAPI.updateSettings({ dark_mode: !darkMode }); } catch (e) {}
            return;
        }

        const newVal = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newVal }));
        setSaving(true);
        try {
            await authAPI.updateSettings({ [key]: newVal });
            showToast('Telemetry parameters successfully updated');
        } catch (err) {
            setSettings(prev => ({ ...prev, [key]: !newVal }));
            showToast('Protocol failure: Sync aborted');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUPI = async () => {
        if (!settings.upi_id || !settings.upi_id.includes('@')) {
            showToast('Invalid UPI format (requires @)');
            return;
        }
        setSaving(true);
        try {
            await authAPI.updateSettings({ upi_id: settings.upi_id });
            showToast('UPI Address Linked Successfully');
        } catch (err) {
            showToast(err.response?.data?.upi_id?.[0] || 'Failed to link UPI');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
           <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
           <p className="font-black text-text-secondary uppercase tracking-widest text-xs">Accessing System Preferences...</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-32 px-4 font-sans">
            <AnimatePresence>
                {toast && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, x: '-50%' }}
                      animate={{ opacity: 1, y: 0, x: '-50%' }}
                      exit={{ opacity: 0, y: -20, x: '-50%' }}
                      className="fixed top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-[100]"
                    >
                        <CheckCircle2 size={16} className="text-success" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{toast}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-12">
                <div className="space-y-2">
                   <div className="flex items-center gap-4">
                       <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-card border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                           <ChevronLeft size={20} className="text-text-primary dark:text-slate-100" />
                       </button>
                       <h1 className="text-4xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">System Config</h1>
                   </div>
                   <p className="text-text-secondary dark:text-slate-400 font-medium ml-16 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                       {saving ? <><Sparkles size={14} className="text-primary animate-pulse" /> Synchronizing changes...</> : <><ShieldCheck size={14} className="text-primary" /> Hardware & Identity encryption active.</>}
                   </p>
                </div>
            </header>

            <div className="space-y-10">
                {/* Visuals */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500 pl-2">Atmospheric Control</h3>
                    <PremiumCard className="p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <SettingRow 
                            icon={<Moon />} 
                            title="Luminance Mode" 
                            subtitle="Switch to Low-Light interface protocol"
                            value={darkMode} 
                            onToggle={() => handleToggle('dark_mode')} 
                            color="text-indigo-500"
                        />
                    </PremiumCard>
                </section>

                {/* Telemetry */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500 pl-2">Neural Link (Notifications)</h3>
                    <PremiumCard className="p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <SettingRow 
                            icon={<Bell />} 
                            title="Signal Alerts" 
                            subtitle="Push notifications for asset activity"
                            value={settings.notifications_enabled} 
                            onToggle={() => handleToggle('notifications_enabled')} 
                            color="text-primary"
                        />
                        <SettingRow 
                            icon={<Volume2 />} 
                            title="Auditory Feedback" 
                            subtitle="High-frequency sonar on notification"
                            value={settings.notification_sound} 
                            onToggle={() => handleToggle('notification_sound')} 
                            disabled={!settings.notifications_enabled}
                            color="text-amber-500"
                        />
                        <SettingRow 
                            icon={<Mail />} 
                            title="Encrypted Dispatch" 
                            subtitle="Legacy email alerts for critical events"
                            value={settings.email_notifications} 
                            onToggle={() => handleToggle('email_notifications')} 
                            color="text-success"
                        />
                    </PremiumCard>
                </section>

                {/* Financial Links */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500 pl-2">Financial Routing (UPI)</h3>
                    <PremiumCard className="p-6 space-y-4 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 text-emerald-500 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                <Wallet size={20} />
                            </div>
                            <div className="flex-1 w-full">
                                <p className="text-sm font-black text-text-primary dark:text-slate-100 uppercase tracking-tight">Reward UPI ID</p>
                                <p className="text-[10px] font-medium text-text-secondary dark:text-slate-400 mb-2">Configure account for reward payouts (e.g. name@bank)</p>
                                <input 
                                    type="text" 
                                    placeholder="Enter UPI Address..."
                                    value={settings.upi_id || ''}
                                    onChange={(e) => setSettings({...settings, upi_id: e.target.value.trim()})}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-text-primary dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleSaveUPI}
                            className="w-full md:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            Link Account
                        </button>
                    </PremiumCard>
                </section>

                {/* System Info */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500 pl-2">Hardware Info</h3>
                    <PremiumCard className="p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center">
                                  <Info size={20} />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-text-primary dark:text-slate-100 uppercase tracking-tight">Mainframe Version</p>
                                  <p className="text-[10px] font-medium text-text-secondary dark:text-slate-400 uppercase">Build CT-V1.0.4-LATEST</p>
                               </div>
                            </div>
                            <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/5 dark:bg-primary/10 rounded-full">v1.0.0</span>
                        </div>
                        <div className="flex items-center justify-between p-6 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center">
                                  <Zap size={20} />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-text-primary dark:text-slate-100 uppercase tracking-tight">System Identity</p>
                                  <p className="text-[10px] font-medium text-text-secondary dark:text-slate-400 uppercase">UniTrace Protocol</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-text-secondary dark:text-slate-500 uppercase">Active</span>
                        </div>
                    </PremiumCard>
                </section>

                {/* Termination */}
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    navigate('/login'); 
                  }}
                  className="w-full p-8 rounded-[32px] bg-danger/5 border-2 border-danger/10 flex items-center justify-between group overflow-hidden relative"
                >
                    <div className="relative z-10 flex items-center gap-6">
                       <div className="w-14 h-14 bg-danger text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-danger/20 transition-transform group-hover:rotate-12">
                          <LogOut size={24} />
                       </div>
                       <div className="text-left">
                          <p className="text-lg font-black text-danger uppercase tracking-tighter">Terminate Session</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-danger/50">Disconnect from secure mainframe</p>
                       </div>
                    </div>
                    <div className="relative z-10 p-3 bg-danger/10 text-danger rounded-xl opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                       <ChevronLeft size={20} className="rotate-180" />
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-danger/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-danger/10 transition-colors" />
                </motion.button>
            </div>
        </div>
    );
};

const SettingRow = ({ icon, title, subtitle, value, onToggle, disabled, color }) => (
    <div className={`p-6 flex items-center justify-between transition-opacity ${disabled ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}>
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${color} bg-current bg-opacity-5 dark:bg-opacity-10 rounded-2xl flex items-center justify-center`}>
                {React.cloneElement(icon, { size: 20 })}
            </div>
            <div>
                <p className="text-sm font-black text-text-primary dark:text-slate-100 uppercase tracking-tight">{title}</p>
                <p className="text-[10px] font-medium text-text-secondary dark:text-slate-400">{subtitle}</p>
            </div>
        </div>
        <button 
          onClick={onToggle}
          disabled={disabled}
          className={`relative w-14 h-8 rounded-full transition-all duration-300 ${value ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-200 dark:bg-slate-800'}`}
        >
            <div className={`absolute top-1 left-1 w-6 h-6 bg-white dark:bg-slate-100 rounded-full shadow-md transition-transform duration-300 ${value ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);

export default Settings;