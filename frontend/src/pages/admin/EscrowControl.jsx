import React, { useState, useEffect } from 'react';
import { adminAPI, itemsAPI } from '../../services/api';
import { CheckCircle, FileImage, ShieldAlert, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EscrowControl = ({ darkMode }) => {
    const [proofs, setProofs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState(null);
    const [releasing, setReleasing] = useState(null);

    const fetchVerifiedProofs = async () => {
        try {
            setLoading(true);
            const { data } = await adminAPI.getProofReviews();
            setProofs(data);
        } catch (err) {
            console.error("Failed to load verified proofs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerifiedProofs();
    }, []);

    const handleRelease = async (proof) => {
        if (!proof.payee_details?.upi_id) {
            alert("Finder has not added UPI ID. Cannot release payment automatically.");
            return;
        }

        if (!window.confirm(`Are you sure you want to release ₹${proof.finder_amount} payout to ${proof.payee_details?.name} (UPI: ${proof.payee_details?.upi_id})?`)) return;
        setReleasing(proof.id);
        try {
            await itemsAPI.releasePayment(proof.item_details.id);
            alert("Reward sent successfully to finder UPI");
            fetchVerifiedProofs();
            setSelectedProof(null);
        } catch (e) {
            alert(e.response?.data?.error || "UPI payout failed.");
        } finally {
            setReleasing(null);
        }
    };

    if (loading) return <div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">Escrow Control Center</h2>
                    <p className="text-sm font-bold text-text-secondary dark:text-slate-400 mt-1 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-primary" /> Super Admin Authorized Personnel Only
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {proofs.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                        <Award size={48} className="mx-auto text-primary mb-4 opacity-50" />
                        <h4 className="text-lg font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">Escrow Clear</h4>
                        <p className="text-text-secondary dark:text-slate-400">No verified proofs pending payout operation.</p>
                    </div>
                ) : (
                    proofs.map(proof => (
                        <div key={proof.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-[32px] shadow-sm flex flex-col xl:flex-row gap-6 items-center">
                            
                            <div className="w-full xl:w-64 aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center relative cursor-pointer" onClick={() => setSelectedProof(proof)}>
                                {proof.return_proof_url ? (
                                    <img src={proof.return_proof_url} alt="Proof" className="w-full h-full object-cover opacity-80" />
                                ) : (
                                    <FileImage className="text-slate-600" size={32} />
                                )}
                                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
                                <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/30 truncate max-w-[150px]">
                                    {proof.item_details?.title}
                                </div>
                            </div>

                            <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Total Escrow (Paid)</p>
                                    <p className="text-xl font-black text-text-primary dark:text-slate-100 mt-1">₹{proof.amount}</p>
                                    <p className="text-xs text-text-secondary font-bold truncate mt-1">By: {proof.payer_details?.name}</p>
                                </div>
                                <div className="border-l border-slate-200 dark:border-slate-800 pl-6">
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">Finder Payout (80%)</p>
                                    <p className="text-xl font-black text-primary mt-1">₹{proof.finder_amount}</p>
                                    <p className="text-xs text-primary/70 font-bold truncate mt-1">To: {proof.payee_details?.name}</p>
                                </div>
                                <div className="border-l border-slate-200 dark:border-slate-800 pl-6">
                                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Platform Comm (20%)</p>
                                    <p className="text-xl font-black text-emerald-500 mt-1">₹{proof.commission}</p>
                                    <div className="mt-1 flex items-center gap-1">
                                        <CheckCircle size={14} className="text-emerald-500" />
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Admin Verified</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end">
                                    <button 
                                        onClick={() => handleRelease(proof)} 
                                        disabled={releasing === proof.id || !proof.payee_details?.upi_id}
                                        className={`w-full md:w-auto px-8 py-4 ${proof.payee_details?.upi_id ? 'bg-primary hover:scale-105 shadow-xl shadow-primary/30 active:scale-95' : 'bg-slate-300 dark:bg-slate-800 text-slate-500'} text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2`}
                                    >
                                        {releasing === proof.id ? (
                                            <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Releasing via UPI...</>
                                        ) : !proof.payee_details?.upi_id ? (
                                            "No UPI Attached"
                                        ) : (
                                            "RELEASE REWARD"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {selectedProof && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedProof(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-transparent max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                            {selectedProof.return_proof_url ? (
                                selectedProof.return_proof_url.match(/\.(mp4|webm|ogg)$/i) ? (
                                    <video src={selectedProof.return_proof_url} controls className="w-full h-auto max-h-[85vh] rounded-[32px] border border-white/10 shadow-2xl" />
                                ) : (
                                    <img src={selectedProof.return_proof_url} alt="Full Proof" className="w-full h-auto max-h-[85vh] object-contain rounded-[32px]" />
                                )
                            ) : null}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EscrowControl;
