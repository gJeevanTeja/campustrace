import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import { Search, PlusCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';
import { ItemSkeleton } from '../components/ui/SkeletonLoaders';

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: '🖥️', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'keys', label: 'Keys', icon: '🔑', gradient: 'from-amber-400 to-orange-500' },
  { id: 'wallet', label: 'Wallets', icon: '👛', gradient: 'from-pink-500 to-rose-600' },
  { id: 'books', label: 'Books', icon: '📚', gradient: 'from-emerald-400 to-teal-600' },
  { id: 'clothing', label: 'Clothing', icon: '👕', gradient: 'from-purple-500 to-indigo-600' },
  { id: 'other', label: 'Other', icon: '📦', gradient: 'from-gray-400 to-slate-600' },
];

const Home = () => {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  useAuth();

  useEffect(() => {
    itemsAPI.getRecent()
      .then(({ data }) => setRecent(Array.isArray(data) ? data : data.results || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/browse?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary-gradient p-8 lg:p-12 text-white shadow-2xl">
         {/* Decorative shapes */}
         <div className="absolute top-0 right-0 -u mt-[-10%] mr-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
         <div className="absolute bottom-0 left-0 mb-[-10%] ml-[-10%] w-48 h-48 bg-secondary/20 rounded-full blur-2xl" />
         
         <div className="relative z-10 max-w-2xl">
           <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex items-center gap-2 mb-4"
           >
             <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
               Campus Resource Network
             </span>
             <Sparkles size={16} className="text-yellow-300 animate-pulse" />
           </motion.div>

           <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight"
           >
             Lost something? <br /> We'll help you <span className="text-yellow-200">trace it.</span>
           </motion.h1>

           <motion.p
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="text-white/80 text-lg mb-8"
           >
             The smartest way to find lost items on campus. Join thousands of students making campus life easier.
           </motion.p>

           <motion.form 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             onSubmit={handleSearch}
             className="flex flex-col sm:flex-row gap-3"
           >
             <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for lost items..."
                  className="w-full bg-white text-text-primary pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-white/20 transition-all shadow-lg"
                />
             </div>
             <button type="submit" className="bg-text-primary text-white font-bold py-4 px-8 rounded-2xl hover:bg-slate-800 transition-all shadow-lg whitespace-nowrap active:scale-95">
               Find Now
             </button>
           </motion.form>
         </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard 
          className="bg-gradient-to-br from-red-500 to-orange-600 border-none p-1 overflow-hidden"
          hover={true}
        >
          <button 
            onClick={() => navigate('/report?type=lost')}
            className="w-full h-full bg-white/10 backdrop-blur-sm p-6 flex items-start gap-4 text-white text-left group"
          >
             <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
               <AlertCircle size={32} />
             </div>
             <div>
               <h3 className="text-xl font-extrabold mb-1">Lost Something?</h3>
               <p className="text-white/80 text-sm mb-4">Report it now and let the network find it.</p>
               <div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-3 py-1.5 rounded-lg">
                 Report Lost <ArrowRight size={14} />
               </div>
             </div>
          </button>
        </PremiumCard>

        <PremiumCard 
          className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none p-1 overflow-hidden"
          hover={true}
          delay={0.1}
        >
          <button 
            onClick={() => navigate('/report?type=found')}
            className="w-full h-full bg-white/10 backdrop-blur-sm p-6 flex items-start gap-4 text-white text-left group"
          >
             <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
               <PlusCircle size={32} />
             </div>
             <div>
               <h3 className="text-xl font-extrabold mb-1">Found Something?</h3>
               <p className="text-white/80 text-sm mb-4">Be a hero. Help someone get their item back.</p>
               <div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-3 py-1.5 rounded-lg">
                 Report Found <ArrowRight size={14} />
               </div>
             </div>
          </button>
        </PremiumCard>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Browse Categories</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/browse?category=${cat.id}`)}
              className="group"
            >
              <div className={`aspect-square rounded-3xl bg-gradient-to-br ${cat.gradient} p-0.5 mb-3 shadow-lg group-hover:shadow-primary/30 transition-all`}>
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
              </div>
              <span className="text-sm font-semibold text-text-secondary group-hover:text-primary transition-colors">
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Recent Items */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Recently Found</h2>
          <button 
            onClick={() => navigate('/browse')}
            className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
          >
            See all items <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
             <div className="text-5xl mb-4">empty</div>
             <p className="text-text-secondary font-medium">No recent activity. Start by reporting an item!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recent.slice(0, 6).map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <ItemCard item={item} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;