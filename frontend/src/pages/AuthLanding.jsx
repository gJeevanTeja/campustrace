import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, GraduationCap } from 'lucide-react';

const AuthLanding = ({ darkMode: dm }) => {
    const navigate = useNavigate();

    const bg = dm ? '#0f172a' : '#f0f4ff';
    const card = dm ? '#1e293b' : '#ffffff';
    const text = dm ? '#e2e8f0' : '#1e293b';
    const muted = dm ? '#94a3b8' : '#64748b';
    const border = dm ? '#334155' : '#e2e8f0';

    const cardStyle = {
        background: card,
        borderRadius: 24,
        padding: '32px',
        border: `1.5px solid ${border}`,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        width: '100%',
        maxWidth: 300
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{
                    width: 80, height: 80, borderRadius: 20,
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(37,99,235,0.3)'
                }}>
                    <span style={{ fontSize: 40 }}>📍</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: text, margin: '0 0 10px' }}>CampusTrace</h1>
                <p style={{ color: muted, fontSize: 16, maxWidth: 400 }}>Choose your portal to track lost items across your university</p>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                gap: 24,
                width: '100%',
                justifyContent: 'center'
            }}>
                {/* Student Portal */}
                <div
                    onClick={() => navigate('/login')}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(37,99,235,0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = border;
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                    }}
                    style={cardStyle}
                >
                    <div style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: '#2563eb15', color: '#2563eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <GraduationCap size={32} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: text, margin: '0 0 8px' }}>Student Portal</h3>
                        <p style={{ fontSize: 14, color: muted, margin: 0 }}>Report lost items or claim found ones within your campus</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb', fontWeight: 700, fontSize: 14, marginTop: 8 }}>
                        Get Started <ArrowRight size={16} />
                    </div>
                </div>

                {/* Admin Portal */}
                <div
                    onClick={() => navigate('/login')} // We can modify login to handle both or have /admin/login
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.borderColor = '#7c3aed';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(124,58,237,0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = border;
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                    }}
                    style={cardStyle}
                >
                    <div style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: '#7c3aed15', color: '#7c3aed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: text, margin: '0 0 8px' }}>Admin Portal</h3>
                        <p style={{ fontSize: 14, color: muted, margin: 0 }}>Manage campus data, locations, and oversee security operations</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7c3aed', fontWeight: 700, fontSize: 14, marginTop: 8 }}>
                        Access Panel <ArrowRight size={16} />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 48, fontSize: 14, color: muted }}>
                Need to register your university? <span
                    onClick={() => navigate('/admin/request')}
                    style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >Click here</span>
            </div>
        </div>
    );
};

export default AuthLanding;
