import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  ChevronLeft, 
  FileText, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  UserX, 
  MessageSquare, 
  Image, 
  GraduationCap, 
  PhoneCall, 
  Database, 
  Ban, 
  MapPin, 
  Cookie, 
  Trash2, 
  Mail,
  Zap,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';
import BottomNav from '../components/BottomNav';

const TERMS = [
  { icon: <FileText size={18} />, title: 'Accurate Information', text: 'Users must provide accurate and truthful information when reporting lost or found items. False or misleading reports are strictly not permitted.' },
  { icon: <Ban size={18} />, title: 'No False Claims', text: 'Fraudulent claims of item ownership are prohibited. All claims are subject to verification by both parties.' },
  { icon: <AlertCircle size={18} />, title: 'Liability Disclaimer', text: 'CampusTrace is not responsible for any fraudulent activities, disputes, or losses that occur between users.' },
  { icon: <CheckCircle2 size={18} />, title: 'Item Verification', text: 'Claimed items must be verified by both parties before handover. We recommend meeting at well-lit, campus security-monitored locations.' },
  { icon: <Lock size={18} />, title: 'Data Privacy', text: 'Your personal data is securely stored and encrypted. We never sell or share your data with third parties for commercial purposes.' },
  { icon: <MessageSquare size={18} />, title: 'Messaging Conduct', text: 'Users must not misuse the messaging system for spam, harassment, or any purpose unrelated to lost and found items.' },
  { icon: <UserX size={18} />, title: 'Account Suspension', text: 'Repeated violations may lead to temporary or permanent account suspension at the sole discretion of CampusTrace.' },
  { icon: <Image size={18} />, title: 'Content Standards', text: 'All uploaded images and content must be appropriate and relevant. Offensive or inappropriate content will be removed.' },
  { icon: <GraduationCap size={18} />, title: 'Campus Community Only', text: 'This platform is exclusively for verified members of the campus community. Access will be revoked for false credentials.' },
  { icon: <PhoneCall size={18} />, title: 'Contact & Support', text: 'For any issues, disputes, or violations, contact the campus administration office immediately.' },
];

const PRIVACY = [
  { icon: <Database size={18} />, title: 'Data Collection', text: 'We collect name, email, phone, and location data only as necessary to provide the lost and found service effectively.' },
  { icon: <ShieldCheck size={18} />, title: 'Data Security', text: 'All data is encrypted in transit (HTTPS) and at rest. We use industry-standard security practices and regular audits.' },
  { icon: <Ban size={18} />, title: 'No Data Selling', text: 'We never sell, rent, or trade your personal information with third parties for commercial or advertising purposes.' },
  { icon: <MapPin size={18} />, title: 'Location Data', text: 'Location data is used only to display item proximity and connect users. Continuous location tracking is never performed.' },
  { icon: <Cookie size={18} />, title: 'Cookies', text: 'We use minimal session cookies only for authentication. No advertising, tracking, or third-party cookies are used.' },
  { icon: <Trash2 size={18} />, title: 'Data Deletion', text: 'You may request deletion of your account and all associated data at any time. Deletion is completed within 30 days.' },
  { icon: <Mail size={18} />, title: 'Email Communications', text: 'You will only receive emails related to account activity, unit notifications, and critical security updates.' },
];

const TermsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [tab, setTab] = useState(location.pathname === '/privacy' ? 'privacy' : 'terms');

    const items = tab === 'terms' ? TERMS : PRIVACY;

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-32 px-4 font-sans">
            {/* Header */}
            <header className="flex flex-col items-center text-center space-y-8 pt-12">
                <div className="space-y-4">
                   <div className="flex items-center justify-center gap-4">
                       <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                           <ChevronLeft size={20} className="text-text-primary" />
                       </button>
                       <div className="w-12 h-12 bg-primary-gradient rounded-xl flex items-center justify-center text-white shadow-xl rotate-6">
                           <Shield size={24} />
                       </div>
                       <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter italic">Protocol & Ethics</h1>
                   </div>
                   <p className="text-text-secondary font-medium uppercase text-[10px] tracking-[4px]">Institutional Compliance Framework</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-[24px] w-full max-w-md">
                    <button 
                      onClick={() => setTab('terms')}
                      className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'terms' ? 'bg-white text-primary shadow-xl shadow-black/5' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        <FileText size={16} /> Terms of Use
                    </button>
                    <button 
                      onClick={() => setTab('privacy')}
                      className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'privacy' ? 'bg-white text-primary shadow-xl shadow-black/5' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        <Lock size={16} /> Privacy Shield
                    </button>
                </div>
            </header>

            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
                <PremiumCard className="p-0 overflow-hidden divide-y divide-slate-50">
                    <div className="p-6 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-primary" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Release Version: 1.0.4 - FEB 2026</p>
                        </div>
                        <span className="text-[10px] font-bold text-primary italic">Fully Audited</span>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div 
                          key={tab}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="divide-y divide-slate-50"
                        >
                            {items.map((item, i) => (
                                <div key={i} className="p-8 flex items-start gap-8 group hover:bg-slate-50/50 transition-all">
                                    <div className="w-14 h-14 bg-white border border-slate-100 text-text-secondary rounded-[20px] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all">
                                        {item.icon}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-3">
                                           <span className="text-[10px] font-black text-primary opacity-30">{String(i+1).padStart(2, '0')}</span>
                                           <h3 className="text-lg font-black text-text-primary uppercase tracking-tight italic">{item.title}</h3>
                                        </div>
                                        <p className="text-sm font-medium text-text-secondary leading-relaxed max-w-2xl">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </PremiumCard>

                {/* Footer Disclaimer */}
                <div className="p-10 rounded-[40px] bg-primary/5 border border-primary/10 relative overflow-hidden text-center space-y-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <Sparkles size={32} className="mx-auto text-primary opacity-40" />
                    <div className="space-y-2">
                       <h4 className="text-xl font-black text-text-primary uppercase tracking-tighter italic">Agreement Disclosure</h4>
                       <p className="text-sm font-medium text-text-secondary max-w-lg mx-auto leading-relaxed">By maintaining an active session on CampusTrace, you acknowledge and agree to the operational protocols outlined above. For institutional disputes, contact <span className="text-primary font-bold">compliance@campustrace.university</span></p>
                    </div>
                </div>
            </motion.div>

            {/* Utility Links */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-8 opacity-40 grayscale hover:grayscale-0 transition-all">
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><ShieldCheck size={16} /> Encryption Valid</div>
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><Zap size={16} /> Zero-Log Policy</div>
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest font-black"><AlertCircle size={16} /> Campus Security Bonded</div>
            </div>

            <BottomNav />
        </div>
    );
};

export default TermsPage;