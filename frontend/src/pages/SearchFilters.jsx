import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    X, 
    RotateCcw, 
    Search, 
    Check, 
    ArrowRight,
    Smartphone,
    Book,
    Wallet,
    Package,
    MoreHorizontal,
    CreditCard
} from 'lucide-react';

const CATEGORIES = [
  { id: 'id_card', label: 'ID Card', icon: <CreditCard size={18} /> },
  { id: 'books', label: 'Books', icon: <Book size={18} /> },
  { id: 'electronics', label: 'Electronics', icon: <Smartphone size={18} /> },
  { id: 'wallet', label: 'Wallet', icon: <Wallet size={18} /> },
  { id: 'accessories', label: 'Accessories', icon: <Package size={18} /> },
  { id: 'other', label: 'Others', icon: <MoreHorizontal size={18} /> },
];

const LOCATIONS = [
  { id: 'library', label: 'Library', sub: 'Central Reading Hall & Labs', icon: '📖' },
  { id: 'hostel', label: 'Hostel', sub: 'Blocks A, B, and C Areas', icon: '🏠' },
  { id: 'canteen', label: 'Canteen', sub: 'Main Cafeteria & Food Court', icon: '🍽️' },
  { id: 'classroom', label: 'Classroom Block', sub: 'Academic Wing 1-4', icon: '🎓' },
  { id: 'parking', label: 'Parking Area', sub: 'Visitor & Student Parking Zones', icon: '🅿️' },
];

const SearchFilters = ({ darkMode: dm }) => {
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
    <div className={`min-h-screen ${dm ? 'dark bg-[#020617]' : 'bg-slate-50'} font-sans pb-32 transition-colors`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center justify-between transition-colors">
        <button onClick={() => navigate(-1)} className="p-2 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
          <X size={20} className="text-text-primary dark:text-slate-100" />
        </button>
        <h2 className="text-xs font-black uppercase tracking-widest text-text-primary dark:text-slate-100">Search Parameters</h2>
        <button onClick={reset} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all">
          <RotateCcw size={14} /> Clear
        </button>
      </header>

      <div className="max-w-xl mx-auto p-6 space-y-12">
        {/* Interaction Type */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-primary rounded-full" />
             <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500">Interaction Mode</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['lost', 'found'].map(t => (
              <button 
                key={t} 
                onClick={() => setItemType(t)}
                className={`flex flex-col items-center gap-4 p-8 rounded-[32px] border-2 transition-all ${itemType === t ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-text-secondary dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'}`}
              >
                <div className={`p-4 rounded-2xl ${itemType === t ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
                   {t === 'lost' ? <Search size={28} /> : <Check size={28} />}
                </div>
                <div className="space-y-1">
                   <p className="font-black uppercase tracking-widest text-[10px]">{t} Identity</p>
                   <p className="text-[10px] font-bold opacity-60">Seek assistance</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
             <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500">Asset Category</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => toggleCat(cat.id)}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${selectedCats.includes(cat.id) ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-text-primary dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <div className={`p-2 rounded-lg ${selectedCats.includes(cat.id) ? 'bg-white/10 text-white' : 'bg-slate-50 dark:bg-slate-800 text-text-secondary dark:text-slate-500'}`}>
                   {cat.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Location */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-success rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500">Campus Proximity</h3>
             </div>
             <span className="text-[10px] font-bold text-primary px-3 py-1 bg-primary/5 dark:bg-primary/20 rounded-full uppercase tracking-tighter">Multi-Select</span>
          </div>
          <div className="space-y-3">
            {LOCATIONS.map(loc => (
              <button 
                key={loc.id} 
                onClick={() => toggleLoc(loc.id)}
                className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${selectedLocs.includes(loc.id) ? 'bg-white dark:bg-slate-900 border-success shadow-xl shadow-success/10' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
              >
                <div className="flex items-center gap-5">
                   <div className="text-2xl grayscale group-hover:grayscale-0 transition-all">{loc.icon}</div>
                   <div className="text-left">
                      <p className={`font-black uppercase tracking-tight text-sm ${selectedLocs.includes(loc.id) ? 'text-success' : 'text-text-primary dark:text-slate-100'}`}>{loc.label}</p>
                      <p className="text-[10px] font-medium text-text-secondary dark:text-slate-400">{loc.sub}</p>
                   </div>
                </div>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedLocs.includes(loc.id) ? 'bg-success border-success text-white' : 'border-slate-200 dark:border-slate-700'}`}>
                   {selectedLocs.includes(loc.id) && <Check size={14} strokeWidth={4} />}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Timeframe */}
        <section className="space-y-6 pb-12">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-slate-900 dark:bg-slate-100 rounded-full" />
             <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary dark:text-slate-500">Temporal Range</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'today', label: '24 Hour cycle' },
              { id: '3days', label: '72 Hour cycle' },
              { id: 'week', label: 'Sidereal Week' },
              { id: 'custom', label: 'Custom Protocol' },
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setTimeframe(t.id)}
                className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${timeframe === t.id ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-xl shadow-black/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-text-primary dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Action */}
      <div className={`fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t ${dm ? 'from-[#020617] via-[#020617] to-transparent' : 'from-slate-50 via-slate-50 to-transparent'} z-40 transition-colors`}>
        <button 
          onClick={applyFilters}
          className="w-full max-w-xl mx-auto flex items-center justify-center gap-4 bg-primary text-white py-6 rounded-[28px] font-black uppercase tracking-[3px] text-xs shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all"
        >
          Initiate Search Manifest <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
