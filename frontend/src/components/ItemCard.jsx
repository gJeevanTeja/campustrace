import React from 'react';
import { useNavigate } from 'react-router-dom';

const ItemCard = ({ item, darkMode, onDelete }) => {
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.stopPropagation(); // prevent navigating to item detail
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      const { itemsAPI } = await import('../services/api');
      await itemsAPI.delete(item.id);
      if (onDelete) onDelete(item.id);
    } catch {
      alert('Failed to delete item. Please try again.');
    }
  };

  return (
    <div className="item-card" onClick={() => navigate(`/item/${item.id}`)}>

      {/* ── Photo or grey placeholder (NO emoji icons) ── */}
      {item.image_url ? (
        <img src={item.image_url} alt={item.title} className="item-card-img"
          onError={e => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}

      {/* Fallback placeholder — only shown if no image or image fails */}
      <div className="item-card-img-placeholder"
        style={{
          display: item.image_url ? 'none' : 'flex',
          background: item.type === 'lost' ? '#fee2e2' : '#dcfce7',
          color: item.type === 'lost' ? '#ef4444' : '#16a34a',
          fontSize: 22, fontWeight: 800,
        }}>
        {item.title?.[0]?.toUpperCase() || '?'}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className={`badge-${item.type}`}>{item.type}</span>
          {/* Delete button — only shown when onDelete prop is passed (MyItems page) */}
          {onDelete && (
            <button onClick={handleDelete}
              style={{
                background: '#fee2e2', border: 'none', borderRadius: 6,
                padding: '2px 8px', cursor: 'pointer', color: '#ef4444',
                fontSize: 12, fontWeight: 700, flexShrink: 0
              }}>
              🗑 Delete
            </button>
          )}
        </div>
        <h6 style={{
          fontWeight: 700, fontSize: 15, marginBottom: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {item.title}
        </h6>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: '#64748b', marginBottom: 4
        }}>
          <i className="bi bi-geo-alt"></i>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.location_name || item.location_detail || item.location}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: '#64748b', marginBottom: 4
        }}>
          <span>🕒</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.type === 'lost' ? 'Lost on: ' : 'Found on: '}
            {item.incident_datetime
              ? `${new Date(item.incident_datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at ${new Date(item.incident_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
              : 'Unknown time'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.time_ago}</span>
          <span style={{
            background: '#eff6ff', color: '#2563eb', fontSize: 11,
            padding: '3px 8px', borderRadius: 6, fontWeight: 600
          }}>
            View Details
          </span>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;