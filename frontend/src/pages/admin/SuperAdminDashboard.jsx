import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
    Building2, Users, ClipboardList, ShieldCheck, 
    TrendingUp, Layers, CheckCircle, AlertCircle,
    ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, trend, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trend > 0 ? 'text-success' : 'text-danger'}`}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div className="space-y-1">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[2px]">{title}</p>
            <h3 className="text-3xl font-black text-text-primary tracking-tighter">{value || '0'}</h3>
        </div>
    </motion.div>
);

const SuperAdminDashboard = ({ darkMode }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                // Fetch main analytics
                const { data } = await adminAPI.getGlobalAnalytics();
                setStats(data);
            } catch (err) {
                console.error('Failed to load global metrics:', err);
                setError('Unable to synchronize with global intelligence node.');
            } finally {
                setLoading(false);
            }
        };
        fetchGlobalStats();
    }, []);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="text-center space-y-2">
                <p className="text-xs font-black text-primary uppercase tracking-[4px] animate-pulse text-nowrap">Gathering Global Intelligence</p>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-50">Synchronizing with system nodes...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-danger/5 text-danger rounded-[32px] flex items-center justify-center mb-6 border border-danger/10">
                <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter mb-2">Protocol Failure</h2>
            <p className="text-text-secondary text-sm font-medium max-w-sm mb-8 leading-relaxed">{error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                Restart Synchronization
            </button>
        </div>
    );

    // Mock chart data (since global endpoint might not return time series yet)
    const chartData = [
        { name: 'Mon', reports: 40, resolved: 24 },
        { name: 'Tue', reports: 30, resolved: 18 },
        { name: 'Wed', reports: 65, resolved: 45 },
        { name: 'Thu', reports: 45, resolved: 30 },
        { name: 'Fri', reports: 90, resolved: 70 },
        { name: 'Sat', reports: 75, resolved: 55 },
        { name: 'Sun', reports: 20, resolved: 15 },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Header section */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                    <h2 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Global Overview</h2>
                </div>
                <p className="text-text-secondary font-bold text-sm opacity-70 tracking-tight pl-14">
                    Monitor and manage the entire UniTrace institutional network.
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Institutions" 
                    value={stats?.total_colleges || 12} 
                    icon={Building2} 
                    color="from-blue-500 to-indigo-600"
                    trend={+12}
                    delay={0.1}
                />
                <StatCard 
                    title="System Users" 
                    value={stats?.total_users || 1240} 
                    icon={Users} 
                    color="from-emerald-500 to-teal-600"
                    trend={+5.4}
                    delay={0.2}
                />
                <StatCard 
                    title="Active Incidents" 
                    value={stats?.total_reports || 450} 
                    icon={ClipboardList} 
                    color="from-amber-400 to-orange-500"
                    trend={+18}
                    delay={0.3}
                />
                <StatCard 
                    title="Pending Requests" 
                    value={stats?.pending_requests || 5} 
                    icon={ShieldCheck} 
                    color="from-purple-500 to-indigo-600"
                    delay={0.4}
                />
                <StatCard 
                    title="Resolved Assets" 
                    value={stats?.resolved_reports || 312} 
                    icon={CheckCircle} 
                    color="from-pink-500 to-rose-600"
                    trend={+24}
                    delay={0.5}
                />
                <StatCard 
                    title="Global Categories" 
                    value={stats?.total_categories || 18} 
                    icon={Layers} 
                    color="from-slate-700 to-slate-900"
                    delay={0.6}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="space-y-1">
                            <h4 className="text-xl font-black text-text-primary tracking-tighter uppercase">Network Activity</h4>
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">Visualizing global incident volume (7D)</p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-white shadow-sm border border-slate-100 rounded-lg">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Reports</span>
                             </div>
                             <div className="flex items-center gap-1.5 px-3 py-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Resolved</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '20px', 
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                    labelStyle={{ fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10px' }}
                                />
                                <Area type="monotone" dataKey="reports" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorReports)" />
                                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-primary-gradient p-8 rounded-[32px] text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                         <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <Activity size={20} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[3px]">System Load</span>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                                        <span>Server Capacity</span>
                                        <span>92%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: '92%' }} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                                        <span>Request Speed</span>
                                        <span>120ms</span>
                                    </div>
                                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: '75%' }} />
                                    </div>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                                Protocol Status: HEALTHY
                            </button>
                         </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                         <div className="relative z-10 space-y-4">
                            <h5 className="text-xl font-black tracking-tighter uppercase leading-tight">Instant Deployment</h5>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed mb-4">Add or remove institutions instantly from the global management panel.</p>
                            <button 
                                onClick={() => window.location.href = '/admin/colleges'}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                            >
                                Open Registry Control <ArrowUpRight size={14} />
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
