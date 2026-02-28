import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import BottomNav from '../components/BottomNav';
import ItemCard from '../components/ItemCard';

const CATEGORIES = ['electronics', 'books', 'keys', 'wallet', 'id_card', 'clothing', 'accessories', 'other'];

const BrowseItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const type = searchParams.get('type') || 'all';
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (type !== 'all') params.type = type;
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      const { data } = await itemsAPI.getAll(params);
      setItems(data.results || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [type, category, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const setFilter = (key, value) => {
    const params = Object.fromEntries(searchParams);
    if (value === 'all' || !value) delete params[key];
    else params[key] = value;
    setSearchParams(params);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ background: 'white', padding: '20px 16px 0', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h4 style={{ fontWeight: 800, margin: 0 }}>Browse Items</h4>
          <button onClick={() => navigate('/filters')} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '8px 14px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14
          }}>
            <i className="bi bi-sliders"></i> Filter
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
          <input
            value={search}
            onChange={e => setFilter('search', e.target.value)}
            placeholder="Search for lost items..."
            className="ct-input"
            style={{ paddingLeft: 42 }}
          />
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['all', 'lost', 'found'].map(t => (
            <button key={t} onClick={() => setFilter('type', t)} style={{
              padding: '6px 18px', borderRadius: 20, border: 'none', fontWeight: 600,
              fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
              background: type === t ? '#2563eb' : '#f1f5f9',
              color: type === t ? 'white' : '#374151'
            }}>
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Category scroll */}
        <div className="scroll-tags" style={{ marginBottom: 14 }}>
          <span className={`tag-chip ${category === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('category', 'all')}>All Categories</span>
          {CATEGORIES.map(c => (
            <span key={c} className={`tag-chip ${category === c ? 'active' : ''}`}
              onClick={() => setFilter('category', c)}>
              {c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div className="spinner-ct"><div className="spinner-border text-primary"></div></div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <i className="bi bi-search" style={{ fontSize: 56 }}></i>
            <h5 style={{ marginTop: 16, color: '#64748b' }}>No items found</h5>
            <p style={{ fontSize: 14 }}>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              {items.length} item{items.length !== 1 ? 's' : ''} found
            </p>
            {items.map(item => <ItemCard key={item.id} item={item} />)}
          </>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/report')} style={{
        position: 'fixed', bottom: 90, right: 20, width: 56, height: 56, borderRadius: '50%',
        background: '#2563eb', color: 'white', border: 'none', fontSize: 24,
        boxShadow: '0 4px 16px rgba(37,99,235,0.4)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
      }}>
        <i className="bi bi-plus"></i>
      </button>

      <BottomNav />
    </div>
  );
};

export default BrowseItems;
