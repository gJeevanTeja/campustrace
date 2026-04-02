import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import ItemCard from '../components/ItemCard';
import { Search, Plus, Filter, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemSkeleton } from '../components/ui/SkeletonLoaders';

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
      setTimeout(() => setLoading(false), 500); // Small delay for smooth feel
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
    <div className="space-y-8 min-h-screen">
      {/* Header & Filters Section */}
      <section className="glass-effect rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/40 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 text-primary/5 -mr-8 -mt-8 rotate-12 hidden sm:block">
            <LayoutGrid size={120} />
        </div>

        <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary dark:text-slate-100 transition-colors">Discover Items</h2>
                    <p className="text-text-secondary dark:text-slate-400 text-[11px] sm:text-sm transition-colors">Browse and filter lost/found reports.</p>
                </div>
                <button 
                  onClick={() => navigate('/report')}
                  className="bg-primary text-white p-3 sm:px-6 sm:py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Report Item</span>
                </button>
            </div>

            {/* Sub-header Filter bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Search */}
                <div className="lg:col-span-5 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-slate-500" size={16} />
                    <input
                      value={search}
                      onChange={e => setFilter('search', e.target.value)}
                      placeholder="Search items..."
                      className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-border dark:border-slate-800 rounded-xl sm:rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm text-sm dark:text-slate-100 placeholder:text-slate-500"
                    />
                </div>

                {/* Type & Category Desktop Pills */}
                <div className="lg:col-span-7 flex flex-wrap gap-2 items-center">
                    <div className="h-11 sm:h-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-border dark:border-slate-800 p-1 rounded-xl sm:rounded-2xl flex gap-1 w-full sm:w-auto transition-colors">
                        {['all', 'lost', 'found'].map(t => (
                            <button 
                              key={t} 
                              onClick={() => setFilter('type', t)} 
                              className={`flex-1 sm:flex-none px-4 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-tighter transition-all ${
                                type === t ? 'bg-primary text-white shadow-md' : 'text-text-secondary dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                              }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
                        <button 
                            onClick={() => setFilter('category', 'all')}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-tighter border transition-all ${
                                category === 'all' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100 shadow-md' : 'bg-white dark:bg-card text-text-secondary dark:text-slate-400 border-border dark:border-slate-800 hover:border-primary/30'
                            }`}
                        >
                            All Categories
                        </button>
                        {CATEGORIES.map(c => (
                            <button 
                                key={c} 
                                onClick={() => setFilter('category', c)}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-tighter border transition-all ${
                                    category === c ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100 shadow-md' : 'bg-white dark:bg-card text-text-secondary dark:text-slate-400 border-border dark:border-slate-800 hover:border-primary/30'
                                }`}
                            >
                                {c.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Results Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-text-secondary dark:text-slate-500 px-2 transition-colors">
            <div className="flex items-center gap-2">
                <Filter size={14} className="text-secondary" />
                <span className="font-bold">{items.length} items found</span>
            </div>
            {category !== 'all' && (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{category}</span>
                </div>
            )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
          </div>
        ) : items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 bg-gray-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700 transition-colors"
          >
            <div className="relative mb-6">
                <Search size={64} className="text-gray-300 dark:text-slate-700" />
                <motion.div 
                   animate={{ x: [0, 5, -5, 0], y: [0, -5, 5, 0] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute -top-2 -right-2 text-3xl"
                >
                    🔍
                </motion.div>
            </div>
            <h3 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-2">No matching items found</h3>
            <p className="text-text-secondary dark:text-slate-400 mb-8 max-w-xs text-center">We couldn't find any items matching your current filters. Try adjusting your search or category.</p>
            <button 
              onClick={() => {
                  setSearchParams({});
              }}
              className="text-primary font-bold hover:underline"
            >
                Clear all filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
                {items.map((item, idx) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                        <ItemCard item={item} />
                    </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/report')}
        className="lg:hidden fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-2xl flex items-center justify-center z-40 shadow-primary/40 border border-white/20"
      >
        <Plus size={28} />
      </motion.button>
    </div>
  );
};

export default BrowseItems;

 
