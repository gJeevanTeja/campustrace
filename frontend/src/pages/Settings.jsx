import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import BottomNav from '../components/BottomNav';
import { Moon, Bell, Volume2, Mail, Smartphone, Building2, ArrowLeft, LogOut } from 'lucide-react';

const Settings = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    notification_sound: true,
    email_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const dm = darkMode;
  const colors = {
    bg: dm ? '#121212' : '#f8fafc',
    card: dm ? '#1e1e1e' : '#ffffff',
    text: dm ? '#e2e8f0' : '#1e1e1e',
    muted: dm ? '#94a3b8' : '#64748b',
    border: dm ? '#2d2d2d' : '#e2e8f0',
    accent: '#3b82f6',
  };

  useEffect(() => {
    authAPI.getSettings()
      .then(res => { setSettings(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleToggle = async (key) => {
    // ✅ FIX: dark_mode syncs to global ThemeContext via setDarkMode prop
    if (key === 'dark_mode') {
      if (typeof setDarkMode === 'function') {
        setDarkMode(!darkMode);
      }
      // Also save to backend
      try { await authAPI.updateSettings({ dark_mode: !darkMode }); } catch { }
      return;
    }

    const newVal = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newVal }));
    setSaving(true);
    try {
      await authAPI.updateSettings({ [key]: newVal });
      showToast('Settings saved');
    } catch {
      setSettings(prev => ({ ...prev, [key]: !newVal })); // revert
      showToast('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ value, onToggle, disabled }) => (
    <div onClick={() => !disabled && onToggle()}
      style={{ width: 48, height: 26, borderRadius: 13, background: value ? colors.accent : (dm ? '#475569' : '#cbd5e1'), position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );

  const SettingRow = ({ icon, title, subtitle, value, onToggle, disabled }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${colors.border}`, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: dm ? '#2d2d2d' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: colors.text, fontSize: 14 }}>{title}</p>
          {subtitle && <p style={{ margin: 0, fontSize: 12, color: colors.muted, marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      <Toggle value={value} onToggle={onToggle} disabled={disabled} />
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: colors.muted }}>Loading settings...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, paddingBottom: 80 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1e1e1e', color: '#fff', padding: '10px 20px', borderRadius: 20, fontSize: 13, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ background: dm ? '#1e1e1e' : '#fff', padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text, padding: 0, display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} /></button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>Settings</h1>
        {saving && <span style={{ marginLeft: 'auto', fontSize: 12, color: colors.muted }}>Saving...</span>}
      </div>

      <div style={{ padding: '0 20px', maxWidth: 500, margin: '0 auto' }}>

        {/* Appearance */}
        <p style={{ color: colors.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 24, marginBottom: 4 }}>Appearance</p>
        <div style={{ background: colors.card, borderRadius: 16, padding: '0 16px', boxShadow: dm ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* ✅ FIX: dark mode value comes from prop, not local settings state */}
          <SettingRow icon={<Moon size={20} />} title="Dark Mode" subtitle="Switch between light and dark theme"
            value={darkMode}
            onToggle={() => handleToggle('dark_mode')} />
        </div>

        {/* Notifications */}
        <p style={{ color: colors.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 24, marginBottom: 4 }}>Notifications</p>
        <div style={{ background: colors.card, borderRadius: 16, padding: '0 16px', boxShadow: dm ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
          <SettingRow icon={<Bell size={20} />} title="Push Notifications" subtitle="Receive alerts for new items and claims"
            value={settings.notifications_enabled} onToggle={() => handleToggle('notifications_enabled')} />
          <SettingRow icon={<Volume2 size={20} />} title="Notification Sound" subtitle="Play sound when notifications arrive"
            value={settings.notification_sound} onToggle={() => handleToggle('notification_sound')}
            disabled={!settings.notifications_enabled} />
          <SettingRow icon={<Mail size={20} />} title="Email Notifications" subtitle="Get email alerts for important updates"
            value={settings.email_notifications} onToggle={() => handleToggle('email_notifications')} />
        </div>

        {/* About */}
        <p style={{ color: colors.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 24, marginBottom: 4 }}>About</p>
        <div style={{ background: colors.card, borderRadius: 16, padding: '0 16px', boxShadow: dm ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
          {[{ icon: <Smartphone size={20} />, label: 'App Version', value: '1.0.0' }, { icon: <Building2 size={20} />, label: 'CampusTrace', value: 'Lost & Found Portal' }].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i === 0 ? `1px solid ${colors.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: dm ? '#2d2d2d' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{item.icon}</div>
                <p style={{ margin: 0, fontWeight: 600, color: colors.text, fontSize: 14 }}>{item.label}</p>
              </div>
              <span style={{ fontSize: 13, color: colors.muted }}>{item.value}</span>
            </div>
          ))}
        </div>

        <button onClick={() => { localStorage.clear(); navigate('/login'); }}
          style={{ width: '100%', marginTop: 24, padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#dc2626', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      <BottomNav darkMode={dm} />
    </div>
  );
};

export default Settings;