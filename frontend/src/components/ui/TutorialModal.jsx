import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles, Search, PlusCircle, User, LayoutDashboard, Database } from 'lucide-react';

const STEPS = [
  {
    title: "Welcome to UniTrace",
    description: "Your smart companion for recovering lost items. Let's take a quick look around!",
    icon: Sparkles,
    color: "from-blue-500 to-indigo-600",
    target: null // Center
  },
  {
    title: "The Command Center",
    description: "Access all your essential tools from the navigation sidebar. Start here for an overview.",
    icon: LayoutDashboard,
    color: "from-purple-500 to-indigo-600",
    target: "#tour-dashboard"
  },
  {
    title: "Find Lost Treasures",
    description: "Browse through all reported items. Use filters to narrow down your search quickly.",
    icon: Search,
    color: "from-emerald-500 to-teal-600",
    target: "#tour-browse-items"
  },
  {
    title: "Report instantly",
    description: "Lost or found something? Report it here to notify the entire campus community.",
    icon: PlusCircle,
    color: "from-red-500 to-orange-600",
    target: "#tour-report-item"
  },
  {
    title: "Search Anything",
    description: "Looking for something specific? Use the global search to find items by name or description.",
    icon: Search,
    color: "from-amber-400 to-orange-500",
    target: "#tour-search-bar"
  },
  {
    title: "Recent Activity",
    description: "Keep track of the latest lost and found reports right from your dashboard.",
    icon: Database,
    color: "from-indigo-500 to-blue-600",
    target: "#tour-recent-activity"
  },
  {
    title: "Your Identity",
    description: "View your reputation, rewards, and manage your account details here.",
    icon: User,
    color: "from-pink-500 to-rose-600",
    target: "#tour-profile"
  }
];

const TutorialModal = ({ isOpen, onClose, userId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const targetSelector = STEPS[currentStep].target;
      if (!targetSelector) {
        setCoords(null);
        return;
      }

      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Check if it's a mobile bottom nav or sidebar item
        // For simplicity, we'll position reasonably relative to it
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
        
        // Scroll into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setCoords(null);
      }
    };

    // Small delay to ensure layout is ready or transitions finished
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    const key = `UniTrace_tutorial_completed_${userId}`;
    localStorage.setItem(key, 'true');
    onClose();
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  // Calculate popover position
  const getPopoverStyle = () => {
    const isMobile = window.innerWidth < 768;
    
    if (!coords) return { 
      position: 'fixed',
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      width: isMobile ? 'calc(100vw - 40px)' : '400px',
      zIndex: 1001
    };
    
    const padding = 20;
    // Default: show below the element
    let top = coords.bottom + padding;
    let left = coords.left + coords.width / 2;

    // Adjust if too close to edges
    if (left + 200 > window.innerWidth) left = window.innerWidth - 220;
    if (left - 200 < 0) left = 220;
    
    // If it's a mobile bottom nav (roughly), show above it
    if (coords.top > window.innerHeight * 0.7) {
        top = coords.top - popoverRef.current?.offsetHeight - padding || coords.top - 250;
    }

    return { 
      position: 'fixed',
      top: isMobile ? '50%' : `${Math.max(20, Math.min(top, window.innerHeight - 300))}px`, 
      left: isMobile ? '50%' : `${left}px`,
      transform: isMobile ? 'translate(-50%, -50%)' : 'translateX(-50%)',
      width: isMobile ? 'calc(100vw - 40px)' : '400px',
      maxWidth: isMobile ? '380px' : '400px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1001
    };
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden pointer-events-none">
      {/* Dimmed Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-[2px] pointer-events-auto"
        style={{
            clipPath: coords ? `polygon(
                0% 0%, 
                0% 100%, 
                ${coords.left}px 100%, 
                ${coords.left}px ${coords.top}px, 
                ${coords.right}px ${coords.top}px, 
                ${coords.right}px ${coords.bottom}px, 
                ${coords.left}px ${coords.bottom}px, 
                ${coords.left}px 100%, 
                100% 100%, 
                100% 0%
            )` : 'none'
        }}
      />

      {/* Popover */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={popoverRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          style={getPopoverStyle()}
          className="bg-white dark:bg-card rounded-[32px] shadow-2xl pointer-events-auto border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-0.5">
            {STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={`flex-1 h-full transition-colors duration-500 ${idx <= currentStep ? `bg-gradient-to-r ${STEPS[idx].color}` : 'bg-slate-100 dark:bg-slate-800'}`}
              />
            ))}
          </div>

          <div className="p-6 pt-10 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg`}>
                <step.icon size={24} />
              </div>
              <button 
                onClick={handleComplete}
                className="p-2 text-text-secondary dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Skip tour"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-xl font-black text-text-primary dark:text-slate-100 mb-2 transition-colors">
              {step.title}
            </h3>
            <p className="text-text-secondary dark:text-slate-400 text-sm leading-relaxed mb-6 transition-colors">
              {step.description}
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-1 font-bold text-xs transition-all ${
                    currentStep === 0 ? 'opacity-0' : 'text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-slate-200'
                }`}
                >
                <ChevronLeft size={16} /> Previous
                </button>

                <div className="flex gap-2 items-center">
                    {currentStep !== STEPS.length -1 && (
                        <button 
                            onClick={handleComplete}
                            className="text-xs font-bold text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-slate-200 mr-2 transition-colors"
                        >
                            Skip
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs text-white shadow-lg transition-all active:scale-95 bg-gradient-to-r ${step.color}`}
                    >
                        {currentStep === STEPS.length - 1 ? "Finish Tour" : "Next Step"}
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Focus Ring */}
      {coords && (
        <motion.div 
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            key={`ring-${currentStep}`}
            className="absolute border-4 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] dark:shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] pointer-events-none"
            style={{
                top: coords.top - 8,
                left: coords.left - 8,
                width: coords.width + 16,
                height: coords.height + 16,
                zIndex: 1000
            }}
        >
            <div className="absolute -top-3 -right-3">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
                    <div className="relative bg-primary w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black">
                        {currentStep}
                    </div>
                </div>
            </div>
        </motion.div>
      )}
    </div>
  );
};

export default TutorialModal;
