import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminRequestAPI } from '../../services/api';
import { Shield, CheckCircle, Upload, Info } from 'lucide-react';

const AdminRequestForm = ({ darkMode: dm }) => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        college_name: '',
        designation: '',
        reason: ''
    });
    const [files, setFiles] = useState({
        college_id_card: null
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const bg = dm ? '#0f172a' : '#f8fafc';
    const card = dm ? '#1e293b' : '#ffffff';
    const text = dm ? '#f1f5f9' : '#1e293b';
    const border = dm ? '#334155' : '#e2e8f0';

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleFile = (e) => {
        const { name, files } = e.target;
        if (files[0]) {
            if (files[0].size > 5 * 1024 * 1024) {
                setError(`${name.replace(/_/g, ' ')} exists 5MB limit.`);
                return;
            }
            setFiles(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.college_id_card) {
            setError('Please upload your College ID card for verification.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([k, v]) => formData.append(k, v));
            formData.append('college_id_card', files.college_id_card);

            await adminRequestAPI.submitRequest(formData);
            setSubmitted(true);
        } catch (err) {
            const data = err.response?.data;
            if (typeof data === 'object' && data !== null) {
                // Get the first error message from the object (e.g., { email: ['error message'] })
                const firstValue = Object.values(data)[0];
                const msg = Array.isArray(firstValue) ? firstValue[0] : firstValue;
                setError(msg || 'Failed to submit request.');
            } else {
                setError('Server not reachable. Please check if the backend is running.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ maxWidth: 500, width: '100%', background: card, borderRadius: 24, padding: 40, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 80, height: 80, background: '#10b98120', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle size={40} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: text, marginBottom: 12 }}>Request Received!</h2>
                    <p style={{ color: dm ? '#94a3b8' : '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
                        Your verification details have been submitted. Our team will verify your identity and contact you via email once approved.
                    </p>
                    <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Back to Login</button>
                </div>
            </div>
        );
    }

    const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${border}`, background: dm ? '#0f172a' : '#f8fafc', color: text, fontSize: 14, outline: 'none' };
    const labelStyle = { display: 'block', fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 };

    return (
        <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div style={{ maxWidth: 650, width: '100%', background: card, borderRadius: 24, padding: 40, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <div style={{ width: 44, height: 44, background: '#2563eb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield color="white" size={24} /></div>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: text, margin: 0 }}>Request Admin Access</h2>
                        <p style={{ margin: 0, fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Complete verification to manage your college campus.</p>
                    </div>
                </div>

                {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fef2f2', color: '#ef4444', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input required name="full_name" value={form.full_name} onChange={handleChange} placeholder="Official name" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone Number *</label>
                            <input required name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="+91 00000 00000" style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={labelStyle}>Official Email *</label>
                            <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="name@college.edu" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Designation</label>
                            <input name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. IT Coordinator" style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>College Name *</label>
                        <input required name="college_name" value={form.college_name} onChange={handleChange} placeholder="Full University Name" style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: text, marginBottom: 12, borderBottom: `1px solid ${border}`, paddingBottom: 8 }}>Verification Documents</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 20 }}>
                        <div>
                            <label style={labelStyle}>College ID Card *</label>
                            <div style={{ position: 'relative' }}>
                                <input required type="file" name="college_id_card" onChange={handleFile} accept="image/*,.pdf" style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 10 }} />
                                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 10, background: files.college_id_card ? '#10b98110' : inputStyle.background }}>
                                    <Upload size={16} color={files.college_id_card ? '#10b981' : '#64748b'} />
                                    <span style={{ fontSize: 12, color: files.college_id_card ? '#10b981' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {files.college_id_card ? files.college_id_card.name : 'Upload ID Proof'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={labelStyle}>Reason for Request *</label>
                        <textarea required name="reason" value={form.reason} onChange={handleChange} placeholder="Why do you need admin access?" rows={3} style={{ ...inputStyle, resize: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 12, background: dm ? '#1e293b' : '#f1f5f9', padding: 16, borderRadius: 12, marginBottom: 24 }}>
                        <Info size={20} color="#2563eb" style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 12, color: dm ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>
                            Your identity proofs are stored securely and used only for verification purposes. Our head team will manually review your submission.
                        </p>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: 12,
                        background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: 16,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                    }}>
                        {loading ? 'Submitting Application...' : '🚀 Submit Verification Request'}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default AdminRequestForm;
