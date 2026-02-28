import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'id_card', label: 'ID Card', icon: '🪪' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'wallet', label: 'Wallet', icon: '👛' },
  { id: 'accessories', label: 'Accessories', icon: '👜' },
  { id: 'other', label: 'Others', icon: '···' },
];

const LOCATIONS = [
  { id: 'library', label: 'Library', sub: 'Central Reading Hall & Labs', icon: '📖' },
  { id: 'hostel', label: 'Hostel', sub: 'Blocks A, B, and C Areas', icon: '🏠' },
  { id: 'canteen', label: 'Canteen', sub: 'Main Cafeteria & Food Court', icon: '🍽️' },
  { id: 'classroom', label: 'Classroom Block', sub: 'Academic Wing 1-4', icon: '🎓' },
  { id: 'parking', label: 'Parking Area', sub: 'Visitor & Student Parking Zones', icon: '🅿️' },
];

const SearchFilters = () => {
  const navigate = useNavigate();
  const [itemType, setItemType] = useState('lost');
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedLocs, setSelectedLocs] = useState([]);
  const [timeframe, setTimeframe] = useState('today');

  const toggleCat = (id) => setSelectedCats(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const toggleLoc = (id) => setSelectedLocs(prev =>
    prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (itemType) params.set('type', itemType);
    if (selectedCats.length === 1) params.set('category', selectedCats[0]);
    if (selectedLocs.length === 1) params.set('location', selectedLocs[0]);
    if (timeframe) params.set('timeframe', timeframe);
    navigate(`/browse?${params.toString()}`);
  };

  const reset = () => {
    setItemType('lost');
    setSelectedCats([]);
    setSelectedLocs([]);
    setTimeframe('today');
  };

  return (
    <div style={{ background: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>
          <i className="bi bi-x-lg"></i>
        </button>
        <h5 style={{ margin: 0, fontWeight: 700 }}>Search Filters</h5>
        <button onClick={reset} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Reset</button>
      </div>

      <div style={{ padding: '20px 16px', paddingBottom: 100 }}>
        {/* Type */}
        <div style={{ marginBottom: 24 }}>
          <h6 style={{ fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            I AM LOOKING FOR...
          </h6>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['lost', 'found'].map(t => (
              <button key={t} onClick={() => setItemType(t)} style={{
                padding: '12px', borderRadius: 12, border: `2px solid ${itemType === t ? '#2563eb' : '#e2e8f0'}`,
                background: itemType === t ? '#eff6ff' : 'white', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, color: itemType === t ? '#2563eb' : '#64748b',
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
              }}>
                <i className={`bi bi-${t === 'lost' ? 'search' : 'check-circle'}`}></i>
                {t.charAt(0).toUpperCase() + t.slice(1)} Items
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 24 }}>
          <h6 style={{ fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            ITEM CATEGORY
          </h6>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => toggleCat(cat.id)} style={{
                padding: '12px 16px', borderRadius: 12,
                border: `2px solid ${selectedCats.includes(cat.id) ? '#2563eb' : '#e2e8f0'}`,
                background: selectedCats.includes(cat.id) ? '#eff6ff' : 'white',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                fontWeight: 600, fontSize: 13,
                color: selectedCats.includes(cat.id) ? '#2563eb' : '#374151'
              }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h6 style={{ fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
              CAMPUS LOCATION
            </h6>
            <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>Select Multiple</span>
          </div>
          {LOCATIONS.map(loc => (
            <div key={loc.id} onClick={() => toggleLoc(loc.id)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 12, marginBottom: 8, cursor: 'pointer',
              border: `1.5px solid ${selectedLocs.includes(loc.id) ? '#2563eb' : '#e2e8f0'}`,
              background: selectedLocs.includes(loc.id) ? '#eff6ff' : 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{loc.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: selectedLocs.includes(loc.id) ? '#2563eb' : '#1e293b' }}>
                    {loc.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{loc.sub}</div>
                </div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: 4, border: `2px solid ${selectedLocs.includes(loc.id) ? '#2563eb' : '#cbd5e1'}`,
                background: selectedLocs.includes(loc.id) ? '#2563eb' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {selectedLocs.includes(loc.id) && <i className="bi bi-check" style={{ color: 'white', fontSize: 12 }}></i>}
              </div>
            </div>
          ))}
        </div>

        {/* Timeframe */}
        <div style={{ marginBottom: 24 }}>
          <h6 style={{ fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            TIMEFRAME
          </h6>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { id: 'today', label: 'Today' },
              { id: '3days', label: 'Last 3 Days' },
              { id: 'week', label: 'Last Week' },
              { id: 'custom', label: '📅 Custom' },
            ].map(t => (
              <button key={t.id} onClick={() => setTimeframe(t.id)} style={{
                padding: '12px', borderRadius: 12,
                border: `2px solid ${timeframe === t.id ? '#2563eb' : '#e2e8f0'}`,
                background: timeframe === t.id ? '#2563eb' : 'white',
                color: timeframe === t.id ? 'white' : '#374151',
                cursor: 'pointer', fontWeight: 600, fontSize: 14
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px', background: 'white', borderTop: '1px solid #f1f5f9' }}>
        <button onClick={applyFilters} className="btn-primary-ct">
          Show Results →
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
