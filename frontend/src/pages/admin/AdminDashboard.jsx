import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import {
    Users, Package, CheckCircle, Clock,
    TrendingUp, AlertCircle, Calendar
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';


const StatCard = ({ title, value, icon, trend, dm }) => (
    <div style={{
        background: dm ? '#1e293b' : '#fff',
        padding: '24px',
        borderRadius: '16px',
        border: `1px solid ${dm ? '#334155' : '#e2e8f0'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dm ? '#94a3b8' : '#64748b', marginBottom: 8 }}>{title}</p>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{value}</h3>
                {trend && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TrendingUp size={14} /> {trend}
                    </p>
                )}
            </div>
            <div style={{
                padding: 12, borderRadius: 12,
                background: '#2563eb11', color: '#2563eb'
            }}>
                {icon}
            </div>
        </div>
    </div>
);

const AdminDashboard = ({ darkMode }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const dm = darkMode;

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const { data } = await adminAPI.getAnalytics();
            setStats(data);
        } catch (err) {
            setError('Failed to load dashboard data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportData = async (format) => {
        try {
            const { data } = await adminAPI.exportAnalytics(format);
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics-report.${format === 'excel' ? 'xlsx' : format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download report.');
        }
    };

    if (loading) return (
        <AdminLayout darkMode={dm}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p style={{ color: dm ? '#94a3b8' : '#64748b' }}>Calculating real-time metrics...</p>
                </div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout darkMode={dm}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>College Analytics</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => exportData('csv')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ccc', cursor: 'pointer' }}>CSV</button>
                    <button onClick={() => exportData('excel')} style={{ padding: '8px 16px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>Excel</button>
                    <button onClick={() => exportData('pdf')} style={{ padding: '8px 16px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>PDF</button>
                </div>
            </div>
            {error && (
                <div style={{
                    background: '#fee2e2', color: '#dc2626', padding: '16px',
                    borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '24px',
                    display: 'flex', alignItems: 'center', gap: 12
                }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Overview Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <StatCard
                    title="Total Reports"
                    value={stats?.total_lost + stats?.total_found || 0}
                    icon={<Package size={24} />}
                    trend="+12% from last week"
                    dm={dm}
                />
                <StatCard
                    title="Resolution Rate"
                    value={`${stats?.resolution_rate || 0}%`}
                    icon={<CheckCircle size={24} />}
                    dm={dm}
                />
                <StatCard
                    title="Active Users"
                    value={stats?.active_users || 0}
                    icon={<Users size={24} />}
                    trend="+5 new today"
                    dm={dm}
                />
                <StatCard
                    title="Avg. Return Time"
                    value={stats?.avg_return_time || 'N/A'}
                    icon={<Clock size={24} />}
                    dm={dm}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                {/* Charts - Will populate with real data once available */}
                <div style={{
                    background: dm ? '#1e293b' : '#fff',
                    padding: '24px',
                    borderRadius: '16px',
                    border: `1px solid ${dm ? '#334155' : '#e2e8f0'}`
                }}>
                    <h4 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 700 }}>Reporting Activity</h4>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.category_stats || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dm ? '#334155' : '#f1f5f9'} />
                                <XAxis dataKey="category__name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: dm ? '#94a3b8' : '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: dm ? '#94a3b8' : '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ background: dm ? '#1e293b' : '#fff', borderRadius: 12, border: `1px solid ${dm ? '#334155' : '#e2e8f0'}` }}
                                    itemStyle={{ fontSize: 12, fontWeight: 600 }}
                                />
                                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{
                    background: dm ? '#1e293b' : '#fff',
                    padding: '24px',
                    borderRadius: '16px',
                    border: `1px solid ${dm ? '#334155' : '#e2e8f0'}`
                }}>
                    <h4 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 700 }}>Distribution</h4>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Lost', value: stats?.total_lost || 0 },
                                        { name: 'Found', value: stats?.total_found || 0 },
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#ef4444" />
                                    <Cell fill="#10b981" />
                                </Pie>
                                <Tooltip />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '32px' }}>
                <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Key Insights</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div style={{
                        background: '#2563eb08', color: '#2563eb', padding: '16px',
                        borderRadius: '12px', border: '1px solid #2563eb22',
                        display: 'flex', alignItems: 'center', gap: 12
                    }}>
                        <Calendar size={20} />
                        <div>
                            <p style={{ margin: 0, fontSize: 12, opacity: 0.8, fontWeight: 600 }}>Peak Reporting Hour</p>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{stats?.peak_hour || 'Calculating...'}</p>
                        </div>
                    </div>
                    <div style={{
                        background: '#f59e0b08', color: '#d97706', padding: '16px',
                        borderRadius: '12px', border: '1px solid #f59e0b22',
                        display: 'flex', alignItems: 'center', gap: 12
                    }}>
                        <Package size={20} />
                        <div>
                            <p style={{ margin: 0, fontSize: 12, opacity: 0.8, fontWeight: 600 }}>Most Lost Category</p>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{stats?.top_category || 'Electronics'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
