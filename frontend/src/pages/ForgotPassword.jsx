import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Key, AlertTriangle, Mail, Send, ArrowLeft } from 'lucide-react';

const ForgotPassword = ({ darkMode }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const dm = darkMode;
  const colors = {
    bg: dm ? '#121212' : '#ffffff',
    text: dm ? '#e2e8f0' : '#1e1e1e',
    muted: dm ? '#94a3b8' : '#64748b',
    border: dm ? '#333333' : '#e2e8f0',
    input: dm ? '#121212' : '#f8fafc',
    accent: '#2563eb',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
      setMessage(data.message || 'Reset link sent! Check your email.');
    } catch (err) {
      const data = err.response?.data;
      // Backend returns { email: ["..."] } or { error: "..." } or { message: "..." }
      if (data?.email) setError(Array.isArray(data.email) ? data.email[0] : data.email);
      else if (data?.error) setError(data.error);
      else if (data?.message) setError(data.message);
      else setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: colors.bg, minHeight: '100vh', padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text, marginRight: 12, display: 'flex' }}><ArrowLeft size={22} /></button>
        <h2 style={{ fontWeight: 800, color: colors.accent, margin: 0 }}>CampusTrace</h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 60 }}>

        <div style={{ width: 70, height: 70, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, alignSelf: 'center', color: '#2563eb' }}>
          <Key size={34} />
        </div>

        <h3 style={{ fontWeight: 800, marginBottom: 8, textAlign: 'center', color: colors.text, fontSize: 22 }}>Forgot Password?</h3>
        <p style={{ color: colors.muted, fontSize: 14, marginBottom: 32, textAlign: 'center', lineHeight: 1.5 }}>
          Enter your email and we'll send you a reset link.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {message && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '16px', marginBottom: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 8, color: '#16a34a' }}><Mail size={32} /></div>
            <p style={{ color: '#16a34a', fontWeight: 600, margin: '0 0 4px', fontSize: 15 }}>{message}</p>
            <p style={{ color: '#16a34a', fontSize: 13, margin: 0 }}>Check your inbox and click the reset link.</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: '8px 0 0' }}>Didn't get it? Check your spam folder.</p>
            <button onClick={() => setMessage('')} style={{ marginTop: 12, background: 'none', border: '1px solid #16a34a', color: '#16a34a', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13 }}>
              Send again
            </button>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: colors.text }}>
                Email Address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                style={{ width: '100%', padding: '13px 16px', borderRadius: 12, boxSizing: 'border-box', border: `1.5px solid ${colors.border}`, background: colors.input, color: colors.text, fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#93c5fd' : colors.accent, color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Send size={18} className="animate-pulse" /> Sending...</> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ color: colors.accent, fontWeight: 600, textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
