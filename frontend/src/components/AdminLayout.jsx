import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    BarChart2, Users, MapPin, Grid, Shield,
    LogOut, ChevronLeft, Building
} from 'lucide-react';

const AdminLayout = ({ children, darkMode }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const dm = darkMode;

    const isAdmin = user?.role === 'super_admin' || user?.role === 'college_admin' || user.role === 'moderator';

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 p-6">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-sm">
                    <Shield size={64} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">This area is reserved for administrators only.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const menuItems = [
        { name: 'Dashboard', icon: <BarChart2 size={20} />, path: '/admin', roles: ['super_admin', 'college_admin', 'moderator'] },
        { name: 'Colleges', icon: <Building size={20} />, path: '/admin/colleges', roles: ['super_admin'] },
        { name: 'Users', icon: <Users size={20} />, path: '/admin/users', roles: ['super_admin', 'college_admin', 'moderator'] },
        { name: 'Blocks', icon: <MapPin size={20} />, path: '/admin/blocks', roles: ['super_admin', 'college_admin'] },
        { name: 'Categories', icon: <Grid size={20} />, path: '/admin/categories', roles: ['super_admin', 'college_admin'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

    const sidebarBg = dm ? '#1e1e1e' : '#ffffff';
    const bodyBg = dm ? '#121212' : '#f8fafc';
    const textColor = dm ? '#f1f5f9' : '#1e1e1e';
    const borderColor = dm ? '#333333' : '#e2e8f0';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: bodyBg, color: textColor }}>
            {/* Sidebar */}
            <aside style={{
                width: 260,
                background: sidebarBg,
                borderRight: `1px solid ${borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 50
            }}>
                <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, background: '#2563eb', borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                        <Shield size={24} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>Admin Panel</span>
                </div>

                <nav style={{ flex: 1, padding: '10px 12px' }}>
                    <p style={{
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        color: dm ? '#64748b' : '#94a3b8', padding: '0 12px 8px', letterSpacing: '0.5px'
                    }}>Main Menu</p>

                    {filteredMenu.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                borderRadius: 12, marginBottom: 4, textDecoration: 'none',
                                background: location.pathname === item.path ? '#2563eb' : 'transparent',
                                color: location.pathname === item.path ? '#fff' : (dm ? '#94a3b8' : '#64748b'),
                                fontWeight: 600, fontSize: 14, transition: '0.2s'
                            }}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div style={{ padding: 20, borderTop: `1px solid ${borderColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <Users size={20} color="#64748b" />
                            )}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: dm ? '#64748b' : '#94a3b8', textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px',
                            borderRadius: 10, border: 'none', background: dm ? '#333333' : '#f1f5f9',
                            color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: '0.2s'
                        }}
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ marginLeft: 260, flex: 1, padding: 32 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    background: 'none', border: `1px solid ${borderColor}`, borderRadius: 8,
                                    padding: 6, color: dm ? '#94a3b8' : '#64748b', cursor: 'pointer'
                                }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
                                {menuItems.find(i => i.path === location.pathname)?.name || 'Admin'}
                            </h2>
                        </div>

                        {user.college && (
                            <div style={{
                                background: '#2563eb11', color: '#2563eb', padding: '6px 14px',
                                borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid #2563eb33'
                            }}>
                                🏫 {user.college_name || 'My College'}
                            </div>
                        )}
                    </div>

                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
