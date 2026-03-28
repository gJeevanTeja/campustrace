import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    ChevronDown,
    ChevronUp,
    Rocket,
    Layout,
    Bell,
    Shield,
    HelpCircle,
    Mail,
    Bug,
    MessageSquare,
    ChevronLeft,
    Sparkles,
    ShieldCheck,
    Zap,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { helpAPI } from '../services/api';
import PremiumCard from '../components/ui/PremiumCard';

const Help = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [faqs, setFaqs] = useState([]);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data } = await helpAPI.getCategories();
                const cats = Array.isArray(data) ? data : (data.results || []);
                setCategories(cats);
                if (cats.length > 0) {
                    setSelectedCategory(cats[0]);
                    setFaqs(cats[0].faqs || []);
                }
            } catch (err) {
                console.error('Failed to fetch help content', err);
            }
        };
        fetchInitialData();
    }, []);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const { data } = await helpAPI.search(query);
                setSearchResults(Array.isArray(data) ? data : (data.results || []));
            } catch (err) {
                console.error('Search failed', err);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setFaqs(cat.faqs || []);
        setExpandedFaq(null);
    };

    const getIcon = (iconName) => {
        const icons = {
            rocket: <Rocket size={18} />,
            layout: <Layout size={18} />,
            bell: <Bell size={18} />,
            shield: <Shield size={18} />,
            'help-circle': <HelpCircle size={18} />,
        };
        return icons[iconName] || <HelpCircle size={18} />;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-32 px-4 font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-12">
                <div className="space-y-2">
                   <div className="flex items-center gap-4">
                       <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                           <ChevronLeft size={20} className="text-text-primary" />
                       </button>
                       <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Support Core</h1>
                   </div>
                   <p className="text-text-secondary font-medium ml-16 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                       <ShieldCheck size={14} className="text-primary" />
                       Encryption-grade assistance and documentation.
                   </p>
                </div>
                <div className="flex-1 max-w-md ml-16 md:ml-0">
                    <div className="relative group">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text"
                          placeholder="Decrypt help topics..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full bg-white border-2 border-slate-100 rounded-2xl px-14 py-4 text-sm font-bold outline-none focus:border-primary/20 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {searchQuery.length > 2 ? (
                <div className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-text-secondary px-2">Manifest Results</h2>
                    <div className="grid gap-4">
                        {searchResults.length > 0 ? (
                            searchResults.map((res, i) => (
                                <PremiumCard key={i} className="p-6 cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest px-2 py-1 bg-primary/5 rounded-lg">{res.type}</span>
                                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{res.category}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-text-primary tracking-tight">{res.title}</h3>
                                    <p className="text-sm font-medium text-text-secondary mt-2 leading-relaxed">{res.content}</p>
                                </PremiumCard>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-4 grayscale opacity-40">
                                <Search size={48} className="mx-auto" />
                                <p className="text-sm font-black uppercase tracking-widest">Zero matches in database.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Categories */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat)}
                                className={`flex-shrink-0 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${selectedCategory?.id === cat.id ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-105' : 'bg-white text-text-secondary border border-slate-100 hover:bg-slate-50'}`}
                            >
                                {getIcon(cat.icon)}
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Topics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedCategory?.topics?.map((topic) => (
                            <PremiumCard key={topic.id} className="p-8 space-y-4">
                                <div className="p-3 bg-primary/5 text-primary rounded-xl w-fit">
                                   <Sparkles size={20} />
                                </div>
                                <h3 className="text-xl font-black text-text-primary tracking-tight uppercase">{topic.title}</h3>
                                <p className="text-sm font-medium text-text-secondary leading-[1.8]">
                                    {topic.content}
                                </p>
                            </PremiumCard>
                        ))}
                    </div>

                    {/* FAQs */}
                    <div className="space-y-8">
                        <h2 className="text-xs font-black uppercase tracking-[3px] text-text-secondary text-center">Frequently Interrogated</h2>
                        <div className="max-w-3xl mx-auto space-y-3">
                            {faqs.map((faq, i) => (
                                <div key={faq.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden transition-all hover:shadow-lg">
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                        className="w-full px-8 py-5 flex justify-between items-center text-left"
                                    >
                                        <span className="text-sm font-black text-text-primary uppercase tracking-tight">{faq.question}</span>
                                        {expandedFaq === i ? <ChevronUp size={18} className="text-primary" /> : <ChevronDown size={18} className="text-slate-300" />}
                                    </button>
                                    <AnimatePresence>
                                        {expandedFaq === i && (
                                            <motion.div 
                                              initial={{ height: 0 }}
                                              animate={{ height: 'auto' }}
                                              exit={{ height: 0 }}
                                              className="overflow-hidden"
                                            >
                                                <div className="px-8 pb-6 text-sm font-medium text-text-secondary leading-relaxed border-t border-slate-50 pt-4">
                                                    {faq.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Support */}
                    <div className="relative group overflow-hidden rounded-[48px]">
                        <div className="absolute inset-0 bg-primary-gradient opacity-90" />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <div className="relative p-12 md:p-20 text-center space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">Human Intervention?</h3>
                                <p className="text-white/70 font-bold uppercase tracking-widest text-xs">Our strike team is standing by 24/7/365.</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4">
                                <a href="mailto:UniTracehelp@gmail.com" className="flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-black/20 hover:scale-105 transition-all">
                                    <Mail size={16} /> Direct Link (Email)
                                </a>
                                <button className="flex items-center gap-3 bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all">
                                    <Bug size={16} /> Report Anomaly
                                </button>
                                <button className="flex items-center gap-3 bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all">
                                    <MessageSquare size={16} /> Beta Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Footer Links */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-8 opacity-40 grayscale hover:grayscale-0 transition-all">
                <Link to="/terms" className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors"><Shield size={16} /> Protocol Terms</Link>
                <Link to="/privacy" className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors"><ShieldCheck size={16} /> Privacy Shield</Link>
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><Zap size={16} /> Enterprise Support</div>
            </div>
        </div>
    );
};

export default Help;
