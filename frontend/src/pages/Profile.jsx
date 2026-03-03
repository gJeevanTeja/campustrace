import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, itemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Tag, BookOpen, Building, GraduationCap, Smartphone, Mail, Camera, Image as ImageIcon, Loader2, Lock, Pencil, ClipboardList, CheckCircle, Trash2, Key, BarChart3, Bell, ScrollText, LogOut, Heart } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const Profile = ({ darkMode: dm }) => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { setDarkMode } = useTheme();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [claimedItems, setClaimedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm_new_password: '' });
  const [pwdError, setPwdError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('posted');
  const fileGalleryRef = useRef(null);
  const fileCameraRef = useRef(null);

  const bg = dm ? '#121212' : '#f8fafc';
  const card = dm ? '#1e1e1e' : '#ffffff';
  const text = dm ? '#e2e8f0' : '#1a1a1a';
  const muted = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#333333' : '#e8ecf0';
  const inp = dm ? '#121212' : '#f8fafc';

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, iRes] = await Promise.all([
          authAPI.getProfile(),
          itemsAPI.getMyItems(),
        ]);
        setProfile(pRes.data);
        const items = Array.isArray(iRes.data) ? iRes.data : (iRes.data.results || []);
        setMyItems(items);
        setClaimedItems(items.filter(i => i.status === 'claimed' && i.claimed_by));
      } catch {
        setProfile(user || {});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Delete item from profile list ────────────────────────────
  const handleDeleteItem = async (e, itemId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      await itemsAPI.delete(itemId);
      setMyItems(prev => prev.filter(i => i.id !== itemId));
      setClaimedItems(prev => prev.filter(i => i.id !== itemId));
      showToast('Item deleted ✓');
    } catch {
      showToast('Failed to delete item', true);
    }
  };

  // ── Avatar upload ─────────────────────────────────────────────
  const handleAvatarUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', true); return; }
    setAvatarLoading(true);
    setShowPhotoMenu(false);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await authAPI.updateAvatar(formData);
      const url = data.avatar_url || data.avatar;
      setProfile(p => ({ ...p, avatar: url }));
      if (updateUser) updateUser({ ...user, avatar: url });
      showToast('Profile photo updated ✓');
    } catch {
      showToast('Failed to update photo', true);
    } finally {
      setAvatarLoading(false);
    }
  };

  // ── Inline field edit ──────────────────────────────────────────
  const startEdit = (field, val) => { setEditField(field); setEditValue(val || ''); };
  const cancelEdit = () => { setEditField(null); setEditValue(''); };
  const saveEdit = async () => {
    if (!editField) return;
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile({ [editField]: editValue });
      const updated = data.user || data;
      setProfile(p => ({ ...p, ...updated }));
      if (updateUser) updateUser({ ...user, [editField]: editValue });
      showToast('Saved ✓');
      cancelEdit();
    } catch (e) {
      showToast(e?.response?.data?.[editField]?.[0] || e?.response?.data?.message || 'Failed to save', true);
    } finally { setSaving(false); }
  };

  // ── Change password ────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.new_password !== pwdForm.confirm_new_password) { setPwdError('Passwords do not match'); return; }
    if (pwdForm.new_password.length < 8) { setPwdError('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword(pwdForm);
      showToast('Password changed ✓');
      setShowPwdForm(false);
      setPwdForm({ old_password: '', new_password: '', confirm_new_password: '' });
    } catch (e) {
      setPwdError(e?.response?.data?.error || e?.response?.data?.old_password?.[0] || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to sign out?')) return;
    try { await logout(); } catch { }
    navigate('/login');
  };

  const p = profile || {};

  const ACCOUNT_FIELDS = [
    { field: 'name', label: 'FULL NAME', value: p.name, icon: <User size={20} />, iconBg: '#eff6ff', iconColor: '#3b82f6', editable: true },
    { field: 'username', label: 'USERNAME', value: p.username, icon: <Tag size={20} />, iconBg: '#f0fdf4', iconColor: '#10b981', editable: true },
    { field: 'section', label: 'SECTION', value: p.section, icon: <BookOpen size={20} />, iconBg: '#fdf2f8', iconColor: '#ec4899', editable: true },
    { field: 'department', label: 'DEPARTMENT', value: p.department, icon: <Building size={20} />, iconBg: '#f5f3ff', iconColor: '#8b5cf6', editable: false },
    { field: 'college_year', label: 'COLLEGE YEAR', value: p.college_year, icon: <GraduationCap size={20} />, iconBg: '#fffbeb', iconColor: '#f59e0b', editable: false },
    { field: 'phone', label: 'PHONE NUMBER', value: p.phone, icon: <Smartphone size={20} />, iconBg: '#ecfdf5', iconColor: '#059669', editable: true },
    { field: 'email', label: 'UNIVERSITY EMAIL', value: p.email, icon: <Mail size={20} />, iconBg: '#fef3c7', iconColor: '#d97706', editable: false, locked: true },
  ];

  const inputStyle = { flex: 1, border: `1.5px solid #3b82f6`, borderRadius: 8, padding: '7px 10px', fontSize: 14, color: text, background: inp, outline: 'none' };

  // Removed full-page loading block to allow instant render

  const avatarSrc = p.avatar || p.avatar_url || p.google_picture;
  const displayItems = activeTab === 'posted' ? myItems : claimedItems;

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 90, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: toast.isError ? '#ef4444' : '#10b981', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,.2)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Photo Menu */}
      {showPhotoMenu && (
        <div onClick={() => setShowPhotoMenu(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9990, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: card, borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 460 }}>
            <h3 style={{ margin: '0 0 18px', fontWeight: 700, color: text, textAlign: 'center' }}>Update Profile Photo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label style={{ border: `2px dashed #2563eb`, borderRadius: 14, padding: '18px 12px', textAlign: 'center', cursor: 'pointer', background: dm ? '#121212' : '#eff6ff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input ref={fileCameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleAvatarUpload(e.target.files?.[0])} />
                <div style={{ marginBottom: 6, color: '#2563eb' }}><Camera size={32} /></div>
                <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 14 }}>Camera</div>
                <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>Take a photo</div>
              </label>
              <label style={{ border: `2px dashed ${border}`, borderRadius: 14, padding: '18px 12px', textAlign: 'center', cursor: 'pointer', background: inp, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input ref={fileGalleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleAvatarUpload(e.target.files?.[0])} />
                <div style={{ marginBottom: 6, color: muted }}><ImageIcon size={32} /></div>
                <div style={{ fontWeight: 700, color: text, fontSize: 14 }}>Gallery</div>
                <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>Choose photo</div>
              </label>
            </div>
            <button onClick={() => setShowPhotoMenu(false)}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: `1.5px solid ${border}`, background: 'none', color: muted, fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Profile Hero — NO stat counts ── */}
      <div style={{ background: 'linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)', padding: '32px 20px 28px', textAlign: 'center', color: '#fff', position: 'relative' }}>

        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid rgba(255,255,255,.6)', overflow: 'hidden', background: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800, color: '#fff' }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              : (p.name?.[0]?.toUpperCase() || '?')}
          </div>
          <button onClick={() => setShowPhotoMenu(true)} disabled={avatarLoading}
            style={{ position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%', background: '#fff', color: '#1e40af', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}>
            {avatarLoading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          </button>
        </div>

        <h1 style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 800 }}>{p.name || 'Your Name'}</h1>
        {p.username && <p style={{ margin: '0 0 3px', fontSize: 13, opacity: .8 }}>@{p.username}</p>}
        <p style={{ margin: '0 0 3px', fontSize: 13, opacity: .85 }}>{p.email}</p>
        {p.department && (
          <p style={{ margin: 0, fontSize: 13, opacity: .75 }}>
            {p.department}{p.college_year ? ` · ${p.college_year}` : ''}
          </p>
        )}
        {/* ✅ REMOVED: Posted / Lost / Found / Claimed stat boxes */}
      </div>

      <div style={{ padding: '14px 16px 0' }}>

        {/* ── Account Details ── */}
        <div style={{ background: card, borderRadius: 16, marginBottom: 14, border: `1px solid ${border}`, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px 9px', borderBottom: `1px solid ${border}` }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Account Details</p>
          </div>
          {ACCOUNT_FIELDS.map((row, i) => {
            const isEditing = editField === row.field;
            const display = row.value || (row.locked ? '—' : 'Not set');
            return (
              <div key={row.field} style={{ padding: '13px 16px', borderBottom: i < ACCOUNT_FIELDS.length - 1 ? `1px solid ${border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: dm ? `${row.iconColor}20` : row.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `1px solid ${dm ? row.iconColor + '30' : row.iconColor + '20'}` }}>
                  {row.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '.6px' }}>{row.label}</p>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                        style={inputStyle} />
                      <button onClick={saveEdit} disabled={saving}
                        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 11px', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                        {saving ? '…' : 'Save'}
                      </button>
                      <button onClick={cancelEdit}
                        style={{ background: dm ? '#333333' : '#f1f5f9', color: muted, border: 'none', borderRadius: 7, padding: '7px 9px', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✕</button>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: row.value ? text : muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</p>
                  )}
                </div>
                {!isEditing && (
                  row.locked
                    ? <span style={{ color: muted, flexShrink: 0, padding: 4 }}><Lock size={16} /></span>
                    : row.editable
                      ? <button onClick={() => startEdit(row.field, row.value)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, flexShrink: 0, padding: 4, display: 'flex' }}><Pencil size={18} /></button>
                      : null
                )}
              </div>
            );
          })}
        </div>

        {/* ── My Items (Posted + Claimed tabs) with Delete ── */}
        <div style={{ background: card, borderRadius: 16, marginBottom: 14, border: `1px solid ${border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
            {[['posted', 'Posted', myItems.length, ClipboardList], ['claimed', 'Claimed', claimedItems.length, CheckCircle]].map(([t, lbl, count, Icon]) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{
                  flex: 1, padding: '13px 10px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  color: activeTab === t ? '#2563eb' : muted,
                  borderBottom: activeTab === t ? '2px solid #2563eb' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                <Icon size={16} /> {lbl} ({count})
              </button>
            ))}
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {displayItems.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: muted }}>
                {activeTab === 'posted' ? 'No posted items yet.' : 'No claimed items yet.'}
              </div>
            )}
            {displayItems.map((item, i) => (
              <div key={item.id}
                style={{ padding: '13px 16px', borderBottom: i < displayItems.length - 1 ? `1px solid ${border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>

                {/* Thumbnail — actual photo or initial */}
                <div onClick={() => navigate(`/item/${item.id}`)}
                  style={{
                    width: 46, height: 46, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                    background: item.type === 'lost' ? '#fee2e2' : '#dcfce7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: item.type === 'lost' ? '#ef4444' : '#16a34a',
                  }}>
                  {item.image_url
                    ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    : (item.title?.[0]?.toUpperCase() || '?')}
                </div>

                {/* Info */}
                <div onClick={() => navigate(`/item/${item.id}`)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: muted }}>
                    {item.location_name || item.location_display || item.location} · {item.time_ago}
                  </p>
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, flexShrink: 0,
                  background: item.status === 'active' ? '#dcfce7' : item.status === 'claimed' ? '#fef3c7' : '#f1f5f9',
                  color: item.status === 'active' ? '#16a34a' : item.status === 'claimed' ? '#d97706' : '#64748b',
                }}>
                  {item.status?.toUpperCase()}
                </span>

                {/* ✅ Delete button */}
                {activeTab === 'posted' && (
                  <button onClick={(e) => handleDeleteItem(e, item.id)}
                    style={{
                      background: '#fee2e2', border: 'none', borderRadius: 8, padding: '6px 8px',
                      cursor: 'pointer', color: '#ef4444', flexShrink: 0, display: 'flex'
                    }}
                    title="Delete item">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {myItems.length > 0 && (
            <button onClick={() => navigate('/my-items')}
              style={{ width: '100%', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 14, fontWeight: 600, borderTop: `1px solid ${border}` }}>
              View All Items →
            </button>
          )}
        </div>

        {/* ── Change Password ── */}
        <div style={{ background: card, borderRadius: 16, marginBottom: 14, border: `1px solid ${border}`, overflow: 'hidden' }}>
          <button onClick={() => setShowPwdForm(v => !v)}
            style={{ width: '100%', padding: '15px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: text }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: dm ? '#7c3aed20' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}><Key size={20} /></div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Change Password</span>
            </div>
            <span style={{ color: muted, fontSize: 14 }}>{showPwdForm ? '▲' : '▼'}</span>
          </button>
          {showPwdForm && (
            <form onSubmit={handleChangePassword} style={{ padding: '0 16px 16px' }}>
              {pwdError && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>⚠️ {pwdError}</div>}
              {[
                { name: 'old_password', label: 'Current Password', ph: 'Current password' },
                { name: 'new_password', label: 'New Password', ph: 'New password' },
                { name: 'confirm_new_password', label: 'Confirm Password', ph: 'Confirm new password' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.5px' }}>{f.label}</label>
                  <input type="password" placeholder={f.ph} value={pwdForm[f.name]}
                    onChange={e => setPwdForm(p => ({ ...p, [f.name]: e.target.value }))}
                    autoComplete="new-password"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${border}`, background: inp, color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <button type="submit" disabled={saving}
                style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div style={{ background: card, borderRadius: 16, marginBottom: 14, border: `1px solid ${border}`, overflow: 'hidden' }}>
          {[
            { label: 'My Statistics & Dashboard', icon: <BarChart3 size={20} />, bg: '#eff6ff', ic: '#2563eb', to: (user?.role === 'admin' ? '/admin' : '/dashboard') },
            { label: 'Notification Settings', icon: <Bell size={20} />, bg: '#fdf2f8', ic: '#ec4899', to: '/settings' },
            { label: 'Terms & Privacy', icon: <ScrollText size={20} />, bg: '#f0fdf4', ic: '#10b981', to: '/terms' },
          ].map((link, i) => (
            <button key={link.label} onClick={() => navigate(link.to)}
              style={{ width: '100%', padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i === 0 ? `1px solid ${border}` : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: dm ? `${link.ic}20` : link.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: link.ic, flexShrink: 0 }}>{link.icon}</div>
              <span style={{ flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 600, color: text }}>{link.label}</span>
              <span style={{ color: muted, fontSize: 16 }}>›</span>
            </button>
          ))}
        </div>

        {/* ── Sign Out ── */}
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid #ef4444', background: dm ? '#1e1e1e' : '#fff5f5', color: '#ef4444', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={18} /> Sign Out
        </button>
        <p style={{ textAlign: 'center', color: muted, fontSize: 12, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>CampusTrace v1.0 · Made with <Heart size={12} color="#ef4444" fill="#ef4444" /></p>
      </div>

      <BottomNav darkMode={dm} />
    </div>
  );
};

export default Profile;
