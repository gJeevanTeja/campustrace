import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { MapPin, Lock, Smartphone, AlertTriangle, CheckCircle2, Mail, Eye, EyeOff, Loader2, Send } from 'lucide-react';

const Login = ({ darkMode: dm }) => {
  const [tab, setTab] = useState('password'); // 'password' | 'otp'
  const [form, setForm] = useState({ email: '', password: '' });
  const [otpId, setOtpId] = useState('');
  const [otpType, setOtpType] = useState('email');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Prevent double-submit ─────────────────────────────────────
  const submittingRef = useRef(false);

  const { login } = useAuth();

  // Clear error when user starts typing
  useEffect(() => { setError(''); }, [form.email, form.password, otpId, otpCode]);

  // Colors
  const bg = dm ? '#121212' : '#f0f4ff';
  const card = dm ? '#1e1e1e' : '#ffffff';
  const text = dm ? '#e2e8f0' : '#1e1e1e';
  const muted = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#2d2d2d' : '#e2e8f0';
  const inp = dm ? '#121212' : '#f8fafc';

  const redirectAfterLogin = (user) => {
    if (['super_admin', 'college_admin', 'moderator'].includes(user?.role)) {
      window.location.href = '/admin';
    } else {
      window.location.href = '/';
    }
  };

  const inputBase = {
    width: '100%', padding: '13px 16px 13px 44px', borderRadius: 12,
    border: `1.5px solid ${border}`, background: inp, color: text,
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
    WebkitBoxShadow: `0 0 0px 1000px ${inp} inset`,
    WebkitTextFillColor: text,
  };

  // ── Password login ────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;   // block double-submit
    submittingRef.current = true;

    setError('');
    setLoading(true);
    try {
      const data = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      redirectAfterLogin(data.user);
    } catch (err) {
      // Network error — backend unreachable
      if (!err.response) {
        setError(
          `Cannot reach server at ${process.env.REACT_APP_API_IP || 'localhost'}:8000. ` +
          'Make sure Django is running.'
        );
        return;
      }
      const d = err.response?.data;
      // Handle all possible Django error shapes
      const msg =
        d?.detail ||
        d?.message ||
        d?.non_field_errors?.[0] ||
        d?.email?.[0] ||
        d?.password?.[0] ||
        'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // ── OTP send ──────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    setError(''); setSuccess(''); setLoading(true);
    try {
      await authAPI.sendOTP({ identifier: otpId.trim(), otp_type: otpType });
      setOtpSent(true);
      setSuccess(`OTP sent to your ${otpType}! Expires in 5 minutes.`);
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Make sure Django is running.');
        return;
      }
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // ── OTP verify ────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    setError(''); setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({
        identifier: otpId.trim(),
        otp_code: otpCode.trim(),
      });
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      redirectAfterLogin(data.user);
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Make sure Django is running.');
        return;
      }
      setError(err.response?.data?.error || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // ── Google sign-in ────────────────────────────────────────────
  const handleGoogle = () => {
    const load = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: async (res) => {
          try {
            const p = JSON.parse(atob(res.credential.split('.')[1]));
            const { data } = await authAPI.googleAuth({
              google_id: p.sub,
              email: p.email,
              name: p.name,
              picture: p.picture,
              google_token: res.credential,
            });
            localStorage.setItem('access_token', data.tokens.access);
            localStorage.setItem('refresh_token', data.tokens.refresh);
            redirectAfterLogin(data.user);
          } catch (err) {
            setError(err.response?.data?.error || 'Google sign-in failed.');
          }
        },
      });
      window.google.accounts.id.prompt();
    };
    if (!window.google) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.onload = load;
      document.head.appendChild(s);
    } else {
      load();
    }
  };

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setOtpSent(false);
    setSuccess('');
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: card, borderRadius: 24, padding: '36px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(37,99,235,0.3)', color: '#fff' }}>
            <MapPin size={32} />
          </div>
          <h2 style={{ fontWeight: 800, color: text, margin: '0 0 3px', fontSize: 22 }}>CampusTrace</h2>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>Secure access to your university portal</p>
          <div style={{ marginTop: 12 }}>
            <Link to="/welcome" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>← Switch Role (Student/Staff)</Link>
          </div>
        </div>

        {/* Tab Switch */}
        <div style={{ display: 'flex', background: dm ? '#121212' : '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {[{ id: 'password', icon: <Lock size={16} />, label: 'Password' }, { id: 'otp', icon: <Smartphone size={16} />, label: 'OTP Login' }].map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)}
              style={{
                flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, transition: 'all .2s',
                background: tab === t.id ? card : 'transparent',
                color: tab === t.id ? '#2563eb' : muted,
                boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,.10)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
              {t.icon} {t.label}</button>
          ))}
        </div>

        <h4 style={{ fontWeight: 700, margin: '0 0 4px', color: text }}>Welcome back</h4>
        <p style={{ color: muted, fontSize: 13, margin: '0 0 18px' }}>Sign in to continue</p>

        {/* Alerts */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: '11px 14px', marginBottom: 14, color: '#dc2626', fontSize: 14 }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 12, padding: '11px 14px', marginBottom: 14, color: '#16a34a', fontSize: 14 }}>
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        {/* ── Password Tab ── */}
        {tab === 'password' && (
          <form onSubmit={handleLogin} autoComplete="off">
            {/* honeypot defeats autofill */}
            <input type="text" style={{ display: 'none' }} autoComplete="username" />
            <input type="password" style={{ display: 'none' }} autoComplete="new-password" />

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 6, display: 'block' }}>University Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted, display: 'flex' }}><Mail size={16} /></span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="name@university.edu"
                  required
                  autoComplete="off"
                  style={inputBase}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: text }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>Forgot?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted, display: 'flex' }}><Lock size={16} /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  readOnly
                  onFocus={e => e.target.removeAttribute('readOnly')}
                  style={{ ...inputBase, paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: muted, display: 'flex' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── OTP: Enter identifier ── */}
        {tab === 'otp' && !otpSent && (
          <form onSubmit={handleSendOTP}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[{ id: 'email', icon: <Mail size={16} />, label: 'Email' }, { id: 'phone', icon: <Smartphone size={16} />, label: 'Phone' }].map(t => (
                <button key={t.id} type="button" onClick={() => setOtpType(t.id)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${otpType === t.id ? '#2563eb' : border}`, background: otpType === t.id ? (dm ? '#2d2d2d' : '#eff6ff') : inp, color: otpType === t.id ? '#2563eb' : muted, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: text, display: 'block', marginBottom: 6 }}>
                {otpType === 'email' ? 'Registered Email' : 'Registered Phone (10 digits)'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted, display: 'flex' }}>
                  {otpType === 'email' ? <Mail size={16} /> : <Smartphone size={16} />}
                </span>
                <input
                  value={otpId}
                  onChange={e => setOtpId(e.target.value)}
                  placeholder={otpType === 'email' ? 'you@email.com' : '9876543210'}
                  required
                  style={inputBase}
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : <><Send size={18} /> Send OTP</>}
            </button>
          </form>
        )}

        {/* ── OTP: Enter code ── */}
        {tab === 'otp' && otpSent && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: text }}><Mail size={44} strokeWidth={1.5} /></div>
              <p style={{ fontWeight: 600, color: text, margin: '0 0 4px' }}>Enter the 6-digit OTP</p>
              <p style={{ color: muted, fontSize: 13, margin: 0 }}>Sent to {otpId}</p>
            </div>
            <input
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              style={{ ...inputBase, paddingLeft: 16, textAlign: 'center', fontSize: 28, fontWeight: 800, letterSpacing: 14, marginBottom: 16 }}
            />
            <button type="submit" disabled={loading || otpCode.length !== 6}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: otpCode.length === 6 ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : '#94a3b8', color: '#fff', fontSize: 15, fontWeight: 700, cursor: otpCode.length === 6 ? 'pointer' : 'not-allowed', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <><CheckCircle2 size={18} /> Verify & Login</>}
            </button>
            <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); setSuccess(''); }}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: `1.5px solid ${border}`, background: 'none', color: muted, fontSize: 14, cursor: 'pointer' }}>
              ← Change {otpType}
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: border }} />
          <span style={{ color: muted, fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: border }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          style={{ width: '100%', padding: '13px', borderRadius: 12, border: `1.5px solid ${border}`, background: card, color: text, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.84c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: 14, color: muted }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Create an account</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: muted }}>© 2025 CAMPUSTRACE SYSTEMS</p>
      </div>
    </div>
  );
};

export default Login;