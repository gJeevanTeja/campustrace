import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) setToken(urlToken);
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!token) return setError('Invalid restoration token.');
        if (password.length < 8) return setError('Minimum 8 characters required.');
        if (password !== confirmPassword) return setError('Key mismatch detected.');

        setLoading(true);
        try {
            const { data } = await authAPI.resetPassword({ token, new_password: password, confirm_password: confirmPassword });
            setMessage(data.message || 'Identity secured with new credentials.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Restoration failed. Link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md relative z-10"
            >
                <PremiumCard className="p-10 space-y-8" hover={false}>
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-14 h-14 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-2xl rotate-12">
                          <Lock size={28} />
                       </div>
                       <div className="text-center space-y-1">
                          <h2 className="text-2xl font-black text-text-primary tracking-tighter uppercase">Secure Identity Reset</h2>
                          <p className="text-[10px] font-black uppercase tracking-[3px] text-text-secondary opacity-60">Credentials Update Protocol</p>
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
                                <div className="p-8 bg-success/5 border border-success/10 rounded-[32px] space-y-4">
                                   <div className="w-16 h-16 bg-success text-white rounded-[24px] flex items-center justify-center mx-auto shadow-xl shadow-success/20">
                                      <CheckCircle2 size={32} />
                                   </div>
                                   <div className="space-y-1">
                                      <h4 className="font-black uppercase tracking-widest text-xs text-success">Identity Secured</h4>
                                      <p className="text-sm font-medium text-text-secondary">{message}</p>
                                   </div>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                   <RefreshCw size={14} className="animate-spin" /> Redirecting to portal entrance
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                              key="form"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-6"
                            >
                                {error && (
                                  <div className="p-4 bg-danger/5 text-danger border border-danger/10 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                                     <AlertCircle size={14} /> {error}
                                  </div>
                                )}

                                {!token && (
                                  <div className="p-4 bg-amber-500/5 text-amber-500 border border-amber-500/10 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                                     <AlertCircle size={14} /> Critical: Invalid restoration token detect.
                                  </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                   <div className="space-y-1">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">New Secret Key</label>
                                      <div className="relative group">
                                         <input 
                                           type={showPwd ? 'text' : 'password'}
                                           value={password}
                                           onChange={(e) => setPassword(e.target.value)}
                                           placeholder="Minimum 8 characters"
                                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/30 transition-all"
                                         />
                                         <button 
                                           type="button" 
                                           onClick={() => setShowPwd(!showPwd)}
                                           className="absolute right-5 top-[18px] text-slate-300 hover:text-primary transition-colors"
                                         >
                                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                         </button>
                                      </div>
                                   </div>

                                   <div className="space-y-1">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Confirm Secret Key</label>
                                      <div className="relative group">
                                         <input 
                                           type="password"
                                           value={confirmPassword}
                                           onChange={(e) => setConfirmPassword(e.target.value)}
                                           placeholder="Repeat for confirmation"
                                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/30 transition-all"
                                         />
                                         <Lock size={16} className="absolute right-5 top-[18px] text-slate-300 transition-colors" />
                                      </div>
                                   </div>

                                   <button 
                                     disabled={loading || !token}
                                     className="w-full py-5 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                   >
                                      {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Finalize Identity <ArrowRight size={18} /></>}
                                   </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-center">
                        <Link to="/login" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors">
                            <ChevronLeft size={14} /> Back to Entry
                        </Link>
                    </div>
                </PremiumCard>
            </motion.div>
        </div>
    );
};

export default ResetPassword;