import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ResetPassword = ({ darkMode }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token,           setToken]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [message,         setMessage]         = useState('');
  const [error,           setError]           = useState('');
  const [showPwd,         setShowPwd]         = useState(false);

  const dm = darkMode;
  const colors = {
    bg:     dm ? '#121212' : '#ffffff',
    text:   dm ? '#e2e8f0' : '#1e1e1e',
    muted:  dm ? '#94a3b8' : '#64748b',
    border: dm ? '#2d2d2d' : '#e2e8f0',
    input:  dm ? '#1e1e1e' : '#f8fafc',
    accent: '#2563eb',
  };

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) { setError('Invalid or missing reset token. Please request a new link.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      // Backend expects: { token, new_password, confirm_password }
      const { data } = await authAPI.resetPassword({ token, new_password: password, confirm_password: confirmPassword });
      setMessage(data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const data = err.response?.data;
      if (data?.error)           setError(data.error);
      else if (data?.message)    setError(data.message);
      else if (data?.new_password) setError(Array.isArray(data.new_password) ? data.new_password[0] : data.new_password);
      else setError('Reset failed. The link may have expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12, boxSizing: 'border-box',
    border: `1.5px solid ${colors.border}`, background: colors.input,
    color: colors.text, fontSize: 15, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ background: colors.bg, minHeight: '100vh', padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: colors.text, marginRight: 12 }}>←</button>
        <h2 style={{ fontWeight: 800, color: colors.accent, margin: 0 }}>CampusTrace</h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 60 }}>

        <div style={{ width: 70, height: 70, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 24, alignSelf: 'center' }}>
          🔒
        </div>

        <h3 style={{ fontWeight: 800, marginBottom: 8, textAlign: 'center', color: colors.text, fontSize: 22 }}>Set New Password</h3>
        <p style={{ color: colors.muted, fontSize: 14, marginBottom: 32, textAlign: 'center' }}>
          Enter your new password below.
        </p>

        {!token && !message && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#d97706', fontSize: 14 }}>
            ⚠️ No reset token found. Please use the link from your email.
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '16px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ color: '#16a34a', fontWeight: 600, margin: 0 }}>{message}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: '8px 0 0' }}>Redirecting to login...</p>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: colors.text }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: colors.text }}>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password" required style={inputStyle} />
            </div>

            <button type="submit" disabled={loading || !token}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: (loading || !token) ? '#93c5fd' : colors.accent, color: '#fff', fontSize: 16, fontWeight: 700, cursor: (loading || !token) ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Resetting...' : '🔒 Reset Password'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ color: colors.accent, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;