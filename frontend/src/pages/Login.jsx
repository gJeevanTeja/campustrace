import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { 
  Mail, 
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Zap,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const Login = () => {
  const [tab, setTab] = useState('password'); // 'password' | 'otp'
  const [form, setForm] = useState({ identity: '', secret_key: '' });
  const [otpId, setOtpId] = useState('');
  const [otpType, setOtpType] = useState('email');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submittingRef = useRef(false);
  const { login } = useAuth();

  // Error is cleared manually in handleLogin/handleSendOTP/handleVerifyOTP

  // Clear old tokens strictly on login page mount to prevent "No Refresh Token" interceptor bugs
  React.useEffect(() => {
    localStorage.clear();
  }, []);

  const redirectAfterLogin = (user) => {
    if (user?.role === 'super_admin') window.location.href = '/super-admin-dashboard';
    else if (user?.role === 'college_admin') window.location.href = '/admin-dashboard';
    else if (user?.role === 'moderator') window.location.href = '/admin';
    else window.location.href = '/';
  };

    const handleLogin = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setLoading(true);

    // Clear old tokens before starting a new login session
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    try {
      // Use user-provided values exclusively (removed bypass logic)
      const identityToUse = form.identity.trim();
      const secretKeyToUse = form.secret_key;

      if (!identityToUse || !secretKeyToUse) {
        throw new Error('Email/phone and secret key are required');
      }

      const data = await login({
        email: identityToUse.toLowerCase(),
        password: secretKeyToUse,
      });
      redirectAfterLogin(data.user);
    } catch (err) {
      // Extraction of error message
      const errorData = err.response?.data;
      const rawError = errorData?.message || errorData?.detail || errorData?.error || err.message;
      
      let finalMsg = 'Invalid email or password';
      if (typeof rawError === 'string') {
        finalMsg = rawError;
      } else if (Array.isArray(rawError) && rawError.length > 0) {
        finalMsg = rawError[0];
      } else if (typeof rawError === 'object' && rawError !== null) {
        const firstKey = Object.keys(rawError)[0];
        const firstVal = rawError[firstKey];
        finalMsg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
      }
      
      setError(finalMsg);
      // Ensure local storage remains clean on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(''); setSuccess(''); setLoading(true);
    try {
      await authAPI.sendOTP({ identifier: otpId.trim(), otp_type: otpType });
      setOtpSent(true);
      setSuccess(`OTP sent to your ${otpType}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(''); setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({
        identifier: otpId.trim(),
        otp_code: otpCode.trim(),
      });
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      redirectAfterLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <PremiumCard className="p-8 sm:p-12 space-y-8" hover={false}>
          {/* Header */}
          <div className="text-center space-y-3">
             <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-2xl">
                   <ShieldCheck size={24} />
                </div>
                <span className="font-black text-2xl tracking-tighter text-primary italic">UniTrace</span>
             </div>
             <p className="text-text-secondary font-black text-[10px] uppercase tracking-[4px]">Log in to your account</p>
          </div>

          {/* Tab Switcher */}
          <div className="bg-slate-50 p-1 rounded-2xl flex border border-slate-100">
             {[['password', 'Secure Key'], ['otp', 'Passcode']].map(([t, lbl]) => (
               <button 
                 key={t}
                 onClick={() => { setTab(t); setOtpSent(false); }}
                 className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === t ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:bg-white/50'}`}
               >
                  {lbl}
               </button>
             ))}
          </div>

          <div className="space-y-6">
             <div className="space-y-1">
                <h3 className="text-2xl font-black text-text-primary tracking-tighter uppercase">Welcome Back</h3>
                <p className="text-sm font-medium text-text-secondary">Please provide your credentials to proceed.</p>
             </div>

             {error && (
               <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="p-4 bg-danger/5 text-danger border border-danger/10 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
               </motion.div>
             )}
             {success && (
               <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="p-4 bg-success/5 text-success border border-success/10 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                  <CheckCircle2 size={14} /> {success}
               </motion.div>
             )}

             <AnimatePresence mode="wait">
                {tab === 'password' ? (
                  <motion.form 
                    key="password-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleLogin} 
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Email</label>
                       <div className="relative group">
                          <input 
                            type="email" 
                            required 
                            value={form.identity}
                            onChange={(e) => setForm({...form, identity: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/30 transition-all"
                          />
                          <Mail size={16} className="absolute right-5 top-[18px] text-slate-300 group-focus-within:text-primary transition-colors" />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <div className="flex justify-between items-center ml-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Password</label>
                          <Link to="/forgot-password" size={14} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Forgot password?</Link>
                       </div>
                       <div className="relative group">
                          <input 
                            type={showPass ? 'text' : 'password'} 
                            required 
                            value={form.secret_key}
                            onChange={(e) => setForm({...form, secret_key: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/30 transition-all"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-5 top-[18px] text-slate-300 hover:text-primary transition-colors"
                          >
                             {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                       </div>
                    </div>

                    <button 
                      disabled={loading}
                      className="w-full py-5 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                       {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Login <ArrowRight size={18} /></>}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="otp-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                     {!otpSent ? (
                        <form onSubmit={handleSendOTP} className="space-y-5">
                           <div className="bg-slate-50/50 p-1 rounded-xl flex border border-slate-200/50">
                              {[['email', 'Email'], ['phone', 'Phone']].map(([t, lbl]) => (
                                <button key={t} type="button" onClick={() => setOtpType(t)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${otpType === t ? 'bg-white text-primary shadow-sm' : 'text-text-secondary'}`}>{lbl}</button>
                              ))}
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Registered {otpType}</label>
                              <div className="relative group">
                                 <input 
                                   value={otpId}
                                   onChange={(e) => setOtpId(e.target.value)}
                                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/30 transition-all"
                                 />
                                 {otpType === 'email' ? <Mail size={16} className="absolute right-5 top-[18px] text-slate-300" /> : <Smartphone size={16} className="absolute right-5 top-[18px] text-slate-300" />}
                              </div>
                           </div>
                           <button disabled={loading} className="w-full py-5 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30">
                              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Request Code <Zap size={18} /></>}
                           </button>
                        </form>
                     ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                           <div className="text-center space-y-2">
                              <div className="w-16 h-16 bg-slate-100 rounded-[24px] flex items-center justify-center mx-auto text-primary">
                                 <Fingerprint size={32} />
                              </div>
                              <h4 className="font-black uppercase tracking-widest text-xs text-text-primary">Verification Code Sent</h4>
                              <p className="text-xs font-medium text-text-secondary">Confirm identity with the 6-digit passcode.</p>
                           </div>
                           <input 
                             value={otpCode}
                             onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                             className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 text-center text-4xl font-black tracking-[12px] outline-none focus:border-primary/30 transition-all"
                           />
                           <div className="space-y-3">
                              <button disabled={loading || otpCode.length !== 6} className="w-full py-5 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 disabled:opacity-50">
                                 {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Grant Access <CheckCircle2 size={18} /></>}
                              </button>
                              <button type="button" onClick={() => setOtpSent(false)} className="w-full text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors">Wrong Identity? Change Target</button>
                           </div>
                        </form>
                     )}
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="pt-4 border-t border-slate-50 text-center">
             <p className="font-black uppercase text-[10px] tracking-[2px] text-text-secondary">
                Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign Up</Link>
             </p>
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  );
};

export default Login;