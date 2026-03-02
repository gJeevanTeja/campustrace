import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, GraduationCap, Moon, Sun, MapPin } from 'lucide-react';

const AuthLanding = ({ darkMode: dm, setDarkMode }) => {
    const navigate = useNavigate();

    const bg = dm ? '#121212' : '#f0f4ff';
    const card = dm ? '#1e1e1e' : '#ffffff';
    const text = dm ? '#e2e8f0' : '#1e1e1e';
    const muted = dm ? '#94a3b8' : '#64748b';
    const border = dm ? '#333333' : '#e2e8f0';

    const cardStyle = {
        background: card,
        borderRadius: 24,
        padding: '32px',
        border: `1.5px solid ${border}`,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        backdropFilter: 'blur(0px)',
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
            padding: '24px 16px',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            <style>
                {`
                    @keyframes popInSoft {
                        0% { opacity: 0; transform: translateY(20px) scale(0.96); }
                        70% { opacity: 1; transform: translateY(-3px) scale(1.01); }
                        100% { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .animate-bounce-in-1 {
                        animation: popInSoft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                        opacity: 0;
                        animation-delay: 0.05s;
                    }
                    .animate-bounce-in-2 {
                        animation: popInSoft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                        opacity: 0;
                        animation-delay: 0.15s;
                    }
                    .animate-bounce-in-3 {
                        animation: popInSoft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                        opacity: 0;
                        animation-delay: 0.25s;
                    }
                    .animate-bounce-in-4 {
                        animation: popInSoft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                        opacity: 0;
                        animation-delay: 0.35s;
                    }
                `}
            </style>
            {/* Dark Mode Toggle */}
            <button
                onClick={() => setDarkMode(!dm)}
                style={{
                    position: 'absolute',
                    top: 24,
                    right: 24,
                    background: card,
                    border: `1.5px solid ${border}`,
                    color: text,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                    zIndex: 10
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title={dm ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {dm ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="animate-bounce-in-1" style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{
                    width: 80, height: 80, borderRadius: 20,
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(37,99,235,0.3)'
                }}>
                    <MapPin size={40} color="#ffffff" strokeWidth={2.5} />
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: text, margin: '0 0 10px' }}>CampusTrace</h1>
                <p style={{ color: muted, fontSize: 16, maxWidth: 400 }}>Choose your portal to track lost items across your university</p>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column', // Force column on mobile via style, or keep window check if preferred. The simplest mobile-first fix is flex-wrap or column. Let's use wrap with max-width.
                gap: 24,
                width: '100%',
                maxWidth: 640,
                justifyContent: 'center'
            }}>
                {/* Student Portal */}
                <div
                    className="animate-bounce-in-2"
                    onClick={() => navigate('/login')}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        e.currentTarget.style.background = dm
                            ? `radial-gradient(circle at ${x}px ${y}px, rgba(37, 99, 235, 0.4) 0%, rgba(30, 41, 59, 0.7) 50%)`
                            : `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.6) 40%)`;
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)';
                        e.currentTarget.style.boxShadow = '0 25px 50px rgba(37, 99, 235, 0.15)';
                        e.currentTarget.style.backdropFilter = 'blur(16px)';
                        e.currentTarget.style.WebkitBackdropFilter = 'blur(16px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = border;
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                        e.currentTarget.style.background = card;
                        e.currentTarget.style.backdropFilter = 'blur(0px)';
                        e.currentTarget.style.WebkitBackdropFilter = 'blur(0px)';
                    }}
                    style={{ ...cardStyle, maxWidth: '100%', overflow: 'hidden' }}
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
                    className="animate-bounce-in-3"
                    onClick={() => navigate('/login')} // We can modify login to handle both or have /admin/login
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        e.currentTarget.style.background = dm
                            ? `radial-gradient(circle at ${x}px ${y}px, rgba(124, 58, 237, 0.4) 0%, rgba(30, 41, 59, 0.7) 50%)`
                            : `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.6) 40%)`;
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)';
                        e.currentTarget.style.boxShadow = '0 25px 50px rgba(124, 58, 237, 0.15)';
                        e.currentTarget.style.backdropFilter = 'blur(16px)';
                        e.currentTarget.style.WebkitBackdropFilter = 'blur(16px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = border;
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                        e.currentTarget.style.background = card;
                        e.currentTarget.style.backdropFilter = 'blur(0px)';
                        e.currentTarget.style.WebkitBackdropFilter = 'blur(0px)';
                    }}
                    style={{ ...cardStyle, maxWidth: '100%', overflow: 'hidden' }}
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

            <div className="animate-bounce-in-4" style={{ marginTop: 48, fontSize: 14, color: muted, textAlign: 'center', width: '100%', paddingBottom: '30px' }}>
                Need to register your university? <span
                    onClick={() => navigate('/admin/signup')}
                    style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >Click here</span>
            </div>
        </div>
    );
};

export default AuthLanding;
