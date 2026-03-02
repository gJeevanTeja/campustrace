import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Building2, Mail, Lock, User, ShieldCheck, Globe, Phone } from 'lucide-react';

const AdminSignup = ({ darkMode: dm }) => {
    const [form, setForm] = useState({
        college_name: '',
        email_domain: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        admin_secret_key: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const bg = dm ? '#121212' : '#f8fafc';
    const card = dm ? '#1e1e1e' : '#ffffff';
    const text = dm ? '#e2e8f0' : '#1e1e1e';
    const muted = dm ? '#94a3b8' : '#64748b';
    const border = dm ? '#333333' : '#e2e8f0';
    const inp = dm ? '#121212' : '#f8fafc';

    const inputStyle = {
        width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12,
        border: `1.5px solid ${border}`, background: inp, color: text,
        fontSize: 14, outline: 'none', boxSizing: 'border-box'
    };

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'email_domain') {
            value = value.replace('@', '').toLowerCase().trim();
        }
        setForm({ ...form, [e.target.name]: value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { data } = await adminAPI.registerAdmin(form);
            // Auto login after registration
            localStorage.setItem('access_token', data.tokens.access);
            localStorage.setItem('refresh_token', data.tokens.refresh);
            window.location.href = '/admin';
        } catch (err) {
            const data = err.response?.data;
            let msg = 'Registration failed. Please try again.';

            if (data) {
                console.error('[AdminSignup Error Data]:', data);
                if (data.message) msg = data.message;
                else if (data.error) msg = data.error;
                else if (typeof data === 'object') {
                    // Extract first error from DRF validation dictionary
                    const firstKey = Object.keys(data)[0];
                    const firstError = data[firstKey];
                    msg = Array.isArray(firstError) ? firstError[0] : (typeof firstError === 'string' ? firstError : msg);
                }
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
            <div style={{ width: '100%', maxWidth: 500, background: card, borderRadius: 24, padding: '36px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <ShieldCheck color="white" size={32} />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: text, margin: 0 }}>CampusTrace Admin</h1>
                    <p style={{ color: muted, fontSize: 14, marginTop: 4 }}>Register your college and setup administrator access</p>
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px', marginBottom: 20, color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 6 }}>College Name</label>
                            <div style={{ position: 'relative' }}>
                                <Building2 size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
                                <input name="college_name" value={form.college_name} onChange={handleChange} placeholder="e.g. Stanford University" required style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 6 }}>Email Domain</label>
                            <div style={{ position: 'relative' }}>
                                <Globe size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
                                <input name="email_domain" value={form.email_domain} onChange={handleChange} placeholder="e.g. stanford.edu" required style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 6 }}>Administrator Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
                            <input name="name" value={form.name} onChange={handleChange} placeholder="Full legal name" required style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 6 }}>Admin Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
                                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@domain.edu" required style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 6 }}>Phone Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
                                <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" required style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 6 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
                                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 6 }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
                                <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} placeholder="••••••••" required style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 24, padding: 16, background: dm ? '#121212' : '#f1f5f9', borderRadius: 12, border: `1.5px dashed ${border}` }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>Activation Key Required</label>
                        <div style={{ position: 'relative' }}>
                            <ShieldCheck size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} />
                            <input
                                name="admin_secret_key"
                                type="password"
                                value={form.admin_secret_key}
                                onChange={handleChange}
                                placeholder="Enter system activation key"
                                required
                                style={{ ...inputStyle, border: '1.5px solid #2563eb', background: dm ? '#1e1e1e' : '#fff' }}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                        {loading ? '⏳ Processing...' : '🚀 Initialize College Admin'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, color: muted, fontSize: 14 }}>
                    Already have an account? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default AdminSignup;
