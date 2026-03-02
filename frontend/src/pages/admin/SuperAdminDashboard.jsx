import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import {
    Building2, Users, ClipboardList, ShieldCheck
} from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
    <div style={{
        background: '#fff',
        padding: '36px',
        borderRadius: '32px',
        border: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        marginBottom: '24px',
        width: '100%',
        maxWidth: '540px'
    }}>
        <div>
            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{title}</p>
            <h3 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: '#1e293b' }}>{value}</h3>
        </div>
        <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `${color}08`, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {React.cloneElement(icon, { size: 36 })}
        </div>
    </div>
);

const SuperAdminDashboard = ({ darkMode }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                const { data } = await adminAPI.getGlobalAnalytics();
                setStats(data);
            } catch (err) {
                console.error('Failed to load global metrics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGlobalStats();
    }, []);

    if (loading) return (
        <AdminLayout darkMode={darkMode}>
            <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #f3f3f3', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <p style={{ color: '#94a3b8', fontWeight: 600 }}>Gathering global intelligence...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout darkMode={darkMode}>
            <div style={{ paddingLeft: '20px' }}>
                <div style={{ marginBottom: 56 }}>
                    <h2 style={{ fontSize: 44, fontWeight: 900, color: '#1e293b', margin: '0 0 16px 0', letterSpacing: '-1px' }}>Global System Overview</h2>
                    <p style={{ color: '#94a3b8', fontSize: 18, fontWeight: 600, margin: 0, opacity: 0.9 }}>
                        Monitor and manage the entire CampusTrace network.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <StatCard
                        title="Total Colleges"
                        value={stats?.total_colleges || 12}
                        icon={<Building2 />}
                        color="#2563eb"
                    />
                    <StatCard
                        title="Pending Admin Requests"
                        value={stats?.pending_requests || 5}
                        icon={<ShieldCheck />}
                        color="#7c3aed"
                    />
                    <StatCard
                        title="Global Users"
                        value={stats?.total_users || 1240}
                        icon={<Users />}
                        color="#10b981"
                    />
                    <StatCard
                        title="Total Reports"
                        value={stats?.total_reports || 450}
                        icon={<ClipboardList />}
                        color="#f59e0b"
                    />
                </div>
            </div>
        </AdminLayout>
    );
};

export default SuperAdminDashboard;
