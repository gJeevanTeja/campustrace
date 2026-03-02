import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Electronics & Communication', 'Information Technology',
  'Chemical Engineering', 'Biotechnology', 'MBA', 'Other'
];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const Signup = ({ darkMode: dm }) => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', department: '',
    section: '', college_year: '', college_name: '', password: '', confirm_password: '',
    terms_accepted: false,
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(''); // ''|'checking'|'available'|'taken'
  const usernameTimer = useRef(null);

  const bg = dm ? '#0f172a' : 'linear-gradient(135deg,#eff6ff 0%,#f0fdf4 100%)';
  const card = dm ? '#1e293b' : '#ffffff';
  const text = dm ? '#e2e8f0' : '#1e293b';
  const muted = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#334155' : '#e2e8f0';
  const inp = dm ? '#0f172a' : '#f8fafc';

  const inputStyle = (field) => ({
    width: '100%', padding: '12px 16px', borderRadius: 12, boxSizing: 'border-box',
    border: `1.5px solid ${errors[field] ? '#ef4444' : border}`,
    background: errors[field] ? (dm ? '#2d1515' : '#fff5f5') : inp,
    color: text, fontSize: 14, outline: 'none',
    WebkitBoxShadow: `0 0 0px 1000px ${errors[field] ? (dm ? '#2d1515' : '#fff5f5') : inp} inset`,
    WebkitTextFillColor: text,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setGlobalError('');
  };

  const handlePhone = (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm(p => ({ ...p, phone: d }));
    if (errors.phone) setErrors(p => ({ ...p, phone: '' }));
  };

  // Real-time username check
  const handleUsername = (e) => {
    const val = e.target.value.replace(/\s/g, '').slice(0, 20);
    setForm(p => ({ ...p, username: val }));
    if (errors.username) setErrors(p => ({ ...p, username: '' }));
    clearTimeout(usernameTimer.current);
    if (val.length < 3) { setUsernameStatus(''); return; }
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      try {
        const { data } = await authAPI.checkUsername(val);
        setUsernameStatus(data.available ? 'available' : 'taken');
        if (!data.available) setErrors(p => ({ ...p, username: 'Username already taken. Try another.' }));
        else setErrors(p => ({ ...p, username: '' }));
      } catch { setUsernameStatus(''); }
    }, 500);
  };



  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Full name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) e.name = 'Name can only contain letters and spaces';
    if (form.username && form.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (usernameStatus === 'taken') e.username = 'Username already taken. Try another.';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.phone.length !== 10) e.phone = 'Phone must be exactly 10 digits';
    else if (!'6789'.includes(form.phone[0])) e.phone = 'Enter a valid Indian mobile number (starts with 6-9)';
    if (!form.department) e.department = 'Please select a department';
    if (!form.section.trim()) e.section = 'Section is required';
    if (!form.college_name.trim()) e.college_name = 'Please type your college name';
    if (!form.college_year) e.college_year = 'Please select a year';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Password needs at least one uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Password needs at least one number';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    if (!form.terms_accepted) e.terms_accepted = 'You must accept the Terms and Conditions';

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(''); setErrors({});
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setLoading(true);
    try {
      const payload = { ...form, email: form.email.trim().toLowerCase(), phone: `+91${form.phone}`, terms_accepted: true };
      await register(payload);
      navigate('/');
    } catch (err) {
      const d = err.response?.data;
      if (d?.message) { setGlobalError(d.message); return; }
      if (d && typeof d === 'object') {
        const fe = {};
        Object.entries(d.errors || d).forEach(([k, v]) => {
          const msg = Array.isArray(v) ? v[0] : String(v);
          const known = ['name', 'username', 'email', 'phone', 'department', 'section', 'college_year', 'college_name', 'password', 'confirm_password', 'terms_accepted'];
          if (known.includes(k)) fe[k] = msg;
          else if (['non_field_errors', 'detail'].includes(k)) setGlobalError(Array.isArray(v) ? v[0] : String(v));
        });
        if (Object.keys(fe).length) { setErrors(fe); return; }
      }
      setGlobalError('Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  // Google sign-up
  const handleGoogle = () => {
    const load = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: async (res) => {
          try {
            const p = JSON.parse(atob(res.credential.split('.')[1]));
            const { data } = await authAPI.googleAuth({ google_id: p.sub, email: p.email, name: p.name, picture: p.picture, google_token: res.credential });
            localStorage.setItem('access_token', data.tokens.access);
            localStorage.setItem('refresh_token', data.tokens.refresh);
            window.location.href = '/';
          } catch (err) { setGlobalError(err.response?.data?.error || 'Google sign-up failed.'); }
        },
      });
      window.google.accounts.id.prompt();
    };
    if (!window.google) { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.onload = load; document.head.appendChild(s); } else { load(); }
  };

  const uIcon = usernameStatus === 'available' ? '✅' : usernameStatus === 'taken' ? '❌' : usernameStatus === 'checking' ? '⏳' : '';

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
      <div style={{ width: '100%', maxWidth: 460, background: card, borderRadius: 24, padding: '32px 28px', boxShadow: '0 8px 40px rgba(0,0,0,.10)' }}>

        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, marginBottom: 18, padding: 0, fontSize: 14 }}>← Back</button>

        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e40af', margin: 0 }}>CampusTrace</h1>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: text, margin: '6px 0 3px' }}>Create your account</h2>
          <p style={{ color: muted, fontSize: 14, margin: '0 0 10px' }}>Join our campus community today.</p>
          <Link to="/welcome" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>← Switch Role (Student/Staff)</Link>
        </div>

        {/* Google sign-up */}
        <button onClick={handleGoogle}
          style={{ width: '100%', padding: '13px', borderRadius: 12, border: `1.5px solid ${border}`, background: card, color: text, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign up with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: border }} /><span style={{ color: muted, fontSize: 13 }}>or</span><div style={{ flex: 1, height: 1, background: border }} />
        </div>

        {globalError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '11px 14px', marginBottom: 14, color: '#dc2626', fontSize: 14 }}>⚠️ {globalError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          {/* Kill autofill */}
          <input type="text" style={{ display: 'none' }} autoComplete="username" />
          <input type="password" style={{ display: 'none' }} autoComplete="new-password" />

          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>Full Name *</label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="Enter your full name" autoComplete="off" style={inputStyle('name')} />
            {errors.name && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
          </div>

          {/* Username — optional, with live check */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>
              Username <span style={{ color: muted, fontWeight: 400, fontSize: 12 }}>(optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input value={form.username} onChange={handleUsername} placeholder="e.g. john_doe"
                autoComplete="off"
                style={{ ...inputStyle('username'), paddingRight: 36 }} />
              {uIcon && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>{uIcon}</span>}
            </div>
            {usernameStatus === 'available' && form.username && <p style={{ color: '#16a34a', fontSize: 12, marginTop: 4 }}>✅ Username is available!</p>}
            {errors.username && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.username}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>University Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="you@university.edu" autoComplete="off" style={inputStyle('email')} />
            {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
          </div>

          {/* Phone — +91 prefix with counter */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>
              Phone Number * <span style={{ color: muted, fontWeight: 400, fontSize: 12 }}>(10 digits, India)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${errors.phone ? '#ef4444' : border}`, borderRadius: 12, background: errors.phone ? (dm ? '#2d1515' : '#fff5f5') : inp, overflow: 'hidden' }}>
              <span style={{ padding: '12px 10px 12px 14px', fontWeight: 700, fontSize: 14, borderRight: `1px solid ${border}`, background: dm ? '#1e293b' : '#f1f5f9', whiteSpace: 'nowrap', color: text }}>🇮🇳 +91</span>
              <input value={form.phone} onChange={handlePhone} placeholder="9876543210"
                maxLength={10} inputMode="numeric" autoComplete="off"
                style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px 14px', fontSize: 14, outline: 'none', color: text }} />
              {form.phone.length > 0 && (
                <span style={{ padding: '0 12px', fontSize: 12, color: form.phone.length === 10 ? '#16a34a' : '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {form.phone.length}/10
                </span>
              )}
            </div>
            {errors.phone && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
          </div>

          {/* College Selection */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>College / University *</label>
            <input name="college_name" value={form.college_name} onChange={handleChange}
              placeholder="e.g. Malla Reddy University" autoComplete="organization" style={inputStyle('college_name')} />
            {errors.college_name && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.college_name}</p>}
          </div>

          {/* Department */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>Department *</label>
            <select name="department" value={form.department} onChange={handleChange}
              style={{ ...inputStyle('department'), appearance: 'none', cursor: 'pointer' }}>
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.department}</p>}
          </div>

          {/* Section + Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>Section *</label>
              <input name="section" value={form.section} onChange={handleChange}
                placeholder="e.g. Beta" autoComplete="off" style={inputStyle('section')} />
              {errors.section && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.section}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>Year *</label>
              <select name="college_year" value={form.college_year} onChange={handleChange}
                style={{ ...inputStyle('college_year'), appearance: 'none', cursor: 'pointer' }}>
                <option value="">Select Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.college_year && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.college_year}</p>}
            </div>
          </div>

          {/* Password — autofill disabled */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>
              Password * <span style={{ color: muted, fontWeight: 400, fontSize: 12 }}>(8+ chars, 1 uppercase, 1 number)</span>
            </label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              readOnly onFocus={e => e.target.removeAttribute('readOnly')}
              style={inputStyle('password')} />
            {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, color: text, marginBottom: 5, fontSize: 14 }}>Confirm Password *</label>
            <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              readOnly onFocus={e => e.target.removeAttribute('readOnly')}
              style={inputStyle('confirm_password')} />
            {errors.confirm_password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.confirm_password}</p>}
          </div>

          {/* Terms */}
          <div style={{ marginBottom: 20, padding: 14, background: dm ? '#0f172a' : '#f8fafc', borderRadius: 12, border: `1.5px solid ${errors.terms_accepted ? '#ef4444' : border}` }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" name="terms_accepted" checked={form.terms_accepted} onChange={handleChange}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: '#2563eb', flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: text, lineHeight: 1.5 }}>
                I accept the{' '}
                <Link to="/terms" target="_blank" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Terms &amp; Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>.
                By registering, I confirm I am a member of this campus community.
              </span>
            </label>
            {errors.terms_accepted && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.terms_accepted}</p>}
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#93c5fd' : 'linear-gradient(135deg,#1e40af,#3b82f6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '⏳ Creating Account...' : '🎓 Create Account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 18, color: muted, fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#1e40af', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;