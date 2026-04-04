import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import { 
  ChevronLeft, 
  HandMetal, 
  Sparkles, 
  Inbox,
  ShieldCheck,
  AlertCircle,
  FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';
import ItemCard from '../components/ItemCard';

const MyClaims = ({ darkMode: dm }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const { data } = await itemsAPI.getMyClaims();
                setItems(data.results || data);
            } catch (err) {
                console.error('Failed to fetch claims:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchClaims();
    }, []);

    const handleDelete = (deletedId) => {
        // Since these are claims, "delete" might mean cancelling the claim
        setItems(prev => prev.filter(i => i.id !== deletedId));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
           <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
           <p className="font-black text-text-secondary uppercase tracking-widest text-xs">Retrieving your claims...</p>
        </div>
    );

    return (
        <div className={`max-w-6xl mx-auto space-y-12 pb-32 px-4 ${dm ? 'dark' : ''}`}>
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-12">
                <div className="space-y-2">
                   <div className="flex items-center gap-4">
                       <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                           <ChevronLeft size={20} className="text-text-primary dark:text-slate-100" />
                       </button>
                       <h1 className="text-4xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter transition-colors">My Claims</h1>
                   </div>
                   <p className="text-text-secondary dark:text-slate-400 font-medium ml-16 flex items-center gap-2 transition-colors">
                       <FileSearch size={16} className="text-primary transition-colors" />
                       Archive of items you have claimed for verification.
                   </p>
                </div>
                <div className="flex items-center gap-4 ml-16 md:ml-0">
                    <PremiumCard className="px-6 py-3 flex items-center gap-3" hover={false}>
                        <div className="p-2 bg-primary/10 text-primary rounded-lg"><HandMetal size={16} /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase opacity-60">Total Claims</p>
                           <p className="font-black text-sm">{items.length}</p>
                        </div>
                    </PremiumCard>
                </div>
            </header>

            {items.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-24 text-center space-y-8">
                    <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-[48px] flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600 relative transition-colors duration-300">
                        <Inbox size={64} />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter transition-colors">Quiet Claims</h3>
                       <p className="max-w-xs mx-auto text-sm font-medium text-text-secondary dark:text-slate-400 leading-relaxed transition-colors">No claims detected. If you've lost something, try searching the browse page.</p>
                    </div>
                    <button onClick={() => navigate('/browse')} className="px-10 py-5 bg-white dark:bg-slate-900 border-2 border-primary/20 dark:border-slate-800 text-primary dark:text-primary-light font-black uppercase tracking-widest text-xs rounded-3xl hover:bg-primary-gradient hover:text-white transition-all shadow-xl shadow-primary/5">
                        Browse Items
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {items.map((item, idx) => (
                            <motion.div 
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                                <ItemCard
                                  item={item}
                                  onDelete={handleDelete}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-12 grayscale opacity-40">
                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest"><ShieldCheck size={18} /> AI Verified</div>
                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest"><Sparkles size={18} /> Premium Reward Logic</div>
                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest"><AlertCircle size={18} /> Secure Handover</div>
            </div>
        </div>
    );
};

export default MyClaims;
