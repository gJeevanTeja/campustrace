import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, itemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, 
  Settings, 
  LogOut, 
  Trophy, 
  Package, 
  CheckCircle, 
  ChevronRight, 
  User, 
  Mail, 
  Smartphone, 
  GraduationCap, 
  Lock, 
  Trash2, 
  MapPin,
  Clock,
  Sparkles,
  Shield,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [claimedItems, setClaimedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posted');
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [toast, setToast] = useState(null);
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm_new_password: '' });
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, iRes] = await Promise.all([
          authAPI.getProfile(),
          itemsAPI.getMyItems(),
        ]);
        setProfile(pRes.data);
        const items = Array.isArray(iRes.data) ? iRes.data : (iRes.data.results || []);
        setMyItems(items);
        setClaimedItems(items.filter(i => i.status === 'claimed' && i.claimed_by));
      } catch {
        setProfile(user || {});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteItem = async (e, itemId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this item?')) return;
    try {
      await itemsAPI.delete(itemId);
      setMyItems(prev => prev.filter(i => i.id !== itemId));
      setClaimedItems(prev => prev.filter(i => i.id !== itemId));
      showToast('Item removed ✓');
    } catch { showToast('Failed to delete', true); }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setAvatarLoading(true);
    setShowPhotoMenu(false);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await authAPI.updateAvatar(formData);
      const url = data.avatar_url || data.avatar;
      setProfile(p => ({ ...p, avatar: url }));
      if (updateUser) updateUser({ ...user, avatar: url });
      showToast('Photo updated ✓');
    } catch { showToast('Upload failed', true); }
    finally { setAvatarLoading(false); }
  };

  const saveEdit = async () => {
    if (!editField) return;
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile({ [editField]: editValue });
      const updated = data.user || data;
      setProfile(p => ({ ...p, ...updated }));
      if (updateUser) updateUser({ ...user, [editField]: editValue });
      showToast('Saved ✓');
      setEditField(null);
    } catch (e) { showToast('Save failed', true); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.new_password !== pwdForm.confirm_new_password) return setPwdError('Passwords do not match');
    if (pwdForm.new_password.length < 6) return setPwdError('Password too short (min 6 chars)');
    
    setSaving(true);
    try {
      await authAPI.changePassword(pwdForm);
      showToast('Password updated ✓');
      setShowPwdForm(false);
      setPwdForm({ old_password: '', new_password: '', confirm_new_password: '' });
    } catch (e) { 
      setPwdError(e.response?.data?.error || 'Update failed. Check current password.'); 
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return (
     <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="font-bold text-text-secondary">Loading Profile...</p>
     </div>
  );

  const p = profile || {};
  const currentItems = activeTab === 'posted' ? myItems : claimedItems;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      {/* Hero Section */}
      <section className="relative glass-effect rounded-[40px] p-8 sm:p-12 overflow-hidden bg-primary-gradient text-white shadow-2xl">
         <div className="absolute top-0 right-0 p-12 text-white/10 -mr-12 -mt-12 rotate-45">
            <User size={180} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[40px] border-4 border-white/20 overflow-hidden bg-slate-800 flex items-center justify-center text-4xl font-black shadow-2xl relative">
                    {p.avatar || p.google_picture ? (
                        <img src={p.avatar || p.google_picture} className={`w-full h-full object-cover transition-opacity ${avatarLoading ? 'opacity-40' : 'opacity-100'}`} alt="" />
                    ) : (p.name?.[0]?.toUpperCase() || 'U')}
                    
                    {avatarLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                    )}
                </div>
                <button 
                  onClick={() => setShowPhotoMenu(true)}
                  disabled={avatarLoading}
                  className="absolute bottom-2 right-2 p-3 bg-white text-primary rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Camera size={20} />
                </button>
            </div>
            <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase">{p.name || 'Anonymous'}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                   <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10">@{p.username}</span>
                   <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-widest">{p.department}</span>
                </div>
                <div className="pt-4 flex gap-4">
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[100px]">
                      <p className="text-[10px] font-black uppercase opacity-60">Success Rate</p>
                      <p className="text-xl font-black">94%</p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[100px]">
                      <p className="text-[10px] font-black uppercase opacity-60">Karma Points</p>
                      <p className="text-xl font-black">{p.reward_points || 0}</p>
                   </div>
                </div>
            </div>
         </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Stats & My Items */}
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Posted', val: myItems.length, icon: Package, color: 'text-primary' },
                { label: 'Resolved', val: claimedItems.length, icon: CheckCircle, color: 'text-success' },
                { label: 'Rank', val: '#12', icon: Trophy, color: 'text-amber-500' },
                { label: 'Level', val: p.level || 'Silver', icon: Sparkles, color: 'text-secondary' },
              ].map((s, i) => (
                <PremiumCard key={i} className="p-5 text-center flex flex-col items-center justify-center gap-2">
                   <s.icon size={24} className={s.color} />
                   <p className="text-xs font-black uppercase opacity-60 tracking-widest">{s.label}</p>
                   <p className="text-2xl font-black">{s.val}</p>
                </PremiumCard>
              ))}
           </div>

           <div className="bg-white rounded-[32px] border border-border overflow-hidden shadow-sm">
              <div className="flex border-b border-border">
                  {[
                    { id: 'posted', lbl: `My Submissions (${myItems.length})` },
                    { id: 'claimed', lbl: `Claimed by Me (${claimedItems.length})` }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-50 text-primary border-b-4 border-primary' : 'text-text-secondary hover:bg-slate-50'}`}
                    >
                      {tab.lbl}
                    </button>
                  ))}
              </div>
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto no-scrollbar">
                  {currentItems.length === 0 ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="text-4xl">📦</div>
                        <p className="text-sm font-bold text-text-secondary">No items found in this category.</p>
                        <button onClick={() => navigate('/report')} className="text-primary font-black text-xs uppercase hover:underline">Report Something Now</button>
                    </div>
                  ) : (
                    currentItems.map((item, idx) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors"
                      >
                         <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/item/${item.id}`)}>
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                               {item.image_url ? (
                                 <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                               )}
                            </div>
                            <div className="min-w-0">
                               <h4 className="font-black text-text-primary text-base truncate group-hover:text-primary transition-colors">{item.title}</h4>
                               <div className="flex items-center gap-3 text-[10px] font-bold text-text-secondary uppercase">
                                  <span className="flex items-center gap-1"><MapPin size={10} /> {item.location_name || 'Campus'}</span>
                                  <span className="flex items-center gap-1"><Clock size={10} /> {item.time_ago}</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${item.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                               {item.status}
                            </span>
                            {activeTab === 'posted' && (
                               <button onClick={(e) => handleDeleteItem(e, item.id)} className="p-2.5 text-danger bg-danger/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-danger/10">
                                  <Trash2 size={16} />
                               </button>
                            )}
                         </div>
                      </motion.div>
                    ))
                  )}
              </div>
           </div>
        </div>

        {/* Right: Settings & Details */}
        <div className="space-y-8">
           <PremiumCard className="p-8 space-y-6" hover={false}>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                 <Settings size={18} className="text-primary" /> Account Details
              </h3>
              <div className="space-y-4">
                 {[
                   { id: 'name', lbl: 'Full Name', val: p.name, icon: User, edit: true },
                   { id: 'username', lbl: 'Username', val: p.username, icon: Shield, edit: true },
                   { id: 'email', lbl: 'Email', val: p.email, icon: Mail, edit: false },
                   { id: 'phone', lbl: 'Mobile', val: p.phone, icon: Smartphone, edit: true },
                   { id: 'department', lbl: 'Dept', val: p.department, icon: GraduationCap, edit: false },
                 ].map(f => (
                   <div key={f.id} className="p-4 bg-slate-50 rounded-2xl group transition-all">
                      <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center gap-2 text-[10px] font-black text-text-secondary uppercase tracking-widest">
                            <f.icon size={12} /> {f.lbl}
                         </div>
                         {f.edit && (
                           <button onClick={() => { setEditField(f.id); setEditValue(f.val || ''); }} className="opacity-0 group-hover:opacity-100 transition-all text-primary font-black text-[10px]">EDIT</button>
                         )}
                      </div>
                      <p className="font-bold text-text-primary truncate">{f.val || '—'}</p>
                   </div>
                 ))}
              </div>
              <button 
                onClick={logout}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-danger bg-danger/5 border border-danger/10 hover:bg-danger/10 transition-all active:scale-95"
              >
                  <LogOut size={20} /> SIGN OUT
              </button>
           </PremiumCard>

           <PremiumCard className="p-8 space-y-6" hover={false}>
              <button 
                onClick={() => setShowPwdForm(!showPwdForm)}
                className="w-full flex items-center justify-between group"
              >
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                       <Lock size={18} />
                    </div>
                    <span className="font-black text-sm uppercase tracking-tighter">Security Settings</span>
                 </div>
                 <ChevronRight size={18} className={`transition-transform duration-300 ${showPwdForm ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                 {showPwdForm && (
                   <motion.form 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden space-y-4 pt-2"
                     onSubmit={handleChangePassword}
                   >
                      {pwdError && (
                         <div className="bg-danger/10 text-danger text-[10px] font-black uppercase tracking-widest p-3 rounded-xl border border-danger/10">
                            {pwdError}
                         </div>
                      )}
                      <input 
                        type="password" 
                        placeholder="Current Password" 
                        required
                        className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                        onChange={(e) => setPwdForm({...pwdForm, old_password: e.target.value})}
                      />
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        required
                        className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                        onChange={(e) => setPwdForm({...pwdForm, new_password: e.target.value})}
                      />
                      <input 
                        type="password" 
                        placeholder="Confirm Password" 
                        required
                        className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                        onChange={(e) => setPwdForm({...pwdForm, confirm_new_password: e.target.value})}
                      />
                      <button 
                        disabled={saving}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {saving ? 'Updating...' : 'Update Password'}
                      </button>
                   </motion.form>
                 )}
              </AnimatePresence>
           </PremiumCard>
        </div>
      </div>

           {/* Rewards Section */}
           <PremiumCard className="p-8 space-y-6" hover={false}>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                 <Trophy size={18} className="text-amber-500" /> Rewards
              </h3>
              <div className="space-y-4">
                 <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black uppercase text-amber-700">Reward Points</span>
                       <span className="text-2xl font-black text-amber-600">{p.reward_points || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black uppercase text-amber-700">Level</span>
                       <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">{p.level || 'Beginner Helper'}</span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
                       <div className="bg-amber-500 h-2 rounded-full transition-all duration-700" style={{ width: Math.min(100, Math.round(((p.reward_points || 0) % 300) / 3)) + '%' }} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-border">
                       <p className="text-2xl font-black text-primary">{p.successful_returns || 0}</p>
                       <p className="text-[10px] font-black uppercase text-text-secondary mt-1">Items Returned</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-border">
                       <p className="text-2xl font-black text-amber-600">{(p.badges || []).length}</p>
                       <p className="text-[10px] font-black uppercase text-text-secondary mt-1">Badges</p>
                    </div>
                 </div>
                 {(p.badges || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                       {(p.badges || []).map((badge, i) => (
                          <span key={i} className="text-xs font-black bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl">{badge}</span>
                       ))}
                    </div>
                 ) : (
                    <p className="text-xs font-bold text-text-secondary text-center py-2">Return items to earn badges!</p>
                 )}
              </div>
           </PremiumCard>

      {/* Popups */}
      <AnimatePresence>
        {editField && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[40px] p-8 max-w-sm w-full space-y-6 shadow-3xl">
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-text-primary">Edit {editField}</h2>
                 <input 
                   value={editValue} 
                   onChange={(e) => setEditValue(e.target.value)} 
                   autoFocus
                   className="w-full bg-slate-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                 />
                 <div className="flex gap-3">
                    <button onClick={() => setEditField(null)} className="flex-1 py-4 font-bold text-text-secondary bg-slate-100 rounded-2xl">Cancel</button>
                    <button 
                      onClick={saveEdit} 
                      disabled={saving}
                      className="flex-2 py-4 font-black text-white bg-primary rounded-2xl shadow-xl shadow-primary/20 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'SAVING...' : 'Save Changes'}
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}

        {showPhotoMenu && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowPhotoMenu(false)} className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-[40px] p-8 w-full max-w-lg space-y-6 pb-12 shadow-3xl">
                 <h2 className="text-xl font-black uppercase tracking-widest text-text-primary text-center">Update Profile Image</h2>
                 <div className="grid grid-cols-2 gap-4">
                    <label className="p-8 border-2 border-dashed border-primary/20 bg-primary/5 rounded-3xl flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-primary transition-all">
                       <Camera size={32} className="text-primary group-hover:scale-110 transition-transform" />
                       <span className="text-xs font-black uppercase text-primary">Camera</span>
                       <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                    </label>
                    <label className="p-8 border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-slate-400 transition-all">
                       <ImageIcon size={32} className="text-slate-400 group-hover:scale-110 transition-transform" />
                       <span className="text-xs font-black uppercase text-text-secondary">Gallery</span>
                       <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                    </label>
                 </div>
                 <button onClick={() => setShowPhotoMenu(false)} className="w-full py-4 font-bold text-text-secondary">Close</button>
              </motion.div>
           </motion.div>
        )}

        {toast && (
           <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm ${toast.isError ? 'bg-danger text-white' : 'bg-success text-white'}`}>
              <CheckCircle size={18} /> {toast.msg}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;