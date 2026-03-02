import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Book, Laptop, Wallet, Briefcase, MoreHorizontal, Library, Home, Coffee, GraduationCap, CarFront, CalendarDays, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'id_card', label: 'ID Card', icon: <Badge size={18} /> },
  { id: 'books', label: 'Books', icon: <Book size={18} /> },
  { id: 'electronics', label: 'Electronics', icon: <Laptop size={18} /> },
  { id: 'wallet', label: 'Wallet', icon: <Wallet size={18} /> },
  { id: 'accessories', label: 'Accessories', icon: <Briefcase size={18} /> },
  { id: 'other', label: 'Others', icon: <MoreHorizontal size={18} /> },
];

const LOCATIONS = [
  { id: 'library', label: 'Library', sub: 'Central Reading Hall & Labs', icon: <Library size={20} /> },
  { id: 'hostel', label: 'Hostel', sub: 'Blocks A, B, and C Areas', icon: <Home size={20} /> },
  { id: 'canteen', label: 'Canteen', sub: 'Main Cafeteria & Food Court', icon: <Coffee size={20} /> },
  { id: 'classroom', label: 'Classroom Block', sub: 'Academic Wing 1-4', icon: <GraduationCap size={20} /> },
  { id: 'parking', label: 'Parking Area', sub: 'Visitor & Student Parking Zones', icon: <CarFront size={20} /> },
];

const SearchFilters = ({ darkMode: dm }) => {
  const navigate = useNavigate();
  const [itemType, setItemType] = useState('lost');
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedLocs, setSelectedLocs] = useState([]);
  const [timeframe, setTimeframe] = useState('today');

  const bg = dm ? '#121212' : '#f8fafc';
  const card = dm ? '#1e1e1e' : 'white';
  const text = dm ? '#e2e8f0' : '#1e293b';
  const muted = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#2d2d2d' : '#e2e8f0';
  const activeBg = dm ? '#2d2d2d' : '#eff6ff';
  const highlight = '#2563eb';

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
    <div style={{ background: bg, minHeight: '100vh', color: text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 16px', borderBottom: `1px solid ${border}`, background: card }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: text }}>
          <X size={24} />
        </button>
        <h5 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Search Filters</h5>
        <button onClick={reset} style={{ background: 'none', border: 'none', color: highlight, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>Reset</button>
      </div>

      <div style={{ padding: '20px 16px', paddingBottom: 100 }}>
        {/* Type */}
        <div style={{ marginBottom: 24 }}>
          <h6 style={{ fontWeight: 700, color: muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            I AM LOOKING FOR...
          </h6>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['lost', 'found'].map(t => (
              <button key={t} onClick={() => setItemType(t)} style={{
                padding: '12px', borderRadius: 12, border: `2px solid ${itemType === t ? highlight : border}`,
                background: itemType === t ? activeBg : card, cursor: 'pointer',
                fontWeight: 600, fontSize: 14, color: itemType === t ? highlight : muted,
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
              }}>
                {t.charAt(0).toUpperCase() + t.slice(1)} Items
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 24 }}>
          <h6 style={{ fontWeight: 700, color: muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            ITEM CATEGORY
          </h6>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => toggleCat(cat.id)} style={{
                padding: '12px 16px', borderRadius: 12,
                border: `2px solid ${selectedCats.includes(cat.id) ? highlight : border}`,
                background: selectedCats.includes(cat.id) ? activeBg : card,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                fontWeight: 600, fontSize: 13,
                color: selectedCats.includes(cat.id) ? highlight : (dm ? '#e2e8f0' : '#374151')
              }}>
                <span style={{ display: 'flex' }}>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h6 style={{ fontWeight: 700, color: muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
              CAMPUS LOCATION
            </h6>
            <span style={{ fontSize: 12, color: highlight, fontWeight: 600 }}>Select Multiple</span>
          </div>
          {LOCATIONS.map(loc => (
            <div key={loc.id} onClick={() => toggleLoc(loc.id)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 12, marginBottom: 8, cursor: 'pointer',
              border: `1.5px solid ${selectedLocs.includes(loc.id) ? highlight : border}`,
              background: selectedLocs.includes(loc.id) ? activeBg : card
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', color: selectedLocs.includes(loc.id) ? highlight : text }}>{loc.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: selectedLocs.includes(loc.id) ? highlight : text }}>
                    {loc.label}
                  </div>
                  <div style={{ fontSize: 12, color: muted }}>{loc.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeframe */}
        <div style={{ marginBottom: 24 }}>
          <h6 style={{ fontWeight: 700, color: muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            TIMEFRAME
          </h6>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { id: 'today', label: 'Today' },
              { id: '3days', label: 'Last 3 Days' },
              { id: 'week', label: 'Last Week' },
              { id: 'custom', label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CalendarDays size={16} /> Custom</span> },
            ].map(t => (
              <button key={t.id} onClick={() => setTimeframe(t.id)} style={{
                padding: '12px', borderRadius: 12,
                border: `2px solid ${timeframe === t.id ? highlight : border}`,
                background: timeframe === t.id ? highlight : card,
                color: timeframe === t.id ? 'white' : text,
                cursor: 'pointer', fontWeight: 600, fontSize: 14
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px', background: card, borderTop: `1px solid ${border}` }}>
        <button onClick={applyFilters} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: highlight, color: 'white', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          Show Results →
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
