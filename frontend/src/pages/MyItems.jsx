import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import BottomNav from '../components/BottomNav';
import ItemCard from '../components/ItemCard';

const MyItems = ({ darkMode }) => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    itemsAPI.getMyItems()
      .then(({ data }) => setItems(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ✅ Remove deleted item from local state instantly
  const handleDelete = (deletedId) => {
    setItems(prev => prev.filter(i => i.id !== deletedId));
  };

  return (
    <div className="page-wrapper">
      <div style={{ background: 'white', padding: '20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h5 style={{ margin: 0, fontWeight: 700 }}>My Posts</h5>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div className="spinner-ct"><div className="spinner-border text-primary"></div></div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <i className="bi bi-bookmark" style={{ fontSize: 56 }}></i>
            <h5 style={{ marginTop: 16, color: '#64748b' }}>No posts yet</h5>
            <p style={{ fontSize: 14, marginBottom: 24 }}>Items you report will appear here</p>
            <button onClick={() => navigate('/report')} className="btn-primary-ct">Report an Item</button>
          </div>
        ) : (
          items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              darkMode={darkMode}
              onDelete={handleDelete}  // ✅ passes delete handler — shows delete button
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/report')} style={{
        position: 'fixed', bottom: 90, right: 20, width: 56, height: 56, borderRadius: '50%',
        background: '#2563eb', color: 'white', border: 'none', fontSize: 24,
        boxShadow: '0 4px 16px rgba(37,99,235,0.4)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}>
        <i className="bi bi-plus"></i>
      </button>

      <BottomNav darkMode={darkMode} />
    </div>
  );
};

export default MyItems;