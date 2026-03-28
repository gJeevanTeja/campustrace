import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, GraduationCap, MapPin, Sparkles, Building2, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const AuthLanding = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl w-full flex flex-col items-center space-y-16 relative z-10">
                {/* Brand Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4"
                >
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-primary-gradient rounded-[24px] flex items-center justify-center text-white shadow-2xl">
                           <MapPin size={32} />
                        </div>
                        <h1 className="text-5xl font-black text-text-primary tracking-tighter italic">UniTrace</h1>
                    </div>
                    <div className="space-y-1">
                       <p className="text-xl font-bold text-text-secondary">Advanced Asset Recovery Protocol</p>
                       <p className="text-[10px] font-black uppercase tracking-[5px] text-primary opacity-60">University Secured Infrastructure</p>
                    </div>
                </motion.div>

                {/* Portal Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      onClick={() => navigate('/login')}
                      className="group"
                    >
                        <PremiumCard className="p-10 h-full flex flex-col items-center text-center space-y-6 cursor-pointer border-2 border-transparent transition-all hover:border-primary/20 hover:bg-primary/[0.02]">
                            <div className="w-20 h-20 bg-primary/5 text-primary rounded-[32px] flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6">
                                <GraduationCap size={44} />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="space-y-1">
                                   <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Student Portal</h3>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-primary">Identity: Helper / Finder</p>
                                </div>
                                <p className="text-sm font-medium text-text-secondary leading-relaxed">Access the campus-wide network to log lost assets, claim found items, and secure rewards.</p>
                            </div>
                            <div className="flex items-center gap-3 font-black text-[12px] uppercase tracking-widest text-primary pt-4 group-hover:gap-5 transition-all">
                                Establish Link <ArrowRight size={18} />
                            </div>
                        </PremiumCard>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      onClick={() => navigate('/login')}
                      className="group"
                    >
                        <PremiumCard className="p-10 h-full flex flex-col items-center text-center space-y-6 cursor-pointer border-2 border-transparent transition-all hover:border-indigo-500/20 hover:bg-indigo-500/[0.02]">
                            <div className="w-20 h-20 bg-indigo-500/5 text-indigo-500 rounded-[32px] flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-6">
                                <ShieldCheck size={44} />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="space-y-1">
                                   <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Admin Portal</h3>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Identity: Moderator / Staff</p>
                                </div>
                                <p className="text-sm font-medium text-text-secondary leading-relaxed">Oversee university operations, manage identity verification, and audit campus security logs.</p>
                            </div>
                            <div className="flex items-center gap-3 font-black text-[12px] uppercase tracking-widest text-indigo-500 pt-4 group-hover:gap-5 transition-all">
                                Access Core <ArrowRight size={18} />
                            </div>
                        </PremiumCard>
                    </motion.div>
                </div>

                {/* Bottom Utility */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center space-y-8"
                >
                    <div className="flex items-center gap-10">
                       <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[2px] opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default text-text-primary"><Building2 size={16} /> Enterprise Grade</div>
                       <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[2px] opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default text-text-primary"><Sparkles size={16} /> AI Verification</div>
                       <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[2px] opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default text-text-primary"><UserCircle size={16} /> Biometric Ready</div>
                    </div>

                    <div className="text-center font-black uppercase text-[10px] tracking-widest text-text-secondary">
                       Institutional Enrollment Required? <button onClick={() => navigate('/admin/request')} className="text-primary hover:underline underline-offset-4">Provision University</button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuthLanding;
