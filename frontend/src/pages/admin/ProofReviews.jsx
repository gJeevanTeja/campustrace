import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { 
    CheckCircle, FileImage 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProofReviews = ({ darkMode }) => {
    const [proofs, setProofs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState(null);

    const fetchProofs = async () => {
        try {
            setLoading(true);
            const { data } = await adminAPI.getProofReviews();
            setProofs(data);
        } catch (err) {
            console.error("Failed to load proofs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProofs();
    }, []);

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this proof?`)) return;
        try {
            await adminAPI.reviewProofAction(id, { action });
            alert(`Proof ${action}ed successfully.`);
            fetchProofs();
            setSelectedProof(null);
        } catch (e) {
            alert(e.response?.data?.error || `Failed to ${action} proof`);
        }
    };

    if (loading) return <div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">Pending Return Proofs</h2>
                    <p className="text-sm font-bold text-text-secondary dark:text-slate-400 mt-1">Review handover validation before Payout.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {proofs.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                        <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4 opacity-50" />
                        <h4 className="text-lg font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">All Caught Up!</h4>
                        <p className="text-text-secondary dark:text-slate-400">No pending proofs needing verification.</p>
                    </div>
                ) : (
                    proofs.map(proof => (
                        <div key={proof.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[32px] shadow-sm flex flex-col md:flex-row gap-6 items-center">
                            
                            <div className="w-full md:w-48 aspect-video bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative cursor-pointer" onClick={() => setSelectedProof(proof)}>
                                {proof.return_proof_url ? (
                                    <img src={proof.return_proof_url} alt="Proof" className="w-full h-full object-cover" />
                                ) : (
                                    <FileImage className="text-slate-300" size={32} />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 flex items-center justify-center hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-black uppercase">View Full</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-black text-text-primary dark:text-slate-100">{proof.item_details?.title}</h3>
                                        <span className="text-xs font-bold px-2 py-0.5 mt-1 inline-block bg-primary/10 text-primary uppercase rounded-md">{proof.item_details?.category}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-primary text-xl">₹{proof.finder_amount}</p>
                                        <p className="text-[10px] uppercase font-bold text-text-secondary">Finder Payout</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 text-sm gap-4">
                                    <div>
                                        <p className="text-xs text-text-secondary font-bold">Claimant (Paid)</p>
                                        <p className="font-black text-text-primary dark:text-slate-100">{proof.payer_details?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-secondary font-bold">Finder (Receiving)</p>
                                        <p className="font-black text-text-primary dark:text-slate-100">{proof.payee_details?.name}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-text-secondary font-bold">Proof Comment:</p>
                                        <p className="font-medium text-text-primary dark:text-slate-300 italic">"{proof.proof_comment || 'No comment provided.'}"</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                <button onClick={() => handleAction(proof.id, 'approve')} className="px-6 py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                    Approve Fake Checks
                                </button>
                                <button onClick={() => handleAction(proof.id, 'reject')} className="px-6 py-3 bg-white dark:bg-slate-900 text-danger border border-danger/30 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-danger/5 active:scale-95 transition-all">
                                    Reject Proof
                                </button>
                            </div>

                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedProof && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProof(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                            {selectedProof.return_proof_url ? (
                                selectedProof.return_proof_url.match(/\.(mp4|webm|ogg)$/i) ? (
                                    <video src={selectedProof.return_proof_url} controls className="w-full h-auto max-h-[80vh] rounded-[20px]" />
                                ) : (
                                    <img src={selectedProof.return_proof_url} alt="Full Proof" className="w-full h-auto max-h-[80vh] object-contain rounded-[20px]" />
                                )
                            ) : null}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProofReviews;
