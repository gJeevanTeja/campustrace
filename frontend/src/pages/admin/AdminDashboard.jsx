import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI, collegesAPI } from '../../services/api';
import {
    Users, Package, CheckCircle, Clock,
    AlertCircle,
    Search, Filter, ChevronLeft, ChevronRight,
    Download, FileText
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';


import PremiumCard from '../../components/ui/PremiumCard';
import { AnalyticsSkeleton } from '../../components/ui/SkeletonLoaders';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ title, value, icon, trend, idx }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
    >
        <PremiumCard className="p-6 relative overflow-hidden group border border-slate-100 dark:border-slate-800 shadow-xl shadow-black/5 dark:bg-slate-900/60 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform text-primary dark:text-primary-light">
                {icon}
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider">{title}</span>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-text-primary dark:text-slate-100 tracking-tight">{value}</span>
                    {trend && (
                        <span className="text-[10px] font-bold text-success dark:text-emerald-400 bg-success/10 dark:bg-emerald-400/10 px-1.5 py-0.5 rounded-md mb-1.5 whitespace-nowrap">
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </PremiumCard>
    </motion.div>
);

// Helper for row colors and badges
const getStatusBadge = (status) => {
    const styles = {
        active: 'bg-primary/10 text-primary border-primary/20',
        returned: 'bg-success/10 text-success border-success/20',
        claimed: 'bg-warning/10 text-warning border-warning/20',
        closed: 'bg-gray-100 text-gray-500 border-gray-200'
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.active}`}>
            {status}
        </span>
    );
};

const getTypeBadge = (type) => {
    return type === 'lost' ? (
        <span className="flex items-center gap-1.5 text-danger font-bold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
            Lost
        </span>
    ) : (
        <span className="flex items-center gap-1.5 text-success font-bold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Found
        </span>
    );
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Reports State
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [categories, setCategories] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Filter State
    const [params, setParams] = useState({
        page: 1,
        search: '',
        category: '',
        type: '',
        status: '',
        collegeId: '',
        startDate: '',
        endDate: ''
    });
    const [totalCount, setTotalCount] = useState(0);


    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [analyticsRes, categoriesRes] = await Promise.all([
                adminAPI.getAnalytics(),
                collegesAPI.getCategories(),
                adminAPI.getUsers({ limit: 1 }) // Just to check role context if needed, but analytics endpoint usually handles it
            ]);
            
            setStats(analyticsRes.data);
            setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data.results || []));
            
            // Check if Super Admin to fetch colleges
            const role = localStorage.getItem('user_role');
            setIsAdmin(role === 'super_admin');
            if (role === 'super_admin') {
                const collegesRes = await adminAPI.getColleges();
                setColleges(Array.isArray(collegesRes.data) ? collegesRes.data : (collegesRes.data.results || []));
            }
        } catch (err) {
            setError('Failed to load dashboard data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = useCallback(async (searchParams) => {
        try {
            setLoadingReports(true);
            const { data } = await adminAPI.getItemReports(searchParams);
            setReports(data.results || []);
            setTotalCount(data.count || 0);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoadingReports(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchReports(params);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchReports, params.page, params.category, params.type, params.status, params.collegeId, params.startDate, params.endDate]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (params.page !== 1) {
                setParams(prev => ({ ...prev, page: 1 }));
            } else {
                fetchReports(params);
            }
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.search, fetchReports]);

    const exportData = async (format) => {
        try {
            let response;
            let filename = `UniTrace_Report_${new Date().toISOString().split('T')[0]}`;
            
            // Pass current filters to export
            const exportParams = { ...params };
            delete exportParams.page; // Export everything matching filters
            
            if (format === 'csv') {
                response = await adminAPI.exportCSV(exportParams);
                filename += '.csv';
            } else if (format === 'excel') {
                response = await adminAPI.exportExcel(exportParams);
                filename += '.xlsx';
            } else if (format === 'pdf') {
                response = await adminAPI.exportPDF(exportParams);
                filename += '.pdf';
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to download report.');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const MobileReportCard = ({ item }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 border-b border-border dark:border-slate-800 last:border-0 hover:bg-primary/[0.02] dark:hover:bg-slate-800/40"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h5 className="text-sm font-bold text-text-primary dark:text-slate-100 mb-1">{item.title}</h5>
                    <div className="flex flex-wrap gap-2">
                        {getTypeBadge(item.type)}
                        {getStatusBadge(item.status)}
                    </div>
                </div>
                <span className="text-[10px] font-bold text-text-secondary dark:text-slate-400 whitespace-nowrap bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg transition-colors">
                    {item.date_reported}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-4">
                <div>
                    <span className="text-[9px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-widest block mb-0.5 transition-colors">Category</span>
                    <span className="text-xs font-semibold text-text-primary dark:text-slate-200 bg-gray-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md inline-block transition-colors">{item.category}</span>
                </div>
                <div>
                    <span className="text-[9px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-widest block mb-0.5 transition-colors">Location</span>
                    <span className="text-xs font-semibold text-text-primary dark:text-slate-200 truncate block transition-colors">{item.location}</span>
                </div>
                {isAdmin && (
                    <div className="col-span-2">
                        <span className="text-[9px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-widest block mb-0.5 transition-colors">College</span>
                        <span className="text-xs font-bold text-primary dark:text-primary-light transition-colors">{item.college_name}</span>
                    </div>
                )}
                <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-border/50 dark:border-slate-800/50">
                    <div className="w-5 h-5 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary dark:text-primary-light">
                        {(item.reported_by || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] font-medium text-text-secondary dark:text-slate-400">Reported by <span className="text-text-primary dark:text-slate-100 font-bold">{item.reported_by}</span></span>
                </div>
            </div>
        </motion.div>
    );

    if (loading) return (
        <div className="space-y-8">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
            <AnalyticsSkeleton />
            <div className="h-64 w-full bg-gray-200 animate-pulse rounded-2xl" />
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header section remains similar but updated */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary dark:text-slate-100">
                        {isAdmin ? 'Global System Analytics' : 'College Analytics'}
                    </h2>
                    <p className="text-sm sm:text-base text-text-secondary dark:text-slate-400">Overview of reporting activity and system performance.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button onClick={() => exportData('csv')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 hover:py-2.5 border border-border dark:border-slate-700 rounded-xl font-bold text-xs sm:text-sm bg-white dark:bg-slate-900 transition-all shadow-sm text-text-secondary dark:text-slate-400 group">
                        <FileText size={16} className="text-primary dark:text-primary-light group-hover:scale-110 transition-transform" />
                        CSV
                    </button>
                    <button onClick={() => exportData('excel')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 hover:py-2.5 bg-primary text-white rounded-xl font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                        <Download size={16} />
                        Excel
                    </button>
                    <button onClick={() => exportData('pdf')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 hover:py-2.5 bg-danger text-white rounded-xl font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-danger/20 transition-all active:scale-95">
                        <FileText size={16} />
                        PDF
                    </button>
                </div>
            </div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-danger/10 text-danger p-4 rounded-2xl border border-danger/20 flex items-center gap-3 font-medium"
                >
                    <AlertCircle size={20} />
                    {error}
                </motion.div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard idx={0} title="Total Reports" value={stats?.totalReports || 0} icon={<Package size={24} />} trend="+12% weekly" />
                <StatCard idx={1} title="Resolution Rate" value={`${stats?.resolutionRate || 0}%`} icon={<CheckCircle size={24} />} />
                <StatCard idx={2} title="Active Users" value={stats?.activeUsers || 0} icon={<Users size={24} />} trend="+5 today" />
                <StatCard idx={3} title="Avg. Return Time" value={stats?.avgReturnTime || 'N/A'} icon={<Clock size={24} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <PremiumCard className="lg:col-span-2 p-8" hover={false}>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h4 className="text-lg font-bold text-text-primary dark:text-slate-100">Reporting Activity</h4>
                            <p className="text-sm text-text-secondary dark:text-slate-400">Daily reports trend over the last 30 days.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-xs font-bold text-text-secondary">Reports</span>
                        </div>
                    </div>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.reportsByDay || []}>
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#1e293b' : '#E5E7EB'} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: document.documentElement.classList.contains('dark') ? '#64748b' : '#6B7280', fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: document.documentElement.classList.contains('dark') ? '#64748b' : '#6B7280', fontWeight: 500 }} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff', 
                                        borderRadius: '16px', 
                                        border: '1px solid var(--border)', 
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', 
                                        padding: '12px' 
                                    }}
                                    itemStyle={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}
                                    labelStyle={{ color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#6B7280', fontWeight: 600, marginBottom: '4px' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#4F46E5' }} animationDuration={1500} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </PremiumCard>

                {/* Distribution Chart */}
                <PremiumCard className="p-6 sm:p-8" hover={false}>
                    <h4 className="text-lg font-bold text-text-primary mb-2">Distribution</h4>
                    <p className="text-sm text-text-secondary mb-8">Lost vs Found ratio.</p>
                    <div className="h-[200px] sm:h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[{ name: 'Lost', value: stats?.lostVsFound?.lost || 0 }, { name: 'Found', value: stats?.lostVsFound?.found || 0 }]}
                                    innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" animationDuration={1500}
                                >
                                    <Cell fill="#EF4444" />
                                    <Cell fill="#10B981" />
                                </Pie>
                                <Tooltip />
                                <Legend align="center" verticalAlign="bottom" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </PremiumCard>
            </div>

            {/* Detailed Item Reports Section */}
            <div className="mt-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h4 className="text-xl sm:text-2xl font-extrabold text-text-primary dark:text-slate-100">
                            {isAdmin ? 'Global Item Reports' : 'College Item Reports'}
                        </h4>
                        <p className="text-sm sm:text-base text-text-secondary dark:text-slate-400">Detailed log of all reported items with advanced filtering.</p>
                    </div>
                    
                    {/* Search & Global Actions */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-slate-500" size={18} />
                        <input
                            type="text"
                            name="search"
                            value={params.search}
                            onChange={handleFilterChange}
                            placeholder="Search items, reference #..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm font-medium dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* Filter Toolbar */}
                <PremiumCard className="p-4 mb-6" hover={false}>
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4">
                        <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-light rounded-xl transition-colors">
                            <Filter size={18} />
                            <span className="text-sm font-bold uppercase tracking-wider">Filters</span>
                        </div>
                        
                        <div className="h-8 w-px bg-border dark:bg-slate-700 hidden md:block" />

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:flex gap-3 items-center">
                            {/* College Filter (Super Admin only) */}
                            {isAdmin && (
                                <select
                                    name="collegeId"
                                    value={params.collegeId}
                                    onChange={handleFilterChange}
                                    className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                >
                                    <option value="">All Colleges</option>
                                    {(Array.isArray(colleges) ? colleges : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}

                            <select
                                name="category"
                                value={params.category}
                                onChange={handleFilterChange}
                                className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            >
                                <option value="">Categories</option>
                                {(Array.isArray(categories) ? categories : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select
                                name="type"
                                value={params.type}
                                onChange={handleFilterChange}
                                className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            >
                                <option value="">Types</option>
                                <option value="lost">Lost</option>
                                <option value="found">Found</option>
                            </select>

                            <select
                                name="status"
                                value={params.status}
                                onChange={handleFilterChange}
                                className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            >
                                <option value="">Status</option>
                                <option value="active">Active</option>
                                <option value="returned">Returned</option>
                                <option value="claimed">Claimed</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
                            <input 
                                type="date" 
                                name="startDate"
                                value={params.startDate}
                                onChange={handleFilterChange}
                                className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-[10px] sm:text-xs font-bold text-text-secondary outline-none w-full sm:w-auto"
                            />
                            <span className="text-text-secondary">-</span>
                            <input 
                                type="date"
                                name="endDate"
                                value={params.endDate}
                                onChange={handleFilterChange}
                                className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-[10px] sm:text-xs font-bold text-text-secondary outline-none w-full sm:w-auto"
                            />
                        </div>
                    </div>
                </PremiumCard>

                {/* Table Section */}
                <PremiumCard className="overflow-hidden p-0" hover={false}>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-border dark:border-slate-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Item Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Location</th>
                                    {isAdmin && <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">College</th>}
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Reported By</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence mode="popLayout">
                                    {loadingReports ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={`skeleton-${i}`} className="animate-pulse">
                                                {[...Array(isAdmin ? 8 : 7)].map((_, j) => (
                                                    <td key={j} className="px-6 py-5">
                                                        <div className="h-4 bg-gray-100 rounded-md w-24" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : reports.length > 0 && (
                                        reports.map((item, idx) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group hover:bg-primary/[0.02] dark:hover:bg-slate-800/40 transition-colors cursor-pointer border-b border-border dark:border-slate-800 last:border-0"
                                            >
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-bold text-text-primary dark:text-slate-100 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">{item.title}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs font-medium text-text-secondary bg-gray-100 px-2 py-1 rounded-lg">{item.category}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {getTypeBadge(item.type)}
                                                </td>
                                                <td className="px-6 py-5">
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs font-medium text-text-secondary">{item.location}</span>
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-6 py-5">
                                                        <span className="text-xs font-bold text-text-primary">{item.college_name}</span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                            {(item.reported_by || 'U')[0].toUpperCase()}
                                                        </div>
                                                        <span className="text-xs font-medium text-text-primary">{item.reported_by}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs font-bold text-text-secondary whitespace-nowrap">{item.date_reported}</span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        <AnimatePresence mode="popLayout">
                            {loadingReports ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={`skeleton-card-${i}`} className="p-5 border-b border-border animate-pulse">
                                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                                    </div>
                                ))
                            ) : reports.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {reports.map((item) => (
                                        <MobileReportCard key={item.id} item={item} />
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 bg-gray-50 rounded-full text-gray-400">
                                            <Package size={40} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary">No reports found matching your criteria.</p>
                                            <button 
                                                onClick={() => setParams({ ...params, search: '', category: '', type: '', status: '', startDate: '', endDate: '' })}
                                                className="text-primary text-sm font-bold mt-2 hover:underline"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                     {/* Pagination */}
                    <div className="px-4 sm:px-6 py-4 bg-gray-50/50 dark:bg-slate-900/60 border-t border-border dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                        <p className="text-xs font-bold text-text-secondary dark:text-slate-400 order-2 sm:order-1">
                            Showing <span className="text-text-primary dark:text-slate-100">{reports.length}</span> of <span className="text-text-primary dark:text-slate-100">{totalCount}</span>
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                            <button
                                onClick={() => setParams(p => ({ ...p, page: p.page - 1 }))}
                                disabled={params.page === 1}
                                className="p-2 border border-border dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(Math.ceil(totalCount / 20))].map((_, i) => {
                                    const page = i + 1;
                                    // Only show current, first, last and surrounding pages
                                    if (page === 1 || page === Math.ceil(totalCount / 20) || Math.abs(page - params.page) <= 1) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setParams(p => ({ ...p, page }))}
                                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${params.page === page ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white text-text-secondary'}`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    }
                                    if (Math.abs(page - params.page) === 2) return <span key={page} className="px-1">...</span>;
                                    return null;
                                })}
                            </div>
                            <button
                                onClick={() => setParams(p => ({ ...p, page: p.page + 1 }))}
                                disabled={params.page >= Math.ceil(totalCount / 20)}
                                className="p-2 border border-border rounded-xl hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
};

export default AdminDashboard;
