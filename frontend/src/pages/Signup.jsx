import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', department: '',
    section: '', college_year: '', college_name: '', password: '', confirm_password: '',
    terms_accepted: false,
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(''); // ''|'checking'|'available'|'taken'
  const usernameTimer = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => { 
      const n = { ...p }; 
      n[name] = type === 'checkbox' ? checked : value; 
      return n; 
    });
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setGlobalError('');
  };

  const handleUsername = (e) => {
    const val = e.target.value.replace(/\s/g, '').slice(0, 20);
    setForm(p => ({ ...p, username: val }));
    clearTimeout(usernameTimer.current);
    if (val.length < 3) { setUsernameStatus(''); return; }
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      try {
        const { data } = await authAPI.checkUsername(val);
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch { setUsernameStatus(''); }
    }, 500);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.phone.length !== 10) e.phone = '10 digits required';
    if (!form.password || form.password.length < 8) e.password = 'Min 8 chars';
    if (form.password !== form.confirm_password) e.confirm_password = 'Mismatch';
    if (!form.terms_accepted) e.terms_accepted = 'Accept terms';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) return setErrors(v);
    setLoading(true);
    try {
      await register({ ...form, phone: `+91${form.phone}` });
      navigate('/');
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans overflow-x-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl relative z-10"
      >
        <PremiumCard className="p-8 sm:p-12 overflow-hidden" hover={false}>
          <div className="flex flex-col md:flex-row gap-12">
            
            {/* Left Col: Brand / Intro */}
            <div className="flex-1 space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-xl rotate-12">
                        <Sparkles size={24} />
                     </div>
                     <span className="font-black text-2xl tracking-tighter text-primary italic">CampusTrace</span>
                  </div>
                  <h2 className="text-4xl font-black text-text-primary tracking-tighter leading-[1.1] uppercase">Create your <span className="text-primary">Hero</span> account.</h2>
                  <p className="text-text-secondary font-medium text-sm">Join thousands of students securing their campus belongings with AI.</p>
               </div>

               <div className="space-y-4 hidden md:block pt-8">
                  {[
                    { icon: ShieldCheck, text: 'AI-Powered Security', color: 'text-success' },
                    { icon: Zap, text: 'Real-time Claims', color: 'text-amber-500' },
                    { icon: User, text: 'Verified Community', color: 'text-primary' }
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-text-secondary opacity-60">
                       <f.icon size={16} className={f.color} /> {f.text}
                    </div>
                  ))}
               </div>
            </div>

            {/* Right Col: Form */}
            <div className="flex-[1.2] space-y-6">
               {globalError && (
                 <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="p-4 bg-danger/5 text-danger border border-danger/10 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                    <AlertCircle size={14} /> {globalError}
                 </motion.div>
               )}

               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Full Name</label>
                        <div className="relative group">
                           <input 
                             name="name" 
                             value={form.name} 
                             onChange={handleChange}
                             placeholder="John Doe"
                             className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none group-focus-within:border-primary/30 transition-all"
                           />
                           <User size={14} className="absolute right-4 top-4 text-slate-300 group-focus-within:text-primary" />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Username</label>
                        <div className="relative group">
                           <input 
                              value={form.username} 
                              onChange={handleUsername}
                              placeholder="johndoe"
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none group-focus-within:border-primary/30 transition-all"
                           />
                           {usernameStatus === 'available' ? <CheckCircle2 size={14} className="absolute right-4 top-4 text-success" /> : <ShieldCheck size={14} className="absolute right-4 top-4 text-slate-300" />}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">University Email</label>
                     <div className="relative group">
                        <input 
                           name="email" 
                           type="email" 
                           value={form.email} 
                           onChange={handleChange}
                           placeholder="student@university.edu"
                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none group-focus-within:border-primary/30 transition-all"
                        />
                        <Mail size={14} className="absolute right-4 top-4 text-slate-300 group-focus-within:text-primary" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Mobile</label>
                        <div className="relative group">
                           <input 
                             value={form.phone} 
                             onChange={(e) => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                             placeholder="9876543210"
                             className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none group-focus-within:border-primary/30 transition-all"
                           />
                           <Phone size={14} className="absolute right-4 top-4 text-slate-300" />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Year</label>
                        <select 
                          name="college_year" 
                          value={form.college_year} 
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary/30 transition-all appearance-none"
                        >
                           <option value="">Year</option>
                           {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Password</label>
                     <div className="relative group">
                        <input 
                           name="password" 
                           type={showPassword ? 'text' : 'password'}
                           value={form.password} 
                           onChange={handleChange}
                           placeholder="••••••••"
                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none group-focus-within:border-primary/30 transition-all"
                        />
                        <button 
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 top-4 text-slate-300"
                        >
                           {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                     </div>
                  </div>

                  <div className="relative flex items-start gap-3 py-2">
                     <input 
                        type="checkbox" 
                        name="terms_accepted" 
                        checked={form.terms_accepted} 
                        onChange={handleChange}
                        className="w-5 h-5 rounded-lg border-slate-200 mt-0.5 accent-primary cursor-pointer"
                     />
                     <p className="text-[9px] font-bold text-text-secondary uppercase leading-relaxed">
                        I agree to the <Link to="/terms" className="text-primary underline">Terms of Protocol</Link> and represent my campus community.
                     </p>
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full py-5 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                     {loading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                     ) : (
                        <>Establish Identity <ArrowRight size={18} /></>
                     )}
                  </button>

                  <p className="text-center font-black uppercase text-[10px] tracking-widest text-text-secondary">
                     Secured Member? <Link to="/login" className="text-primary hover:underline">Sign In Protocol</Link>
                  </p>
               </form>
            </div>
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  );
};

export default Signup;