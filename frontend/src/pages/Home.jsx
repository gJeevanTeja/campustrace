import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import { Search, PlusCircle, AlertCircle, ArrowRight, Sparkles, Smartphone, Key, Wallet, Package, CreditCard, HardHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';
import { ItemSkeleton } from '../components/ui/SkeletonLoaders';
import TutorialModal from '../components/ui/TutorialModal';

const CATEGORIES = [
  { id: 'mobile_phone', label: 'Mobile Phone', icon: Smartphone, gradient: 'from-blue-500 to-indigo-600' },
  { id: 'key', label: 'Key', icon: Key, gradient: 'from-amber-400 to-orange-500' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, gradient: 'from-pink-500 to-rose-600' },
  { id: 'helmet', label: 'Helmet', icon: HardHat, gradient: 'from-emerald-400 to-teal-600' },
  { id: 'id_card', label: 'ID Card', icon: CreditCard, gradient: 'from-purple-500 to-indigo-600' },
  { id: 'other', label: 'Other', icon: Package, gradient: 'from-gray-400 to-slate-600' },
];

const Home = () => {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('lost');
  const [showTutorial, setShowTutorial] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch items
    itemsAPI.getRecent()
      .then(({ data }) => setRecent(Array.isArray(data) ? data : data.results || []))
      .catch(() => { })
      .finally(() => setLoading(false));

    // Check for tutorial - scoped to user
    if (user) {
      const tutorialKey = `UniTrace_tutorial_completed_${user.id || user.email}`;
      const tutorialCompleted = localStorage.getItem(tutorialKey);
      
      // If user has points or successful returns, they aren't "new"
      const isExistingUser = (user.reward_points > 0) || (user.successful_returns > 0);
      
      if (!tutorialCompleted && !isExistingUser) {
        const timer = setTimeout(() => setShowTutorial(true), 1500);
        return () => clearTimeout(timer);
      } else if (isExistingUser && !tutorialCompleted) {
        // Silently mark as completed for older users
        localStorage.setItem(tutorialKey, 'true');
      }
    }
  }, [user]);

  const lostItems = React.useMemo(() => recent.filter(item => item.type === 'lost'), [recent]);
  const foundItems = React.useMemo(() => recent.filter(item => item.type === 'found'), [recent]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/browse?search=${encodeURIComponent(search.trim())}`);
  };

  const currentItems = activeTab === 'lost' ? lostItems : foundItems;

  return (
    <div className="space-y-12 pb-10">
      <AnimatePresence>
        {showTutorial && (
          <TutorialModal 
            isOpen={showTutorial} 
            onClose={() => setShowTutorial(false)} 
            userId={user?.id || user?.email}
          />
        )}
      </AnimatePresence>

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

            {user && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-2 p-1"
              >
                <span className="text-base lg:text-lg font-bold text-white/90">
                  Hello! <span className="text-white drop-shadow-sm italic">{user.name}</span>
                </span>
              </motion.div>
            )}

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
                  id="tour-search-bar"
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
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/browse?category=${cat.id}`)}
              className="group flex flex-col items-center"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${cat.gradient} mb-3 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all`}>
                  <cat.icon size={32} color="#ffffff" className="group-hover:scale-110 transition-transform" strokeWidth={2} />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-text-secondary group-hover:text-primary transition-colors uppercase tracking-tight">
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Recent Items with Tabs */}
      <section id="tour-recent-activity">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">Recent Activity</h2>
            <p className="text-text-secondary text-sm">Stay updated with the latest reports</p>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'lost' 
                ? 'bg-white text-primary shadow-sm active:scale-95' 
                : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Lost
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'found' 
                ? 'bg-white text-primary shadow-sm active:scale-95' 
                : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Found
            </button>
          </div>

          <button 
            onClick={() => navigate(`/browse?type=${activeTab}`)}
            className="text-primary font-bold text-sm hover:underline flex items-center gap-1 sm:hidden lg:flex"
          >
            See all {activeTab} <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ItemSkeleton />
            <ItemSkeleton />
          </div>
        ) : currentItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200"
          >
             <div className="text-4xl mb-4 opacity-50">✨</div>
             <p className="text-text-secondary font-medium">No recent {activeTab} items reported yet.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentItems.slice(0, 4).map((item, idx) => (
              <motion.div
                key={`${activeTab}-${item.id}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <ItemCard item={item} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {recent.length === 0 && !loading && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
           <div className="text-5xl mb-4">✨</div>
           <p className="text-text-secondary font-medium">Clear campus! Start by reporting an item if you find something.</p>
        </div>
      )}
    </div>
  );
};

export default Home;