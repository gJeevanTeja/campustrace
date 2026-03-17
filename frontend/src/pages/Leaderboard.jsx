import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { 
  Trophy, 
  ChevronLeft, 
  Crown, 
  Medal, 
  Award, 
  TrendingUp, 
  Minus,
  Zap,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const { data } = await authAPI.getLeaderboard();
                setLeaders(data);
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaders();
    }, []);

    const others = leaders.slice(3);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
           <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
           <p className="font-black text-text-secondary uppercase tracking-widest text-xs">Ranking Campus Heroes...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-32 font-sans px-4">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8">
                <div className="space-y-2">
                   <div className="flex items-center gap-4">
                       <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                           <ChevronLeft size={20} className="text-text-primary" />
                       </button>
                       <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Hall of Fame</h1>
                   </div>
                   <p className="text-text-secondary font-medium ml-16 flex items-center gap-2">
                       <Sparkles size={16} className="text-amber-500" />
                       Rewarding our most honest helpers and finders.
                   </p>
                </div>
                <div className="flex gap-4 ml-16 md:ml-0">
                    <PremiumCard className="px-6 py-3 flex items-center gap-3" hover={false}>
                        <div className="p-2 bg-success/10 text-success rounded-lg"><Trophy size={16} /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase opacity-60">My Rank</p>
                           <p className="font-black text-sm">#12</p>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="px-6 py-3 flex items-center gap-3" hover={false}>
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Zap size={16} /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase opacity-60">My Multiplier</p>
                           <p className="font-black text-sm">1.5x</p>
                        </div>
                    </PremiumCard>
                </div>
            </header>

            {/* Podium */}
            {leaders.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-6 md:gap-0 pt-12 relative h-auto md:h-[420px]">
                    {/* 2nd Place */}
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="order-2 md:order-1 flex flex-col items-center"
                    >
                        <div className="text-center space-y-4 mb-4">
                            <div className="relative inline-block">
                                <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-slate-200 shadow-xl">
                                   <img src={leaders[1].avatar_url || `https://ui-avatars.com/api/?name=${leaders[1].name}`} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-slate-200 text-slate-700 w-10 h-10 rounded-2xl border-4 border-slate-50 flex items-center justify-center font-black">2</div>
                            </div>
                            <div>
                               <h3 className="font-black text-lg uppercase tracking-tight truncate max-w-[150px]">{leaders[1].name}</h3>
                               <p className="font-black text-primary text-sm tracking-widest">{leaders[1].reward_points} PTS</p>
                            </div>
                        </div>
                        <div className="w-full h-32 md:h-40 bg-white border-t-2 border-slate-100 rounded-t-[40px] shadow-sm flex items-center justify-center">
                            <Medal size={48} className="text-slate-300 opacity-30" />
                        </div>
                    </motion.div>

                    {/* 1st Place */}
                    <motion.div 
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="order-1 md:order-2 flex flex-col items-center relative z-10"
                    >
                        <div className="text-center space-y-4 mb-4">
                            <div className="relative inline-block">
                                <motion.div 
                                  animate={{ rotate: 360 }} 
                                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                  className="absolute -inset-4 border-2 border-dashed border-amber-400/30 rounded-full"
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-400 rotate-12">
                                   <Crown size={40} />
                                </div>
                                <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-amber-400 shadow-2xl relative z-10">
                                   <img src={leaders[0].avatar_url || `https://ui-avatars.com/api/?name=${leaders[0].name}`} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="absolute -bottom-3 -right-3 bg-amber-400 text-white w-12 h-12 rounded-[20px] border-4 border-white flex items-center justify-center font-black shadow-lg">1</div>
                            </div>
                            <div>
                               <h3 className="font-black text-2xl uppercase tracking-tighter truncate max-w-[200px] text-text-primary">{leaders[0].name}</h3>
                               <p className="font-black text-amber-500 text-lg tracking-widest">{leaders[0].reward_points} PTS</p>
                            </div>
                        </div>
                        <div className="w-full h-48 md:h-64 bg-primary rounded-t-[50px] shadow-2xl shadow-primary/30 flex items-center justify-center border-t-4 border-white/20">
                            <div className="flex flex-col items-center gap-2 text-white/40">
                               <Crown size={64} className="opacity-40" />
                               <span className="font-black uppercase tracking-[10px] text-xs">Legend</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="order-3 flex flex-col items-center"
                    >
                        <div className="text-center space-y-4 mb-4">
                            <div className="relative inline-block">
                                <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-amber-700/30 shadow-xl">
                                   <img src={leaders[2].avatar_url || `https://ui-avatars.com/api/?name=${leaders[2].name}`} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white w-10 h-10 rounded-2xl border-4 border-slate-50 flex items-center justify-center font-black">3</div>
                            </div>
                            <div>
                               <h3 className="font-black text-lg uppercase tracking-tight truncate max-w-[150px]">{leaders[2].name}</h3>
                               <p className="font-black text-primary text-sm tracking-widest">{leaders[2].reward_points} PTS</p>
                            </div>
                        </div>
                        <div className="w-full h-24 md:h-32 bg-white border-t-2 border-slate-100 rounded-t-[40px] shadow-sm flex items-center justify-center">
                            <Award size={48} className="text-amber-700 opacity-20" />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">Global Rankings</h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                        <TrendingUp size={14} className="text-success" /> Updated 5m ago
                    </div>
                </div>
                <div className="divide-y divide-slate-50">
                    {others.map((leader, idx) => {
                        const rank = idx + 4;
                        return (
                            <motion.div 
                              key={leader.id}
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              viewport={{ once: true }}
                              className="px-8 py-5 flex items-center justify-between group hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-6">
                                    <span className="w-8 font-black text-slate-300 text-lg group-hover:text-primary transition-colors">#{rank}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm transition-transform group-hover:scale-110">
                                            <img src={leader.avatar_url || `https://ui-avatars.com/api/?name=${leader.name}`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-text-primary group-hover:text-primary transition-colors">{leader.name}</h4>
                                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{leader.level || 'Honest Helper'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="font-black text-text-primary">{leader.reward_points}</p>
                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Points</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                       <Minus size={16} className="text-slate-300" />
                                       <span className="text-[8px] font-black text-slate-300 uppercase">Steady</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                {leaders.length === 0 && (
                   <div className="p-20 text-center space-y-4">
                      <div className="text-4xl">🏅</div>
                      <p className="text-sm font-bold text-text-secondary">No heroes ranked yet. Be the first!</p>
                   </div>
                )}
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-8 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
               <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><ShieldCheck size={16} /> Verified Security</div>
               <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><Sparkles size={16} /> Gamified Rewards</div>
               <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><Award size={16} /> Honest Community</div>
            </div>
        </div>
    );
};

export default Leaderboard;
