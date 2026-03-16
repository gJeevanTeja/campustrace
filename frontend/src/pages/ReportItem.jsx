/**
 * ReportItem.jsx
 * Changes from original:
 *   1. Imports GoogleMapPicker instead of MapPicker / Leaflet
 *   2. handleSubmit shows exact backend field errors (no more generic "Failed to Post")
 *   3. location field always set to 'other' so backend validation passes
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import BottomNav from '../components/BottomNav';
import GoogleMapPicker from '../components/MapPicker';
import { adminAPI } from '../services/api';

const ReportItem = ({ darkMode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    type: searchParams.get('type') || 'lost',
    title: '',
    description: '',
    category: '',
    category_new: '',
    block: '',
    incident_date: '',
    incident_time: '',
    location: 'other',
    location_name: '',
    location_detail: '',
    contact_phone: '',
    latitude: null,
    longitude: null,
  });

  const [categories, setCategories] = useState([]);
  const [blocks, setBlocks] = useState([]);

  useState(() => {
    // Fetch categories and blocks
    adminAPI.getCategories().then(({ data }) => setCategories(data)).catch(() => { });
    adminAPI.getBlocks().then(({ data }) => setBlocks(data)).catch(() => { });
  }, []);

  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dm = darkMode;
  const bg = dm ? '#0f172a' : '#f8fafc';
  const text = dm ? '#e2e8f0' : '#1e293b';
  const muted = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#334155' : '#e2e8f0';
  const isLost = form.type === 'lost';
  const accent = isLost ? '#ef4444' : '#16a34a';
  const gradient = `linear-gradient(135deg, ${accent}, ${isLost ? '#f97316' : '#059669'})`;

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: `1.5px solid ${border}`,
    background: dm ? '#0f172a' : '#f8fafc',
    color: text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  // ── Location picked from Google Map ─────────────────────────
  const handleLocationSelect = ({ lat, lng, address }) => {
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_name: address.split(',').slice(0, 3).join(',').trim(),
    }));
  };

  // ── Field changes ────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ── Photos ───────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...newFiles].slice(0, 5));
    setPhotoPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))].slice(0, 5));
  };

  const removePhoto = (i) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Item title is required');
    if (!form.description.trim()) return setError('Description is required');
    if (!form.category_new) return setError('Please select a category');
    if (!form.block) return setError('Please select a campus block');
    if (!form.incident_date) return setError('Please select a date');
    if (!form.incident_time) return setError('Please select a time');

    const selectedDateTime = new Date(`${form.incident_date}T${form.incident_time}`);
    if (selectedDateTime > new Date()) {
      return setError('Incident date and time cannot be in the future');
    }

    setLoading(true);
    try {
      // ✅ FIX: backend now returns 201 instantly (notifications in background thread).
      // axios will no longer time out, so this await completes immediately.
      const payload = { ...form, incident_datetime: selectedDateTime.toISOString(), photos };
      delete payload.incident_date;
      delete payload.incident_time;
      await itemsAPI.create(payload);
      navigate('/');
    } catch (err) {
      // ✅ Show exact backend validation errors instead of generic "Failed to Post"
      const data = err.response?.data;
      if (data && typeof data === 'object' && !data.message && !data.detail) {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(' | ');
        setError(msgs || 'Failed to submit. Please try again.');
      } else {
        setError(data?.message || data?.detail || 'Failed to submit. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, paddingBottom: 90 }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ background: gradient, padding: '20px 16px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer', fontSize: 16 }}>
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {isLost ? '😔 Report Lost Item' : '🎉 Report Found Item'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.85 }}>
              {isLost ? 'Help others return your item' : 'Help reunite someone with their item'}
            </p>
          </div>
        </div>

        {/* Lost / Found toggle */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {['lost', 'found'].map(t => (
            <button key={t}
              onClick={() => setForm(prev => ({ ...prev, type: t }))}
              style={{
                flex: 1, padding: 8, borderRadius: 10, border: 'none',
                cursor: 'pointer',
                background: form.type === t ? '#fff' : 'rgba(255,255,255,0.2)',
                color: form.type === t ? accent : '#fff',
                fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
              }}>
              {t === 'lost' ? '😔 Lost' : '🎉 Found'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16 }}>

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#fee2e2', color: '#dc2626', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16, fontSize: 14,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: text }}>
            Item Title *
          </label>
          <input name="title" value={form.title} onChange={handleChange}
            placeholder="e.g. Blue Samsung Galaxy S22" style={inputStyle} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: text }}>
            Description *
          </label>
          <textarea name="description" value={form.description} onChange={handleChange}
            placeholder="Describe the item — color, brand, unique marks..."
            rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: text }}>
            Category *
          </label>
          <select name="category_new" value={form.category_new} onChange={handleChange} style={inputStyle}>
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Block / Location */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: text }}>
            Campus Block *
          </label>
          <select name="block" value={form.block} onChange={handleChange} style={inputStyle}>
            <option value="">Select campus location</option>
            {blocks.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: text }}>
              {isLost ? 'Date Lost *' : 'Date Found *'}
            </label>
            <input type="date" name="incident_date" value={form.incident_date} onChange={handleChange}
              max={new Date().toISOString().split('T')[0]} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: text }}>
              {isLost ? 'Time Lost *' : 'Time Found *'}
            </label>
            <input type="time" name="incident_time" value={form.incident_time} onChange={handleChange}
              style={inputStyle} />
          </div>
        </div>

        {/* Photos */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: text }}>
            Photos (up to 5)
          </label>

          <div style={{ display: 'flex', gap: 8, marginBottom: photoPreviews.length > 0 ? 10 : 0 }}>
            <label style={{
              flex: 1, border: `2px dashed ${accent}`, borderRadius: 12,
              padding: 14, textAlign: 'center', cursor: 'pointer',
              background: dm ? '#0f172a' : '#f8fafc', color: accent, fontWeight: 600, fontSize: 13,
            }}>
              <input type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }} onChange={handlePhotoChange} />
              📷 Camera
            </label>
            <label style={{
              flex: 1, border: `2px dashed ${border}`, borderRadius: 12,
              padding: 14, textAlign: 'center', cursor: 'pointer',
              background: dm ? '#0f172a' : '#f8fafc', color: muted, fontWeight: 600, fontSize: 13,
            }}>
              <input type="file" accept="image/*" multiple
                style={{ display: 'none' }} onChange={handlePhotoChange} />
              🖼️ Gallery
            </label>
          </div>

          {photoPreviews.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {photoPreviews.map((src, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={src} alt="" style={{
                    width: 72, height: 72, objectFit: 'cover',
                    borderRadius: 10, border: `2px solid ${accent}`,
                  }} />
                  <button type="button" onClick={() => removePhoto(i)} style={{
                    position: 'absolute', top: -6, right: -6,
                    background: '#ef4444', border: 'none', borderRadius: '50%',
                    width: 20, height: 20, color: '#fff', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  }}>
                    ×
                  </button>
                </div>
              ))}
              {photoPreviews.length < 5 && (
                <label style={{
                  width: 72, height: 72, border: `2px dashed ${border}`,
                  borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', color: muted, fontSize: 24,
                }}>
                  <input type="file" accept="image/*" multiple
                    style={{ display: 'none' }} onChange={handlePhotoChange} />
                  +
                </label>
              )}
            </div>
          )}
        </div>

        {/* ── Google Maps Location Picker ────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8, color: text }}>
            Location{' '}
            <span style={{ fontWeight: 400, fontSize: 12, color: muted }}>
              (optional — tap map, search, or use GPS)
            </span>
          </label>
          <GoogleMapPicker
            onLocationSelect={handleLocationSelect}
            darkMode={dm}
          />
        </div>

        {/* Location detail */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: text }}>
            Location Detail <span style={{ fontWeight: 400, color: muted }}>(optional)</span>
          </label>
          <input name="location_detail" value={form.location_detail} onChange={handleChange}
            placeholder="e.g. Near main entrance, 2nd floor..." style={inputStyle} />
        </div>

        {/* Contact phone */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: text }}>
            Contact Phone <span style={{ fontWeight: 400, color: muted }}>(optional)</span>
          </label>
          <input name="contact_phone" value={form.contact_phone} onChange={handleChange}
            placeholder="Your phone number" style={inputStyle} inputMode="numeric" />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: 15, borderRadius: 14, border: 'none',
          background: loading ? '#94a3b8' : gradient,
          color: '#fff', fontSize: 16, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: `0 4px 16px ${accent}40`,
        }}>
          {loading
            ? '⏳ Submitting...'
            : isLost ? '📢 Report Lost Item' : '📢 Report Found Item'}
        </button>
      </form>

      <BottomNav darkMode={darkMode} />
    </div>
  );
};

export default ReportItem;