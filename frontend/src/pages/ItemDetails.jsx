import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsAPI, chatAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import GoogleLocationCard from '../components/LocationCard';
import ClaimVerification from '../components/ClaimVerification';
import { 
  ChevronLeft, 
  Share2, 
  MessageSquare, 
  Phone, 
  ExternalLink, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Brain, 
  Calendar,
  AlertCircle,
  QrCode,
  PartyPopper,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lastItemUpdate } = useNotifications();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const rewardShownRef = useRef(false); // prevent double-showing the popup
  const prevStatusRef = useRef(null);   // track previous item.status to detect transition

  const fetchItem = useCallback(async () => {
    try {
      const res = await itemsAPI.getById(id);
      setItem(res.data);
    } catch {
      setError('Item not found or has been removed.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  useEffect(() => {
    if (lastItemUpdate && String(lastItemUpdate.itemId) === String(id)) {
      fetchItem();
    }
  }, [lastItemUpdate, id, fetchItem]);

  // ── Founder Reward Popup ─────────────────────────────────────────
  // Triggers ONLY when item status transitions to 'returned' while founder is on the page.
  // Uses authAPI.getProfile() to get fresh reward data — no WebSocket dependency.
  useEffect(() => {
    if (!item || !user) return;

    const currentStatus = item.status;
    const previousStatus = prevStatusRef.current;
    prevStatusRef.current = currentStatus;

    // Only react when status CHANGES to 'returned' (not on initial load if already returned)
    if (currentStatus !== 'returned') return;
    if (previousStatus === 'returned' || previousStatus === null) return;
    if (rewardShownRef.current) return;

    const amIFounder = item.user?.id === user.id || item.user === user.id;
    if (!amIFounder) return;

    rewardShownRef.current = true;
    authAPI.getProfile().then(res => {
      const p = res.data;
      setRewardData({
        points_earned: 100,
        total_points: p.reward_points || 0,
        level: p.level || 'Beginner Helper',
        new_badges: p.badges || [],
        items_returned: p.successful_returns || 0,
      });
      setShowSuccess(true);
    }).catch(() => {
      setShowSuccess(true); // show simple congratulations even if profile fetch fails
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.status]);

  const isLost = item?.type === 'lost';
  const isElectronic = item?.is_electronics === true;

  const startAIVerification = async () => {
    setClaiming(true);
    try {
      await itemsAPI.verifyClaim(id);
      navigate(`/ai-verification/${id}`);
    } catch (e) {
      alert(e.response?.data?.error || 'Could not initiate AI verification.');
    } finally {
      setClaiming(false);
    }
  };

  const startNormalClaimFlow = async () => {
    if (!window.confirm('Are you sure you want to claim this item?')) return;
    setClaiming(true);
    try {
      await itemsAPI.verifyClaim(id);
      const updated = await itemsAPI.getById(id);
      setItem(updated.data);
      alert('Claim request sent to the founder for approval.');
    } catch (e) {
      alert(e.response?.data?.error || 'Could not initiate claim.');
    } finally {
      setClaiming(false);
    }
  };

  const handleApproveClaim = async (claimId) => {
    if (!window.confirm('Approve this claimant as the rightful owner?')) return;
    try {
      await itemsAPI.approveClaim(claimId);
      const res = await itemsAPI.getById(id);
      setItem(res.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to approve claim.');
    }
  };

  const handleRejectClaim = async (claimId) => {
    if (!window.confirm('Reject this claim?')) return;
    try {
      await itemsAPI.rejectClaim(claimId);
      const res = await itemsAPI.getById(id);
      setItem(res.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to reject claim.');
    }
  };

  const handleConfirmReceipt = async (code) => {
    setConfirming(true);
    try {
      const res = await itemsAPI.confirmReturn(id, code);
      // This API is called by the claimant (lost person).
      // For FOUND items: item.user=founder gets reward via WebSocket — claimant sees nothing here.
      // For LOST items: claimant IS the finder, so is_yours===true → show reward popup to them.
      if (res.data?.reward?.is_yours === true) {
        setRewardData(res.data.reward);
        setShowSuccess(true);
      }
      // Just refresh the item status — no popup for the lost person
      const updated = await itemsAPI.getById(id);
      setItem(updated.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Invalid code.');
    } finally {
      setConfirming(false);
    }
  };

  const handleStartChat = async () => {
    if (user && item && (item.user?.id === user.id || item.user === user.id)) {
      return alert("You can't chat with yourself.");
    }
    try {
      const res = await chatAPI.startChat({ item_id: item.id });
      const roomId = res.data.id || res.data.room_id;
      navigate(`/chat/${roomId}`);
    } catch (e) {
      alert(e?.response?.data?.error || 'Could not start chat.');
    } finally {
      // Chat started
    }
  };

  const handleCall = () => {
    const phone = item?.contact_phone || item?.user?.phone;
    if (!phone) return alert('No phone number available');
    window.location.href = `tel:+91${phone.replace(/\D/g, '').slice(-10)}`;
  };

  const handleWhatsApp = () => {
    const phone = item?.contact_phone || item?.user?.phone;
    if (!phone) return alert('No phone number available');
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    const msg = encodeURIComponent(`Hi, I saw your ${item.type} item "${item.title}" on CampusTrace.`);
    window.open(`https://wa.me/91${cleaned}?text=${msg}`, '_blank');
  };

  const allPhotos = item ? [
    item.image_url,
    ...(item.photos?.filter(p => !p.is_primary).map(p => p.photo_url) || []),
  ].filter(Boolean) : [];

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-text-secondary font-bold">Synchronizing details...</p>
     </div>
  );

  if (error || !item) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
       <div className="text-6xl mb-6">😕</div>
       <h2 className="text-2xl font-black text-text-primary mb-2">Item Missing</h2>
       <p className="text-text-secondary mb-8">{error || 'This item could not be retrieved.'}</p>
       <button onClick={() => navigate(-1)} className="bg-primary text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
          Go Back
       </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-40 py-4 border-b border-border -mx-4 px-4 sm:mx-0 sm:rounded-2xl sm:border sm:px-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-text-primary truncate max-w-[150px] sm:max-w-sm">{item.title}</h1>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${item.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {item.status}
                </span>
                <span className="text-[10px] font-bold text-text-secondary uppercase">#{item.reference_number}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-text-secondary">
                <Share2 size={20} />
            </button>
        </div>
      </div>

      {item.status === 'returned' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500 text-white p-6 rounded-3xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-4 border border-emerald-400"
        >
          <PartyPopper size={32} />
          <span className="text-lg font-black uppercase tracking-tighter">This item was successfully returned!</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Media & Actions */}
        <div className="lg:col-span-12 xl:col-span-12 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
             {/* Media Gallery */}
             <div className="space-y-4">
                <div className="aspect-video relative rounded-3xl overflow-hidden border border-border shadow-xl bg-gray-100 group">
                   <AnimatePresence mode="wait">
                      <motion.img 
                        key={activePhoto}
                        src={allPhotos[activePhoto]} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full object-cover"
                        alt={item.title}
                      />
                   </AnimatePresence>
                   <div className={`absolute top-4 left-4 px-4 py-1.5 rounded-xl font-black text-xs text-white uppercase shadow-lg ${isLost ? 'bg-danger' : 'bg-success'}`}>
                      {item.type}
                   </div>
                   {allPhotos.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-full">
                         {allPhotos.map((_, i) => (
                            <button 
                              key={i} 
                              onClick={() => setActivePhoto(i)}
                              className={`w-2 h-2 rounded-full transition-all ${i === activePhoto ? 'w-6 bg-white' : 'bg-white/50'}`}
                            />
                         ))}
                      </div>
                   )}
                </div>
                {allPhotos.length > 1 && (
                   <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {allPhotos.map((photo, i) => (
                         <button 
                           key={i} 
                           onClick={() => setActivePhoto(i)}
                           className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${i === activePhoto ? 'border-primary shadow-lg scale-105' : 'border-transparent opacity-60'}`}
                         >
                            <img src={photo} className="w-full h-full object-cover" alt="" />
                         </button>
                      ))}
                   </div>
                )}
             </div>

             {/* Basic Info & Controls */}
             <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
                   <div className="flex flex-wrap gap-2 mb-6">
                      <span className="bg-primary/5 text-primary text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider border border-primary/10">
                        {item.category}
                      </span>
                      <span className="bg-secondary/5 text-secondary text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider border border-secondary/10">
                        {item.status}
                      </span>
                   </div>
                   <h2 className="text-3xl font-black text-text-primary mb-4 leading-tight">{item.title}</h2>
                   <p className="text-text-secondary text-lg leading-relaxed mb-6">{item.description}</p>
                   
                   <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                            <Calendar size={18} />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-text-secondary uppercase">Date Reported</p>
                            <p className="text-sm font-black text-text-primary">{new Date(item.created_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-secondary">
                            <Clock size={18} />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-text-secondary uppercase">Time Ago</p>
                            <p className="text-sm font-black text-text-primary">{item.time_ago}</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Main Action Area */}
                <div className="flex flex-col gap-4">
                   {item.can_be_claimed && !item.my_claim && (
                      <button 
                        onClick={isElectronic ? startAIVerification : startNormalClaimFlow}
                        disabled={claiming}
                        className="w-full bg-primary text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                         {claiming ? (
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         ) : (
                             <>
                               {isElectronic ? <Brain size={24} /> : <CheckCircle2 size={24} />}
                               {isElectronic ? 'Verify Claim with AI' : 'Claim This Item'}
                             </>
                         )}
                      </button>
                   )}

                   {item.status === 'active' && !(user && (item.user?.id === user.id || item.user === user.id)) && (
                      <div className="grid grid-cols-3 gap-3">
                         <button 
                           onClick={handleStartChat}
                           className="bg-white border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold group"
                         >
                            <MessageSquare className="text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] uppercase">Chat</span>
                         </button>
                         <button 
                           onClick={handleCall}
                           className="bg-white border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold group"
                         >
                            <Phone className="text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] uppercase">Call</span>
                         </button>
                         <button 
                           onClick={handleWhatsApp}
                           className="bg-white border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold group"
                         >
                            <ExternalLink className="text-cyan-500 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] uppercase">WhatsApp</span>
                         </button>
                      </div>
                   )}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Location Card */}
              <div className="space-y-4">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    Discovery Location
                  </h3>
                  <GoogleLocationCard item={item} />
              </div>

              {/* Progress & Verification */}
              <div className="space-y-6">
                {/* Status Stepper */}
                <PremiumCard className="p-8" hover={false}>
                   <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-6">Tracking Timeline</h3>
                   <div className="space-y-6 relative ml-2">
                      <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-100" />
                      {[
                        { label: 'Item Reported', active: true, desc: 'Initial report submitted to network' },
                        { label: 'Claim Initiated', active: item.status === 'returned' || !!item.my_claim || item.pending_claims?.length > 0 || !!item.claimed_by, desc: 'Security questions or manual claim started' },
                        { label: 'Founder Verified', active: item.status === 'returned' || item.my_claim?.status === 'verified' || item.pending_claims?.some(c => c.status === 'verified') || !!item.claimed_by, desc: 'Ownership confirmed by the founder' },
                        { label: 'Handoff Complete', active: item.status === 'returned', desc: 'Secure exchange code verified' },
                      ].map((step, i) => (
                        <div key={i} className="flex gap-4 relative z-10">
                           <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 transition-all duration-300 ${step.active ? 'bg-primary shadow-lg shadow-primary/30 scale-125' : 'bg-slate-200 shadow-inner'}`} />
                           <div>
                              <p className={`text-sm font-black uppercase tracking-tighter ${step.active ? 'text-text-primary' : 'text-slate-400'}`}>{step.label}</p>
                              <p className="text-[10px] text-text-secondary leading-tight mt-0.5">{step.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </PremiumCard>

                {/* Verification Boxes (Claimant/Owner) */}
                <AnimatePresence>
                   {/* Owner: Approval Review */}
                   {item.user?.id === user?.id && item.pending_claims?.length > 0 && item.status !== 'returned' && (
                     item.pending_claims.map(claim => (
                        <motion.div key={claim.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary text-white rounded-xl">
                                 <ShieldCheck size={20} />
                              </div>
                              <h4 className="font-black text-text-primary uppercase tracking-tighter">New Claim Request</h4>
                           </div>
                           {claim.ai_questions && (
                             <div className="bg-white rounded-2xl p-4 border border-primary/10 flex justify-between items-center">
                                <span className="text-xs font-bold text-text-secondary uppercase">AI Verification Score:</span>
                                <span className="text-sm font-black text-primary px-3 py-1 bg-primary/10 rounded-lg">{claim.ai_result || 'PENDING'}</span>
                             </div>
                           )}
                           <div className="flex gap-3">
                              <button onClick={() => handleApproveClaim(claim.id)} className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20">APPROVE</button>
                              <button onClick={() => handleRejectClaim(claim.id)} className="px-6 border border-danger/30 text-danger py-3 rounded-2xl font-bold text-sm">REJECT</button>
                           </div>
                        </motion.div>
                     ))
                   )}

                   {/* Owner: Access Code Display */}
                   {item.user?.id === user?.id && item.pending_claims?.some(c => c.status === 'verified') && item.status !== 'returned' && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-800 text-white rounded-3xl p-8 text-center space-y-4 shadow-2xl">
                         <div className="bg-primary/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <QrCode size={32} className="text-primary" />
                         </div>
                         <h4 className="text-xl font-black uppercase tracking-widest text-primary">Exchange Code</h4>
                         <p className="text-xs text-white/60">Provide this code to the claimant only when handing over the item physically.</p>
                         <div className="bg-white/10 backdrop-blur-md rounded-2xl py-6 border border-white/10">
                            <span className="text-5xl font-black tracking-[10px] text-primary">
                               {item.pending_claims.find(c => c.status === 'verified')?.claim_code || "------"}
                            </span>
                         </div>
                         <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-danger animate-pulse">
                            <AlertCircle size={14} /> EXPIRES SOON
                         </div>
                      </motion.div>
                   )}

                   {/* Claimant: Receipt Verification UI */}
                   {item.my_claim && item.my_claim.status === 'verified' && item.status !== 'returned' && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                         <ClaimVerification 
                            onVerify={handleConfirmReceipt} 
                            loading={confirming} 
                         />
                      </motion.div>
                   )}
                </AnimatePresence>
              </div>
          </div>
        </div>
      </div>

      {/* Success + Rewards Celebration Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
               initial={{ scale: 0.8, y: 40 }}
               animate={{ scale: 1, y: 0 }}
               transition={{ type: 'spring', stiffness: 300, damping: 24 }}
               className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-3xl space-y-5"
            >
              <div className="text-7xl">🎉</div>
              <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Congratulations!</h2>
              <p className="text-text-secondary font-medium leading-relaxed">
                {rewardData ? 'You helped someone recover their item. The campus is safer because of you!' : 'The item has been successfully returned!'}
              </p>

              {rewardData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 space-y-4 text-left"
                >
                  <p className="text-center text-xs font-black uppercase tracking-widest text-amber-700">🏆 Rewards Earned</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-secondary">⭐ Points Earned</span>
                    <span className="text-lg font-black text-amber-600">+{rewardData.points_earned}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-secondary">🎖 Total Points</span>
                    <span className="text-lg font-black text-primary">{rewardData.total_points}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-secondary">🌟 Level</span>
                    <span className="text-sm font-black text-emerald-600">{rewardData.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-secondary">📦 Items Returned</span>
                    <span className="text-lg font-black text-text-primary">{rewardData.items_returned}</span>
                  </div>
                  {rewardData.new_badges?.length > 0 && (
                    <div className="pt-2 border-t border-amber-200">
                      <p className="text-xs font-black uppercase text-amber-700 mb-2">🎖 New Badge{rewardData.new_badges.length > 1 ? 's' : ''} Unlocked!</p>
                      <div className="flex flex-wrap gap-2">
                        {rewardData.new_badges.map((b, i) => (
                          <span key={i} className="text-xs font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-xl border border-amber-200">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <button 
                onClick={() => { setShowSuccess(false); navigate('/profile'); }}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                 VIEW MY REWARDS
              </button>
              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full text-text-secondary font-bold text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ItemDetails;