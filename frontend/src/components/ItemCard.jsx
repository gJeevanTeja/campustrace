import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';

import { MapPin, Clock, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ItemCard = memo(({ item, onDelete }) => {
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      const { itemsAPI } = await import('../services/api');
      await itemsAPI.delete(item.id);
      if (onDelete) onDelete(item.id);
    } catch {
      alert('Failed to delete item. Please try again.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown time';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' at ' + 
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/item/${item.id}`)}
      className="group bg-white dark:bg-card rounded-3xl p-4 border border-border dark:border-slate-800 shadow-sm hover:shadow-premium-hover hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 cursor-pointer flex gap-4 overflow-hidden relative"
    >
      {/* Type Indicator Bar */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${item.type === 'lost' ? 'bg-danger' : 'bg-success'}`} />

      {/* Image Section */}
      <div className="relative w-24 h-24 flex-shrink-0">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.title} 
            loading="lazy"
            className="w-full h-full object-cover rounded-2xl shadow-sm group-hover:scale-105 transition-transform duration-500"
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full flex items-center justify-center rounded-2xl text-2xl font-bold uppercase shadow-inner transition-all duration-300
            ${item.type === 'lost' 
              ? 'bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger-light' 
              : 'bg-success/10 text-success dark:bg-success/20 dark:text-success-light'}`}
          style={{ display: item.image_url ? 'none' : 'flex' }}
        >
          {item.title?.[0] || '?'}
        </div>
        
        <div className={`absolute -top-2 -left-2 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm z-10 ${item.type === 'lost' ? 'bg-danger text-white' : 'bg-success text-white'}`}>
          {item.type}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-width-0 py-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base truncate group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          {onDelete && (
            <button 
              onClick={handleDelete}
              className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-90"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-2 transition-colors">
          <MapPin size={12} className="text-primary" />
          <span className="truncate">
            {item.location_name || item.location_detail || 'Campus Area'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-3 transition-colors">
          <Clock size={12} className="text-slate-400 dark:text-slate-500" />
          <span>{formatDate(item.incident_datetime)}</span>
        </div>

        <div className="flex items-center justify-between mt-auto transition-colors">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">
            {item.time_ago}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-black text-primary group-hover:translate-x-1 transition-transform">
            DETAILS <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default ItemCard;