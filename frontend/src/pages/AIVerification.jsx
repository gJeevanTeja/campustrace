import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Zap, 
  BrainCircuit, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const AIVerification = ({ darkMode: dm }) => {
    const { id } = useParams();
    const navigate = useNavigate();


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentQuestion, setCurrentQuestion] = useState("");
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [finished, setFinished] = useState(false);
    const [calculating, setCalculating] = useState(false);

    const [aiResult, setAiResult] = useState("");

    useEffect(() => {
        const initVerification = async () => {
            try {
                setLoading(true);
                await api.get(`items/${id}/`, { timeout: 30000 });

                const resQ = await api.post(`items/${id}/submit-ai-answer/`, { answer: "" }, { timeout: 30000 });
                console.log("AI Init Response:", resQ.data);
                
                // Backend wraps session data in a 'data' key or returns it at root
                const body = resQ.data;
                const qData = body?.data || body;
                
                if (qData?.finished) {
                    if (qData.ai_result) setAiResult(qData.ai_result);
                    setFinished(true);
                } else if (qData?.next_question) {
                    setCurrentQuestion(qData.next_question);
                    setQuestionIndex(qData.question_index || 0);
                } else {
                    console.error("Malformed AI Response - missing next_question:", body);
                    setError("Could not retrieve verification questions. The session data is incomplete.");
                }
            } catch (err) {
                console.error("Error starting AI verification:", err);
                const apiError = err.response?.data?.message || err.response?.data?.error || "Failed to initialize verification session.";
                setError(apiError);
            } finally {
                setLoading(false);
            }
        };

        initVerification();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer.trim() || submitting) return;

        try {
            setSubmitting(true);
            const res = await api.post(`items/${id}/submit-ai-answer/`, { answer: answer.trim() }, { timeout: 30000 });
            setAnswer("");
            
            const body = res.data;
            const qData = body?.data || body;

            if (qData?.finished) {
                if (qData.ai_result) setAiResult(qData.ai_result);
                setCalculating(true);
                setTimeout(() => {
                    setCalculating(false);
                    setFinished(true);
                }, 2000);
            } else if (qData?.next_question) {
                setCurrentQuestion(qData.next_question);
                setQuestionIndex(qData.question_index);
            } else {
                setError("Response received but next question missing.");
            }
        } catch (err) {
            console.error("Submission error:", err);
            const apiError = err.response?.data?.message || err.response?.data?.error || "Failed to submit.";
            alert(apiError);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
       <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50 dark:bg-[#020617] transition-colors">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center text-primary">
                <BrainCircuit size={24} />
             </div>
          </div>
          <p className="font-black text-text-secondary dark:text-slate-400 uppercase tracking-widest text-xs">Booting AI Engine...</p>
       </div>
    );

    if (error) return (
       <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 dark:bg-[#020617] text-center transition-colors">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl space-y-6 max-w-sm border border-danger/20 dark:border-danger/40">
             <div className="w-16 h-16 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert size={32} />
             </div>
             <h2 className="text-xl font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter">System Error</h2>
             <p className="text-sm font-medium text-text-secondary dark:text-slate-400">{error}</p>
             <button onClick={() => navigate(`/item/${id}`)} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-primary/20">Go Back</button>
          </div>
       </div>
    );

    return (
        <div className={`min-h-screen ${dm ? 'dark bg-[#020617]' : 'bg-slate-50'} flex flex-col font-sans transition-colors duration-300`}>
            {/* Nav */}
            <header className="px-6 py-5 flex items-center justify-between bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/item/${id}`)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all">
                        <ChevronLeft size={20} className="text-text-primary dark:text-slate-100" />
                    </button>
                    <div>
                        <h1 className="font-black text-text-primary dark:text-slate-100 uppercase tracking-tighter text-lg leading-tight transition-colors">UniTrace AI</h1>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                           <span className="text-[10px] font-black text-success uppercase tracking-widest">Active Processing</span>
                        </div>
                    </div>
                </div>
                <div className="p-2 bg-primary/5 rounded-xl text-primary">
                   <Lock size={18} />
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 flex flex-col items-center">
                {/* Progress */}
                {!finished && !calculating && (
                    <div className="w-full mb-12 space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary dark:text-slate-400">Security Protocol Progress</span>
                            <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-lg">Question {questionIndex + 1} of 5</span>
                        </div>
                        <div className="flex gap-2.5">
                            {[0, 1, 2, 3, 4].map(s => (
                                <motion.div 
                                  key={s} 
                                  className={`flex-1 h-2 rounded-full transition-all duration-500 ${s < questionIndex ? 'bg-success shadow-lg shadow-success/20' : s === questionIndex ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-slate-200 dark:bg-slate-800'}`}
                                  initial={false}
                                  animate={s === questionIndex ? { scaleY: 1.2 } : { scaleY: 1 }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* Active Question */}
                    {!finished && !calculating && currentQuestion && (
                        <motion.div 
                          key="question"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full space-y-8"
                        >
                            <PremiumCard className="p-8 sm:p-10 space-y-8" hover={false}>
                                <div className="space-y-4">
                                   <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-1.5 rounded-full">
                                      <Zap size={14} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Intelligence Probe</span>
                                   </div>
                                   <h2 className="text-2xl sm:text-3xl font-black text-text-primary leading-tight tracking-tight">
                                      {currentQuestion}
                                   </h2>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="relative group">
                                        <textarea
                                            autoFocus
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            placeholder="Provide a detailed verification answer..."
                                            className="w-full min-h-[160px] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-base font-medium outline-none focus:border-primary/30 focus:ring-8 focus:ring-primary/5 transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-slate-100"
                                            disabled={submitting}
                                        />
                                        <div className="absolute bottom-4 right-6 text-[10px] font-black uppercase text-slate-300 dark:text-slate-600">
                                            {answer.length} Characters
                                        </div>
                                    </div>

                                    <button 
                                      type="submit"
                                      disabled={!answer.trim() || submitting}
                                      className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${answer.trim() && !submitting ? 'bg-primary text-white shadow-2xl shadow-primary/30 active:scale-95' : 'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 pointer-events-none'}`}
                                    >
                                        {submitting ? (
                                           <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                          <>Submit Response <ArrowRight size={18} /></>
                                        )}
                                    </button>
                                </form>
                            </PremiumCard>
                            
                            <div className="flex items-center justify-center gap-3 text-text-secondary">
                               <ShieldCheck size={16} className="text-success" />
                               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">End-to-End Encrypted Verification</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Calculating */}
                    {calculating && (
                        <motion.div 
                          key="calculating"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full text-center space-y-8"
                        >
                            <div className="relative inline-block">
                                <motion.div 
                                  animate={{ rotate: 360 }} 
                                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                  className="w-40 h-40 border-4 border-dashed border-primary/20 rounded-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-primary">
                                   <Bot size={64} className="animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-2">
                               <h2 className="text-3xl font-black uppercase tracking-tighter text-text-primary dark:text-slate-100 transition-colors">Crunching Data</h2>
                               <p className="text-sm font-medium text-text-secondary dark:text-slate-400 max-w-xs mx-auto transition-colors">AI is comparing your responses with found item metadata and security patterns.</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Finished */}
                    {finished && !calculating && (
                        <motion.div 
                          key="finished"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full space-y-8"
                        >
                            <PremiumCard className="p-10 text-center space-y-8 overflow-hidden relative" hover={false}>
                                <div className="absolute top-0 right-0 p-12 text-primary/5 -mr-8 -mt-8 rotate-12">
                                   <ShieldCheck size={200} />
                                </div>
                                
                                <div className="relative z-10 space-y-8">
                                    <div className="w-24 h-24 bg-primary text-white rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-primary/40 rotate-12">
                                       <CheckCircle2 size={48} />
                                    </div>
                                    
                                    <div className="space-y-2">
                                       <h2 className="text-4xl font-black text-text-primary dark:text-slate-100 tracking-tighter uppercase transition-colors">Protocol Complete</h2>
                                       <p className="text-text-secondary dark:text-slate-400 font-medium transition-colors">Your claim verification has been finalized.</p>
                                    </div>

                                    <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-4 transition-colors">
                                       <div className="inline-flex items-center gap-3 px-6 py-2 bg-success/10 text-success rounded-full border border-success/20">
                                          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                                          <span className="text-sm font-black uppercase tracking-widest">{aiResult || 'MATCH DETECTED'}</span>
                                       </div>
                                       <p className="text-xs font-bold text-text-secondary dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto uppercase tracking-wide opacity-80 transition-colors">
                                          The finder will now review the AI analytics and confirm the handover.
                                       </p>
                                    </div>

                                    <button 
                                      onClick={() => navigate(`/item/${id}`)}
                                      className="w-full bg-primary text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                       Return to Dashboard
                                    </button>
                                </div>
                            </PremiumCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AIVerification;
