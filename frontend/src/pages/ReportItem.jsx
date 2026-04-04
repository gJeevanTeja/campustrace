import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { itemsAPI, collegesAPI } from '../services/api';
import CampusMap from '../components/CampusMap';
import { 
  ChevronLeft, 
  Camera, 
  Image as ImageIcon, 
  X, 
  Brain, 
  CheckCircle2, 
  Calendar, 
  Clock as ClockIcon, 
  Tag, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';
import { MRU_LOCATIONS, GROUPED_LOCATIONS } from '../data/mruLocations';

const ELECTRONICS_CATEGORIES = [
  "Mobile Phones", "Earbuds", "Laptops", "Tablets", "Smart Watches", "Camera", "Headphones", "Other electronics", "Electronics",
  "Ear buds", "laptop", "watch"
];

const DEFAULT_CATEGORIES = [
  { id: 'key', name: 'Key', icon: '🔑' },
  { id: 'helmet', name: 'Helmet', icon: '🪖' },
  { id: 'id_card', name: 'ID Card', icon: '🆔' },
  { id: 'mobile_phone', name: 'Mobile Phone', icon: '📱' },
  { id: 'wallet', name: 'Wallet', icon: '👛' },
  { id: 'other', name: 'Other', icon: '📦' },
];

const ReportItem = ({ darkMode: dm }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const [form, setForm] = useState({
    type: searchParams.get('type') || 'lost',
    title: '',
    description: '',
    category: 'other',
    category_new: '',
    block: '',
    incident_date: '',
    incident_time: '',
    location: 'other',
    location_name: '',
    location_detail: '',
    contact_phone: '',
    latitude: null,
    longitude: null,
    brand: '',
    color: '',
    unique_mark: '',
    verification_questions: [],
    verification_answers: {},
    product_price: '',
  });

  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCategoryName = categories.find(c => String(c.id) === String(form.category_new))?.name;
  const isElectronic = ELECTRONICS_CATEGORIES.includes(selectedCategoryName);
  const isLost = form.type === 'lost';

  useEffect(() => {
    collegesAPI.getCategories()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        if (list.length > 0) {
          // Perfect order: Alphabetical, with "Other" at the very end
          const sortedList = [...list].sort((a, b) => {
            if (a.name === 'Other') return 1;
            if (b.name === 'Other') return -1;
            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          });
          setCategories(sortedList);
        }
      })
      .catch((err) => console.error("Categories fetch error:", err));
      
  }, []);

  const handleLocationSelect = ({ lat, lng, location_name: address }) => {
    // If it's a verified location, use the exact name from dataset
    const verified = MRU_LOCATIONS.find(l => 
      (Math.abs(l.latitude - lat) < 0.0001 && Math.abs(l.longitude - lng) < 0.0001)
    );

    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_name: verified ? verified.name : (address ? address.split(',').slice(0, 3).join(',').trim() : ''),
      block: verified ? verified.name : prev.block
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'block' && value) {
      const selectedLoc = MRU_LOCATIONS.find(l => l.name === value);
      if (selectedLoc) {
        setForm(prev => ({
          ...prev,
          [name]: value,
          latitude: selectedLoc.latitude,
          longitude: selectedLoc.longitude,
          location_name: selectedLoc.name
        }));
        return;
      }
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...newFiles].slice(0, 5));
    setPhotoPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))].slice(0, 5));
  };

  const removePhoto = (i) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
    if (i === 0) {
      setQuestionsGenerated(false);
      setForm(prev => ({ ...prev, verification_questions: [], verification_answers: {} }));
    }
  };

  const generateQuestions = async () => {
    if (photos.length === 0) return setError("Please upload at least one photo first.");
    setIsGeneratingQuestions(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append('image', photos[0]);
      formData.append('description', form.description);
      formData.append('brand', form.title);
      formData.append('color', '');
      formData.append('unique_mark', '');
      
      const res = await itemsAPI.generateElectronicQuestions(formData);
      // Backend returns { success: true, message: "...", data: { questions: [...] } }
      //res.data is the axios response body. res.data.data.questions is the actual array.
      setForm(prev => ({ 
        ...prev, 
        verification_questions: res.data?.data?.questions || res.data?.questions || [] 
      }));
      setQuestionsGenerated(true);
    } catch (err) {
      setError("Failed to generate AI questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswerChange = (idx, val) => {
    setForm(prev => ({
      ...prev,
      verification_answers: {
        ...prev.verification_answers,
        [`Q${idx + 1}`]: {
          question: prev.verification_questions[idx],
          answer: val
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Item title is required');
    if (!form.description.trim()) return setError('Description is required');
    if (!form.category_new) return setError('Please select a category');
    if (!form.block) return setError('Please select a campus block');
    if (!form.incident_date) return setError('Please select a date');
    if (!form.incident_time) return setError('Please select a time');
    if (isLost && !form.product_price) return setError('Product Price is required for lost items');

    if (!isLost && isElectronic) {
      if (!questionsGenerated) return setError('Please generate verification questions for this electronic item.');
      const answeredCount = Object.keys(form.verification_answers).length;
      if (answeredCount < 5) return setError(`Please answer all 5 verification questions.`);
    }

    const selectedDateTime = new Date(`${form.incident_date}T${form.incident_time}`);
    if (selectedDateTime > new Date()) return setError('Incident date and time cannot be in the future');

    setLoading(true);
    try {
      let finalLat = form.latitude;
      let finalLng = form.longitude;
      let finalAddr = form.location_name;

      const payload = { 
        ...form, 
        latitude: finalLat, 
        longitude: finalLng, 
        location_name: finalAddr || form.location_name,
        incident_datetime: selectedDateTime.toISOString(), 
        photos 
      };
      delete payload.incident_date;
      delete payload.incident_time;
      await itemsAPI.create(payload);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !data.message && !data.detail) {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ');
        setError(msgs || 'Failed to submit.');
      } else {
        setError(data?.message || data?.detail || 'Failed to submit.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.title.trim()) return setError('Please enter a title');
      if (!form.category_new) return setError('Please select a category');
      setError('');
    }
    if (step === 2) {
      if (!form.block) return setError('Please select a block');
      if (!form.incident_date) return setError('Please select a date');
      setError('');
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  return (
    <div className={`max-w-4xl mx-auto space-y-8 pb-32 ${dm ? 'dark' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => step > 1 ? prevStep() : navigate(-1)}
            className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all group"
          >
            <ChevronLeft size={20} className="text-text-primary dark:text-slate-100 group-hover:text-primary transition-colors" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-text-primary dark:text-slate-100 transition-colors">
              {isLost ? 'Report Lost Item' : 'Report Found Item'}
            </h2>
            <p className="text-text-secondary dark:text-slate-400 text-sm transition-colors">Step {step} of 3 • {step === 1 ? 'Basic Info' : step === 2 ? 'Location & Time' : 'Verification'}</p>
          </div>
        </div>
        
        {/* Toggle */}
        <div className="hidden sm:flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
           <button 
             onClick={() => setForm(prev => ({ ...prev, type: 'lost' }))}
             className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${isLost ? 'bg-danger text-white shadow-lg' : 'text-text-secondary dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
           >
             LOST
           </button>
           <button 
             onClick={() => setForm(prev => ({ ...prev, type: 'found' }))}
             className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${!isLost ? 'bg-success text-white shadow-lg' : 'text-text-secondary dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
           >
             FOUND
           </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
          className={`h-full ${isLost ? 'bg-danger' : 'bg-success'} transition-all duration-500`}
        />
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger/10 text-danger p-4 rounded-2xl border border-danger/20 flex items-center gap-3 text-sm font-bold"
        >
           <Info size={18} />
           {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {step === 1 && (
            <div className="space-y-6">
              <PremiumCard className="p-8 space-y-6" hover={false}>
                <div className="space-y-4">
                  <label className="text-sm font-bold text-text-primary dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 transition-colors">
                    <Tag size={16} className="text-primary dark:text-primary-light" />
                    Item Title & Category
                  </label>
                  <input 
                    name="title" 
                    value={form.title} 
                    onChange={handleChange}
                    placeholder="What did you lose/find? (e.g. Blue Samsung Galaxy)"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium dark:text-slate-100 placeholder:text-slate-500 shadow-sm"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select 
                      name="category_new" 
                      value={form.category_new} 
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium appearance-none dark:text-slate-100 placeholder:text-slate-500 shadow-sm"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                    <input 
                      name="contact_phone" 
                      value={form.contact_phone} 
                      onChange={handleChange}
                      placeholder="Your Contact Phone (Optional)"
                       className="w-full bg-white dark:bg-slate-950 border border-border dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium dark:text-slate-100 placeholder:text-slate-500"
                      inputMode="numeric"
                    />
                         {isLost && (
                    <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/10 dark:border-primary/20 space-y-2">
                       <label className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-2">
                         <Sparkles size={16} /> Product Market Price (₹)
                       </label>
                        <input 
                          name="product_price" 
                          type="number"
                          value={form.product_price} 
                          onChange={handleChange}
                          placeholder=""
                          className="w-full bg-white dark:bg-slate-950 border border-primary/20 dark:border-slate-700 rounded-xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-black text-lg text-primary dark:text-primary-light"
                        />
                       <p className="text-[10px] text-primary/60 dark:text-primary/40 font-bold uppercase">This helps us calculate the fair reward and platform commission.</p>
                    </div>
                  )}
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-sm font-bold text-text-primary dark:text-slate-100 uppercase tracking-wider transition-colors">Detailed Description</label>
                   <textarea 
                     name="description" 
                     value={form.description} 
                     onChange={handleChange}
                     rows={4}
                     placeholder="Provide details about the item's condition, unique features, or surroundings..."
                     className="w-full bg-white dark:bg-slate-950 border border-border dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none dark:text-slate-100 placeholder:text-slate-500"
                   />
                </div>
              </PremiumCard>
              
              <button 
                onClick={nextStep}
                className={`w-full py-5 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-2 group transition-all ${isLost ? 'bg-danger shadow-danger/20' : 'bg-success shadow-success/20'} active:scale-95`}
              >
                CONTINUE TO LOCATION
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <PremiumCard className="p-8 space-y-6" hover={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                       <label className="text-sm font-bold text-text-primary dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 transition-colors">
                         <Calendar size={16} className="text-primary dark:text-primary-light" />
                         Date
                       </label>
                      <input 
                        type="date" 
                        name="incident_date" 
                        value={form.incident_date} 
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                         className="w-full bg-white dark:bg-slate-950 border border-border dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium dark:text-slate-100 placeholder:text-slate-500"
                      />
                   </div>
                   <div className="space-y-4">
                       <label className="text-sm font-bold text-text-primary dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 transition-colors">
                         <ClockIcon size={16} className="text-primary dark:text-primary-light" />
                         Time
                       </label>
                      <input 
                        type="time" 
                        name="incident_time" 
                        value={form.incident_time} 
                        onChange={handleChange}
                         className="w-full bg-white dark:bg-slate-950 border border-border dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium dark:text-slate-100 placeholder:text-slate-500"
                      />
                   </div>
                </div>
                 <div className="space-y-4">
                   <label className="text-sm font-bold text-text-primary dark:text-slate-100 uppercase tracking-wider transition-colors">Select Verified Campus Location</label>
                   <select 
                     name="block" 
                     value={form.block} 
                     onChange={handleChange}
                     className="w-full bg-gray-50 dark:bg-slate-950 border border-border dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium appearance-none dark:text-slate-100 placeholder:text-slate-500"
                   >
                     <option value="">Choose a verified place...</option>
                     {Object.entries(GROUPED_LOCATIONS).map(([group, locations]) => (
                       <optgroup key={group} label={group}>
                         {locations.map((loc, i) => (
                           <option key={i} value={loc.name}>{loc.name}</option>
                         ))}
                       </optgroup>
                     ))}
                   </select>
                </div>

                <div className="space-y-4">
                   <label className="text-sm font-bold text-text-primary uppercase tracking-wider dark:text-slate-300">Pinpoint Exact Location</label>
                   <div className="rounded-3xl overflow-hidden border border-border dark:border-slate-800 h-[300px] shadow-inner relative transition-colors">
                      <CampusMap
                        onLocationSelect={handleLocationSelect}
                        selectedLat={form.latitude}
                        selectedLng={form.longitude}
                        restrictedLocations={MRU_LOCATIONS}
                      />
                   </div>
                </div>

                {form.location_name && (
                  <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-border dark:border-slate-700 transition-colors">
                    <p className="text-[10px] font-black text-text-secondary dark:text-slate-400 uppercase tracking-tighter mb-1">Identified Address</p>
                    <p className="text-sm font-bold text-text-primary dark:text-slate-100">{form.location_name}</p>
                  </div>
                )}

                <div className="space-y-4">
                   <label className="text-sm font-bold text-text-primary uppercase tracking-wider">Location Notes</label>
                   <input 
                     name="location_detail" 
                     value={form.location_detail} 
                     onChange={handleChange}
                     placeholder="e.g. Near the main entrance, 2nd floor, under the stairs..."
                     className="w-full bg-white dark:bg-slate-950 border border-border dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium dark:text-slate-100 placeholder:text-slate-500"
                   />
                </div>
              </PremiumCard>

              <div className="flex gap-4">
                <button 
                  onClick={prevStep}
                  className="w-1/3 py-5 rounded-3xl font-bold bg-white dark:bg-slate-800 border border-border dark:border-slate-700 text-text-secondary dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
                >
                  BACK
                </button>
                <button 
                  onClick={nextStep}
                  className={`flex-1 py-5 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-2 group transition-all ${isLost ? 'bg-danger shadow-danger/20' : 'bg-success shadow-success/20'} active:scale-95`}
                >
                  CONTINUE TO MEDIA
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <PremiumCard className="p-8 space-y-8" hover={false}>
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-text-primary dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 transition-colors">
                        <ImageIcon size={16} className="text-primary dark:text-primary-light" />
                        Photos (Wait for upload)
                      </label>
                      <span className="text-xs font-bold text-text-secondary">{photoPreviews.length}/5 photos</span>
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square">
                           <img src={src} className="w-full h-full object-cover rounded-2xl border-2 border-primary/20 shadow-sm" alt="Preview" />
                           <button 
                             onClick={() => removePhoto(i)}
                             className="absolute -top-2 -right-2 p-1 bg-danger text-white rounded-lg shadow-lg hover:scale-110 active:scale-90 transition-all"
                           >
                             <X size={14} />
                           </button>
                        </div>
                      ))}
                      {photoPreviews.length < 5 && (
                        <label className="aspect-square border-2 border-dashed border-border dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all gap-2 text-text-secondary dark:text-slate-400 group">
                           <Camera size={24} className="group-hover:scale-110 transition-transform text-gray-400 dark:text-slate-500 group-hover:text-primary" />
                           <span className="text-[10px] font-black group-hover:text-primary">ADD PHOTO</span>
                           <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                        </label>
                      )}
                   </div>
                </div>

                {!isLost && isElectronic && (
                   <div className="pt-8 border-t border-border dark:border-slate-700 space-y-6">
                      <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-3xl border border-primary/10 dark:border-primary/20">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-primary text-white rounded-2xl">
                               <Brain size={24} />
                            </div>
                            <div>
                               <h3 className="text-lg font-bold text-text-primary dark:text-slate-100 flex items-center gap-2">
                                 AI Verification Engine
                                 <Sparkles size={16} className="text-yellow-500" />
                               </h3>
                               <p className="text-sm text-text-secondary dark:text-slate-400">We'll generate security questions based on your photo.</p>
                            </div>
                         </div>

                         {!questionsGenerated ? (
                           <button 
                             type="button"
                             onClick={generateQuestions}
                             disabled={isGeneratingQuestions || photos.length === 0}
                             className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                                photos.length === 0 ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed' : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/30 active:scale-95'
                             }`}
                           >
                             {isGeneratingQuestions ? (
                               <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> ANALYZING...</>
                             ) : (
                               'GENERATE SECURITY QUESTIONS'
                             )}
                           </button>
                         ) : (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-6">
                              {(form.verification_questions || []).map((q, i) => (
                                <div key={i} className="space-y-2">
                                   <p className="text-sm font-bold text-text-primary dark:text-slate-200">{i+1}. {q}</p>
                                   <input 
                                     placeholder="Correct security answer..."
                                     value={form.verification_answers[`Q${i + 1}`]?.answer || ''}
                                     onChange={(e) => handleAnswerChange(i, e.target.value)}
                                     className="w-full bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium dark:text-slate-100 placeholder:text-slate-500"
                                   />
                                </div>
                              ))}
                              <button 
                                type="button" 
                                onClick={() => setQuestionsGenerated(false)} 
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                              >
                                <X size={12} /> Regenerate Questions
                              </button>
                           </motion.div>
                         )}
                      </div>
                   </div>
                )}
              </PremiumCard>

              <div className="flex gap-4">
                <button 
                  onClick={prevStep}
                  className="w-1/3 py-5 rounded-3xl font-bold bg-white dark:bg-slate-900 border border-border dark:border-slate-800 text-text-secondary dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                >
                  BACK
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex-1 py-5 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-2 group transition-all ${
                    isLost ? 'bg-primary shadow-primary/20' : 'bg-primary shadow-primary/20'
                  } active:scale-95 disabled:opacity-50`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      SUBMIT REPORT
                      <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ReportItem;