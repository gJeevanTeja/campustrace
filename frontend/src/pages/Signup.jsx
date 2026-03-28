import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { 
  Sparkles,
  Info,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const DEPARTMENTS = ['CSE General', 'Data Science', 'AIML', 'IT', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Other'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', department: '',
    section: '', college_year: '', college_name: 'Malla Reddy University', password: '', confirm_password: '',
    terms_accepted: false, roll_number: '', gender: ''
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(''); // ''|'checking'|'available'|'taken'
  const usernameTimer = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setGlobalError('');
  };

  const handleUsername = (e) => {
    const val = e.target.value.replace(/\s/g, '').slice(0, 20);
    setForm(p => ({ ...p, username: val }));
    clearTimeout(usernameTimer.current);
    if (errors.username) setErrors(p => ({ ...p, username: '' }));
    
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
    if (!form.name.trim()) e.name = 'Full Name is required';
    
    if (!form.username.trim()) {
      e.username = 'Username is required';
    } else if (usernameStatus === 'taken') {
      e.username = 'Username is already taken';
    } else if (form.username.length < 3) {
      e.username = 'Min 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      e.email = 'Email is required';
    } else if (!emailRegex.test(form.email)) {
      e.email = 'Invalid email format';
    }

    if (!form.roll_number.trim()) e.roll_number = 'Roll Number is required';
    if (!form.department) e.department = 'Department is required';
    if (!form.college_year) e.college_year = 'Year is required';

    if (!form.phone || form.phone.length !== 10) e.phone = '10 digits required';
    
    // Password validation: min 8 chars, number, special char
    if (!form.password) {
      e.password = 'Password is required';
    } else {
      if (form.password.length < 8) e.password = 'Min 8 characters';
      else if (!/\d/.test(form.password)) e.password = 'Must include number';
      else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) e.password = 'Must include special char';
    }

    if (form.password !== form.confirm_password) {
      e.confirm_password = 'Passwords do not match';
    }
    
    if (!form.terms_accepted) {
      e.terms_accepted = 'You must accept the terms';
    }

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) return setErrors(v);
    
    setLoading(true);
    setGlobalError('');
    try {
      await register({ 
        ...form, 
        student_id: form.roll_number, // Mapping to backend model
        phone: `+91${form.phone}` 
      });
      navigate('/');
    } catch (err) {
      let errorMsg = 'Registration failed. User may already exist.';
      if (err.response?.data) {
         if (typeof err.response.data === 'object') {
            const firstError = Object.values(err.response.data)[0];
            if (Array.isArray(firstError)) errorMsg = firstError[0];
            else if (typeof firstError === 'string') errorMsg = firstError;
            else if (err.response.data.message) errorMsg = err.response.data.message;
            else if (err.response.data.detail) errorMsg = err.response.data.detail;
         }
      }
      setGlobalError(errorMsg);
    } finally { 
      setLoading(false); 
    }
  };

  const inputClass = (err) => `w-full px-4 py-3 rounded-xl border ${err ? 'border-red-500' : 'border-slate-200'} bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium`;
  const labelClass = "block text-sm font-bold text-slate-800 mb-1.5";
  const errorClass = "text-red-500 text-xs font-bold mt-1.5";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[650px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.05)] relative z-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
             <Sparkles className="text-white" size={24} />
          </div>
          <div>
             <h2 className="text-[22px] font-extrabold text-slate-800 m-0 leading-tight">Create Student Account</h2>
             <p className="text-[13px] text-slate-500 m-0 mt-0.5">Join our verified community to secure your belongings.</p>
          </div>
        </div>

        {globalError && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold mb-6">
             {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className={labelClass}>Full Name *</label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange}
                  placeholder="Official name"
                  className={inputClass(errors.name)} 
                />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
             </div>
             <div>
                <label className={labelClass}>Username *</label>
                <div className="relative">
                   <input 
                     value={form.username} 
                     onChange={handleUsername}
                     placeholder="unique_username"
                     className={inputClass(errors.username)} 
                   />
                   <div className="absolute right-3 top-3.5">
                     {usernameStatus === 'available' ? <CheckCircle2 size={16} className="text-green-500" /> : usernameStatus === 'taken' || usernameStatus === 'checking' ? <ShieldCheck size={16} className="text-slate-300" /> : null}
                   </div>
                </div>
                {errors.username && <p className={errorClass}>{errors.username}</p>}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className={labelClass}>University Email *</label>
                <input 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChange}
                  placeholder="name@college.edu"
                  className={inputClass(errors.email)} 
                />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
             </div>
             <div>
                <label className={labelClass}>Phone Number *</label>
                <input 
                  value={form.phone} 
                  onChange={(e) => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                  placeholder="+91 00000 00000"
                  className={inputClass(errors.phone)} 
                />
                {errors.phone && <p className={errorClass}>{errors.phone}</p>}
             </div>
          </div>

          <div>
             <label className={labelClass}>Roll Number *</label>
             <input 
               name="roll_number"
               value={form.roll_number}
               onChange={handleChange}
               placeholder="Your official ID"
               className={`${inputClass(errors.roll_number)} uppercase`} 
             />
             {errors.roll_number && <p className={errorClass}>{errors.roll_number}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div>
                <label className={labelClass}>Department *</label>
                <select 
                  name="department" 
                  value={form.department} 
                  onChange={handleChange}
                  className={inputClass(errors.department)}
                >
                   <option value="">Select Dept</option>
                   {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p className={errorClass}>{errors.department}</p>}
             </div>
             <div>
                <label className={labelClass}>Year *</label>
                <select 
                  name="college_year" 
                  value={form.college_year} 
                  onChange={handleChange}
                  className={inputClass(errors.college_year)}
                >
                   <option value="">Select Year</option>
                   {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.college_year && <p className={errorClass}>{errors.college_year}</p>}
             </div>
             <div>
                <label className={labelClass}>Gender</label>
                <select 
                  name="gender" 
                  value={form.gender} 
                  onChange={handleChange}
                  className={inputClass(errors.gender)}
                >
                   <option value="">Select Gender</option>
                   {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className={labelClass}>Password *</label>
                <div className="relative">
                   <input 
                     name="password" 
                     type={showPassword ? 'text' : 'password'}
                     value={form.password} 
                     onChange={handleChange}
                     placeholder="Must be strong"
                     className={inputClass(errors.password)} 
                   />
                   <button 
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                   >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                </div>
                {errors.password && <p className={errorClass}>{errors.password}</p>}
             </div>
             <div>
                <label className={labelClass}>Confirm Password *</label>
                <div className="relative">
                   <input 
                     name="confirm_password" 
                     type={showConfirmPassword ? 'text' : 'password'}
                     value={form.confirm_password} 
                     onChange={handleChange}
                     placeholder="Repeat password"
                     className={inputClass(errors.confirm_password)} 
                   />
                   <button 
                     type="button"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                   >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                </div>
                {errors.confirm_password && <p className={errorClass}>{errors.confirm_password}</p>}
             </div>
          </div>

          <div className="mt-6 mb-8 bg-slate-50 p-4 rounded-xl flex gap-3 items-start border border-slate-100">
             <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
             <div>
                <div className="flex items-start gap-2 mb-1">
                   <input 
                     type="checkbox" 
                     name="terms_accepted" 
                     checked={form.terms_accepted} 
                     onChange={handleChange}
                     className="mt-1 w-4 h-4 cursor-pointer accent-blue-600"
                   />
                   <span className="font-bold text-slate-800 text-sm">
                      I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Protocol</Link> *
                   </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed ml-6">
                   By creating an account, your identity proofs and academic details will be securely stored to verify you belong to this campus community.
                </p>
                {errors.terms_accepted && <p className="text-red-500 text-xs font-bold mt-1.5 ml-6">{errors.terms_accepted}</p>}
             </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-extrabold text-base shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
             {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
             ) : (
                '🚀 Create Account'
             )}
          </button>

          <p className="text-center mt-6 text-sm font-bold text-slate-500">
             Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;