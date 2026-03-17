import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { 
  Key, 
  Mail, 
  ChevronLeft, 
  ArrowRight, 
  Send, 
  ShieldCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!email.trim()) return setError('Email identity required.');
        setLoading(true);
        try {
            const { data } = await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
            setMessage(data.message || 'Restoration link dispatched.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to dispatch restoration link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md relative z-10"
            >
                <PremiumCard className="p-10 space-y-8" hover={false}>
                    {/* Brand */}
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-14 h-14 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-2xl rotate-12">
                          <Key size={28} />
                       </div>
                       <div className="text-center space-y-1">
                          <h2 className="text-2xl font-black text-text-primary tracking-tighter uppercase">Identity Recovery</h2>
                          <p className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary opacity-60">Secure Restoration Protocol</p>
                       </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {message ? (
                            <motion.div 
                              key="success"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-6 text-center"
                            >
                                <div className="p-6 bg-success/5 border border-success/10 rounded-3xl space-y-4">
                                   <div className="w-12 h-12 bg-success text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-success/20">
                                      <Send size={20} />
                                   </div>
                                   <div className="space-y-1">
                                      <h4 className="font-black uppercase tracking-widest text-xs text-success">Link Dispatched</h4>
                                      <p className="text-sm font-medium text-text-secondary">{message}</p>
                                   </div>
                                </div>
                                <p className="text-[10px] font-bold text-text-secondary uppercase">Check your encrypted mail for further instructions.</p>
                                <button onClick={() => setMessage('')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4">Resend Protocol</button>
                            </motion.div>
                        ) : (
                            <motion.div 
                              key="form"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-6"
                            >
                                <p className="text-sm font-medium text-text-secondary text-center">Enter your registered email identity to receive a secure restoration link.</p>

                                {error && (
                                  <div className="p-4 bg-danger/5 text-danger border border-danger/10 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                                     <AlertCircle size={14} /> {error}
                                  </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                   <div className="space-y-1">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Email Identity</label>
                                      <div className="relative group">
                                         <input 
                                           type="email"
                                           value={email}
                                           onChange={(e) => setEmail(e.target.value)}
                                           placeholder="agent@university.edu"
                                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/30 transition-all"
                                         />
                                         <Mail size={16} className="absolute right-5 top-[18px] text-slate-300 group-focus-within:text-primary transition-colors" />
                                      </div>
                                   </div>

                                   <button 
                                     disabled={loading}
                                     className="w-full py-5 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                   >
                                      {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Init restoration <ArrowRight size={18} /></>}
                                   </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-6">
                        <Link to="/login" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors">
                            <ChevronLeft size={14} /> Return to Login
                        </Link>
                    </div>
                </PremiumCard>

                {/* Secure Footer */}
                <div className="flex items-center justify-center gap-8 py-8 opacity-30">
                   <div className="flex items-center gap-2 font-black text-[8px] uppercase tracking-widest"><ShieldCheck size={12} /> End-to-End Encrypted</div>
                   <div className="flex items-center gap-2 font-black text-[8px] uppercase tracking-widest"><Sparkles size={12} /> AI Assisted Recovery</div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword; 
