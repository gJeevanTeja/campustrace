import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Building2,
    Shield,
    Users,
    MapPin,
    Layers,
    TrendingUp,
    LogOut,
    User,
    CheckSquare,
    Settings
} from 'lucide-react';

const AdminLayout = ({ children, darkMode }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isSuperAdmin = user?.role === 'super_admin';

    const menuItems = isSuperAdmin ? [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/super' },
        { icon: <Building2 size={20} />, label: 'Colleges', path: '/admin/colleges' },
        { icon: <Shield size={20} />, label: 'Admin Requests', path: '/admin/requests' },
        { icon: <Users size={20} />, label: 'Users', path: '/admin/users' },
        { icon: <MapPin size={20} />, label: 'Blocks', path: '/admin/blocks' },
        { icon: <Layers size={20} />, label: 'Categories', path: '/admin/categories' },
    ] : [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
        { icon: <Users size={20} />, label: 'Users', path: '/admin/users' },
        { icon: <Layers size={20} />, label: 'Categories', path: '/admin/categories' },
        { icon: <MapPin size={20} />, label: 'Blocks', path: '/admin/blocks' },
        { icon: <CheckSquare size={20} />, label: 'Resolutions', path: '/admin/resolutions' },
        { icon: <Settings size={20} />, label: 'College Info', path: '/admin/college-settings' },
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarBg = '#ffffff';
    const border = '#f1f5f9';
    const text = '#1e293b';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: text }}>
            <aside
                style={{
                    background: sidebarBg,
                    borderRight: `1px solid ${border}`,
                    width: '280px',
                    height: '100vh',
                    position: 'fixed',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 100
                }}
            >
                <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: '#2563eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
                    }}>
                        <Shield color="white" size={26} fill="white" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>Admin Panel</h1>
                </div>

                <div style={{ padding: '0 24px', marginBottom: 12, marginTop: 12 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Main Menu</p>
                </div>

                <nav style={{ padding: '0 16px', flex: 1, overflowY: 'auto' }}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '14px 16px',
                                borderRadius: 14,
                                textDecoration: 'none',
                                marginBottom: 6,
                                transition: 'all 0.2s ease',
                                background: isActive(item.path) ? '#2563eb' : 'transparent',
                                color: isActive(item.path) ? '#fff' : '#64748b',
                                fontWeight: 700,
                                boxShadow: isActive(item.path) ? '0 8px 20px rgba(37,99,235,0.15)' : 'none'
                            }}
                        >
                            {React.cloneElement(item.icon, { size: 20 })}
                            <span style={{ fontSize: 15 }}>{item.label}</span>
                        </Link>
                    ))}

                    {isSuperAdmin && (
                        <Link
                            to="/admin/analytics"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '14px 16px',
                                borderRadius: 14,
                                textDecoration: 'none',
                                marginTop: 6,
                                transition: 'all 0.2s ease',
                                background: isActive('/admin/analytics') ? '#2563eb' : 'transparent',
                                color: isActive('/admin/analytics') ? '#fff' : '#64748b',
                                fontWeight: 700,
                                boxShadow: isActive('/admin/analytics') ? '0 8px 20px rgba(37,99,235,0.15)' : 'none'
                            }}
                        >
                            <TrendingUp size={20} />
                            <span style={{ fontSize: 15 }}>Analytics (Global)</span>
                        </Link>
                    )}
                </nav>

                <div style={{ padding: '24px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 8px' }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <User size={22} color="#64748b" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.full_name || 'Jeevan Teja'}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                                {isSuperAdmin ? 'Super Admin' : 'Admin'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            borderRadius: 14,
                            border: 'none',
                            background: '#fef2f2',
                            color: '#ef4444',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontSize: 14,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main style={{ marginLeft: '280px', flex: 1, padding: '48px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
