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
  MapPin, 
  Tag, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '../components/ui/PremiumCard';

const ELECTRONICS_CATEGORIES = [
  "Mobile Phones", "Earbuds", "Laptops", "Tablets", "Smart Watches", "Camera", "Headphones", "Other electronics", "Electronics"
];

const ReportItem = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);

  const [categories, setCategories] = useState([]);
  const [blocks, setBlocks] = useState([]);

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
        if (list.length > 0) setCategories(list);
      })
      .catch((err) => console.error("Categories fetch error:", err));
      
    collegesAPI.getBlocks()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        if (list.length > 0) setBlocks(list);
      })
      .catch((err) => console.error("Blocks fetch error:", err));
  }, []);

  const handleLocationSelect = ({ lat, lng, location_name: address }) => {
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_name: address ? address.split(',').slice(0, 3).join(',').trim() : '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'block' && value) {
      const selectedBlock = blocks.find(b => String(b.id) === String(value));
      if (selectedBlock) {
        setForm(prev => ({
          ...prev,
          [name]: value,
          latitude: selectedBlock.latitude || prev.latitude,
          longitude: selectedBlock.longitude || prev.longitude,
          location_name: selectedBlock.name || prev.location_name
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
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => step > 1 ? prevStep() : navigate(-1)}
            className="p-2 bg-white rounded-xl border border-border shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-text-primary">
              {isLost ? 'Report Lost Item' : 'Report Found Item'}
            </h2>
            <p className="text-text-secondary text-sm">Step {step} of 3 • {step === 1 ? 'Basic Info' : step === 2 ? 'Location & Time' : 'Verification'}</p>
          </div>
        </div>
        
        {/* Toggle */}
        <div className="hidden sm:flex bg-white p-1 rounded-2xl border border-border shadow-sm">
           <button 
             onClick={() => setForm(prev => ({ ...prev, type: 'lost' }))}
             className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isLost ? 'bg-danger text-white shadow-md' : 'text-text-secondary hover:bg-gray-50'}`}
           >
             LOST
           </button>
           <button 
             onClick={() => setForm(prev => ({ ...prev, type: 'found' }))}
             className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isLost ? 'bg-success text-white shadow-md' : 'text-text-secondary hover:bg-gray-50'}`}
           >
             FOUND
           </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
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
                  <label className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Tag size={16} className="text-primary" />
                    Item Title & Category
                  </label>
                  <input 
                    name="title" 
                    value={form.title} 
                    onChange={handleChange}
                    placeholder="What did you lose/find? (e.g. Blue Samsung Galaxy)"
                    className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select 
                      name="category_new" 
                      value={form.category_new} 
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium appearance-none"
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
                      className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-sm font-bold text-text-primary uppercase tracking-wider">Detailed Description</label>
                   <textarea 
                     name="description" 
                     value={form.description} 
                     onChange={handleChange}
                     rows={4}
                     placeholder="Provide details about the item's condition, unique features, or surroundings..."
                     className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none"
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
                      <label className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        Date
                      </label>
                      <input 
                        type="date" 
                        name="incident_date" 
                        value={form.incident_date} 
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <ClockIcon size={16} className="text-primary" />
                        Time
                      </label>
                      <input 
                        type="time" 
                        name="incident_time" 
                        value={form.incident_time} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                     <MapPin size={16} className="text-primary" />
                     Campus Block
                   </label>
                   <select 
                     name="block" 
                     value={form.block} 
                     onChange={handleChange}
                     className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium appearance-none"
                   >
                     <option value="">Select Campus Location</option>
                     {blocks.map(b => (
                       <option key={b.id} value={b.id}>{b.name}</option>
                     ))}
                   </select>
                </div>

                <div className="space-y-4">
                   <label className="text-sm font-bold text-text-primary uppercase tracking-wider">Pinpoint Exact Location</label>
                   <div className="rounded-3xl overflow-hidden border border-border h-[250px] shadow-inner">
                      <CampusMap
                        onLocationSelect={handleLocationSelect}
                        selectedLat={form.latitude}
                        selectedLng={form.longitude}
                      />
                   </div>
                </div>

                {form.location_name && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-border">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-tighter mb-1">Identified Address</p>
                    <p className="text-sm font-bold text-text-primary">{form.location_name}</p>
                  </div>
                )}

                <div className="space-y-4">
                   <label className="text-sm font-bold text-text-primary uppercase tracking-wider">Location Notes</label>
                   <input 
                     name="location_detail" 
                     value={form.location_detail} 
                     onChange={handleChange}
                     placeholder="e.g. Near the main entrance, 2nd floor, under the stairs..."
                     className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                   />
                </div>
              </PremiumCard>

              <div className="flex gap-4">
                <button 
                  onClick={prevStep}
                  className="w-1/3 py-5 rounded-3xl font-bold bg-white border border-border text-text-secondary hover:bg-gray-50 active:scale-95 transition-all"
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
                      <label className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon size={16} className="text-primary" />
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
                        <label className="aspect-square border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all gap-2 text-text-secondary group">
                           <Camera size={24} className="group-hover:scale-110 transition-transform text-gray-400 group-hover:text-primary" />
                           <span className="text-[10px] font-black group-hover:text-primary">ADD PHOTO</span>
                           <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                        </label>
                      )}
                   </div>
                </div>

                {!isLost && isElectronic && (
                   <div className="pt-8 border-t border-border space-y-6">
                      <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-primary text-white rounded-2xl">
                               <Brain size={24} />
                            </div>
                            <div>
                               <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                 AI Verification Engine
                                 <Sparkles size={16} className="text-yellow-500" />
                               </h3>
                               <p className="text-sm text-text-secondary">We'll generate security questions based on your photo.</p>
                            </div>
                         </div>

                         {!questionsGenerated ? (
                           <button 
                             type="button"
                             onClick={generateQuestions}
                             disabled={isGeneratingQuestions || photos.length === 0}
                             className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                               photos.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/30 active:scale-95'
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
                                   <p className="text-sm font-bold text-text-primary">{i+1}. {q}</p>
                                   <input 
                                     placeholder="Correct security answer..."
                                     value={form.verification_answers[`Q${i+1}`]?.answer || ''}
                                     onChange={(e) => handleAnswerChange(i, e.target.value)}
                                     className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
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
                  className="w-1/3 py-5 rounded-3xl font-bold bg-white border border-border text-text-secondary hover:bg-gray-50 active:scale-95 transition-all"
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