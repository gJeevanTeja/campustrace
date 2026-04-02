import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemsAPI } from '../services/api';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
} from 'recharts';
import { 
  LayoutDashboard, 
  RefreshCcw, 
  TrendingUp, 
  Package, 
  AlertCircle,
  ChevronRight,
  Clock,
  ShieldCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const PIE_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];
const BAR_COLORS = { lost: '#EF4444', found: '#10B981', claimed: '#F59E0B', returned: '#4F46E5' };

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('user');
    const [userStats, setUserStats] = useState(null);
    const [adminStats, setAdminStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const buildMonthlyData = (items) => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                month: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(), monthNum: d.getMonth(),
                lost: 0, found: 0, claimed: 0,
            });
        }
        items.forEach(item => {
            const d = new Date(item.created_at || item.date_posted);
            months.forEach(m => {
                if (d.getFullYear() === m.year && d.getMonth() === m.monthNum) {
                    if (item.type === 'lost') m.lost++;
                    if (item.type === 'found') m.found++;
                    if (item.status === 'claimed') m.claimed++;
                }
            });
        });
        return months.map(({ month, lost, found, claimed }) => ({ month, lost, found, claimed }));
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const myRes = await itemsAPI.getMyItems();
            const myItems = Array.isArray(myRes.data) ? myRes.data : (myRes.data?.results || []);

            setUserStats({
                lost: myItems.filter(i => i.type === 'lost').length,
                found: myItems.filter(i => i.type === 'found').length,
                claimed: myItems.filter(i => i.status === 'claimed').length,
                returned: myItems.filter(i => i.status === 'returned').length,
                active: myItems.filter(i => i.status === 'active').length,
                total: myItems.length,
                items: myItems,
            });

            if (user?.role === 'admin' || user?.is_staff) {
                try {
                    const allRes = await itemsAPI.getAll({ page_size: 1000 });
                    const all = Array.isArray(allRes.data) ? allRes.data : (allRes.data?.results || []);
                    setAdminStats({
                        total: all.length,
                        lost: all.filter(i => i.type === 'lost').length,
                        found: all.filter(i => i.type === 'found').length,
                        claimed: all.filter(i => i.status === 'claimed').length,
                        returned: all.filter(i => i.status === 'returned').length,
                        active: all.filter(i => i.status === 'active').length,
                        monthlyData: buildMonthlyData(all),
                    });
                } catch (e) { console.error('Admin fetch error', e); }
            }
        } catch (e) {
            setError('System telemetry failure. Could not retrieve dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const userPieData = userStats ? [
        { name: 'Lost', value: userStats.lost },
        { name: 'Found', value: userStats.found },
        { name: 'Claimed', value: userStats.claimed },
        { name: 'Returned', value: userStats.returned },
    ].filter(d => d.value > 0) : [];

    const isAdmin = user?.role === 'admin' || user?.is_staff;

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-32 px-4 font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-12">
                <div className="space-y-3">
                   <div className="flex items-center gap-4">
                       <div className="p-3 bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl transition-colors">
                           <LayoutDashboard size={24} />
                       </div>
                       <h1 className="text-4xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">Command Center</h1>
                   </div>
                   <div className="flex items-center gap-4 pl-14">
                       <p className="text-text-secondary dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                           Welcome back, <span className="text-primary">{user?.name?.split(' ')[0]}</span>
                       </p>
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-success">
                           <div className="w-2 h-2 rounded-full bg-success animate-pulse" /> System Online
                       </div>
                   </div>
                </div>
                <div className="flex items-center gap-3 pl-14 md:pl-0">
                    <button onClick={fetchData} className="p-4 bg-white dark:bg-card border border-slate-100 dark:border-slate-800 rounded-2xl text-text-secondary dark:text-slate-400 hover:text-primary transition-all shadow-sm">
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {isAdmin && (
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[20px] transition-colors">
                            {['user', 'admin'].map(tab => (
                                <button
                                  key={tab}
                                  onClick={() => setActiveTab(tab)}
                                  className={`px-6 py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-primary dark:text-slate-100 shadow-lg shadow-black/5' : 'text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-slate-200'}`}
                                >
                                    {tab === 'user' ? 'Operator' : 'Overseer'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-40">
                   <RefreshCcw size={48} className="animate-spin text-primary" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-text-primary dark:text-slate-100">Synchronizing Telemetry...</p>
                </div>
            ) : error ? (
                <div className="p-8 bg-danger/5 dark:bg-danger/10 border-2 border-danger/10 dark:border-danger/20 rounded-[32px] text-center space-y-4 transition-colors">
                   <AlertCircle size={48} className="mx-auto text-danger" />
                   <p className="text-sm font-black uppercase tracking-widest text-danger">{error}</p>
                   <button onClick={fetchData} className="px-8 py-3 bg-danger text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-danger/20">Retry Handshake</button>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                    {/* STATS GRID */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {activeTab === 'user' ? (
                            <>
                                <StatCard icon={<AlertCircle />} label="Lost Manifest" value={userStats.lost} color="text-danger" bg="bg-danger/5" />
                                <StatCard icon={<Package />} label="Found Assets" value={userStats.found} color="text-success" bg="bg-success/5" />
                                <StatCard icon={<CheckCircle2 />} label="Resolutions" value={userStats.claimed + userStats.returned} color="text-primary" bg="bg-primary/5" />
                                <StatCard icon={<TrendingUp />} label="Activity Rank" value={`#${userStats.total > 5 ? 'A' : 'B'}`} color="text-amber-500" bg="bg-amber-500/5" />
                            </>
                        ) : (
                            <>
                                <StatCard icon={<ShieldCheck />} label="Network Total" value={adminStats.total} color="text-primary" bg="bg-primary/5" />
                                <StatCard icon={<AlertCircle />} label="Active Alerts" value={adminStats.active} color="text-success" bg="bg-success/5" />
                                <StatCard icon={<CheckCircle2 />} label="Total Returned" value={adminStats.returned} color="text-indigo-500" bg="bg-indigo-500/5" />
                                <StatCard icon={<Sparkles />} label="AI Precision" value="99.8%" color="text-amber-500" bg="bg-amber-500/5" />
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* CHART SECTION */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xs font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500 pl-2">System Analytics</h2>
                            <PremiumCard className="p-8 h-[400px]">
                                {activeTab === 'user' ? (
                                    userPieData.length > 0 ? (
                                        <div className="h-full flex flex-col">
                                            <div className="flex-1">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie 
                                                          data={userPieData} 
                                                          cx="50%" cy="50%" 
                                                          innerRadius={80} 
                                                          outerRadius={120} 
                                                          paddingAngle={8} 
                                                          dataKey="value"
                                                          stroke="none"
                                                        >
                                                            {userPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip 
                                                          contentStyle={{ background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                                          itemStyle={{ color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex justify-center gap-8 pt-4 border-t border-slate-50 dark:border-slate-800 transition-colors">
                                                {userPieData.map((d, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary dark:text-slate-500">{d.name} ({d.value})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 grayscale">
                                            <TrendingUp size={64} />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Awaiting Data Points to Generate Intelligence</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={adminStats.monthlyData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9'} />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: document.documentElement.classList.contains('dark') ? '#64748b' : '#94a3b8' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: document.documentElement.classList.contains('dark') ? '#64748b' : '#94a3b8' }} />
                                                <Tooltip 
                                                  cursor={{ fill: document.documentElement.classList.contains('dark') ? '#1e293b' : '#f8fafc' }} 
                                                  contentStyle={{ background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold' }}
                                                  itemStyle={{ color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b' }}
                                                />
                                                <Bar dataKey="lost" fill={BAR_COLORS.lost} radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="found" fill={BAR_COLORS.found} radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="claimed" fill={BAR_COLORS.claimed} radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </PremiumCard>
                        </div>

                        {/* LIST SECTION */}
                        <div className="space-y-6">
                            <h2 className="text-xs font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500 pl-2">Real-time Feed</h2>
                            <PremiumCard className="p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 flex flex-col min-h-[400px]">
                                {userStats.items.length > 0 ? (
                                    <>
                                        {userStats.items.slice(0, 6).map((item, i) => (
                                            <motion.div 
                                              key={item.id}
                                              whileHover={{ x: 5 }}
                                              onClick={() => navigate(`/item/${item.id}`)}
                                              className="p-5 flex items-center justify-between cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl transition-colors ${item.type === 'lost' ? 'bg-danger/5 dark:bg-danger/10 text-danger' : 'bg-success/5 dark:bg-success/10 text-success'}`}>
                                                        <Package size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-text-primary dark:text-slate-100 tracking-tight truncate max-w-[120px] transition-colors">{item.title}</p>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase transition-colors">
                                                            <Clock size={10} /> {item.time_ago || 'recent'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                        item.status === 'active' ? 'bg-success/5 text-success' :
                                                        item.status === 'claimed' ? 'bg-amber-500/5 text-amber-500' :
                                                        item.status === 'returned' ? 'bg-primary/5 text-primary' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
                                                </div>
                                            </motion.div>
                                        ))}
                                        <button onClick={() => navigate('/my-items')} className="w-full py-5 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all mt-auto border-t border-slate-100 dark:border-slate-800">
                                            Access Full Archive
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 grayscale opacity-30">
                                        <AlertCircle size={48} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Feed Depleted. No items currently registered under your signature.</p>
                                        <button onClick={() => navigate('/report')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Register Item</button>
                                    </div>
                                )}
                            </PremiumCard>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, color, bg }) => (
    <PremiumCard className={`p-6 space-y-4 border-none shadow-xl shadow-black/5`}>
        <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-sm dark:bg-opacity-20 transition-colors`}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary dark:text-slate-500 transition-colors">{label}</h4>
            <p className={`text-3xl font-black ${color} tracking-tighter transition-colors`}>{value}</p>
        </div>
    </PremiumCard>
);

export default Dashboard;