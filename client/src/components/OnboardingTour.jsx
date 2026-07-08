import { useState, useEffect } from 'react';
import { HelpCircle, ChevronRight, X, Sparkles } from 'lucide-react';

const steps = [
  {
    title: "Welcome to Clinova 🏥",
    description: "Your next-gen Electronic Health Record & medical portfolio. Let's do a quick 45-second tour of the main features.",
    target: "body"
  },
  {
    title: "Global Command Search (⌘K)",
    description: "Press Cmd+K or Ctrl+K anywhere to open the fuzzy search command palette. Jump between sections or find patient records instantly.",
    target: "search-trigger"
  },
  {
    title: "Real-Time Notifications",
    description: "Stay updated with live appointment adjustments, new prescriptions, and lab report completions powered by Socket.io.",
    target: "notification-bell"
  },
  {
    title: "Theme Personalization",
    description: "Switch seamlessly between Clean Light, Deep OLED Dark, and System-preference themes.",
    target: "theme-toggle"
  },
  {
    title: "Interactive Schedule",
    description: "Manage consultations with our full calendar scheduling interface, color-coded for fast readability.",
    target: "calendar-view"
  }
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('clinova_tour_completed');
    if (!hasCompletedTour) {
      // Open tour on first visit
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('clinova_tour_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return (
    <button 
      onClick={() => {
        setCurrentStep(0);
        setIsOpen(true);
      }}
      className="fixed bottom-6 left-6 z-[90] flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:text-primary-600 hover:border-primary-300 px-3.5 py-2 rounded-full shadow-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
      title="Take onboarding tour"
    >
      <Sparkles className="w-3.5 h-3.5 text-primary-500 animate-pulse" />
      <span>Tour Guide</span>
    </button>
  );

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 overflow-hidden transform animate-scale-in">
        {/* Gradients */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-gradient-to-br from-primary-400 to-indigo-600 opacity-20 rounded-full blur-2xl"></div>

        <button 
          onClick={handleComplete} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 bg-primary-100 text-primary-600 rounded-md text-[10px] font-bold tracking-wider uppercase">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 mb-2 pr-6">
          {step.title}
        </h3>
        <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
          {step.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button 
            onClick={handleComplete} 
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip Tour
          </button>
          
          <button 
            onClick={handleNext} 
            className="flex items-center gap-1 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>{currentStep === steps.length - 1 ? "Finish" : "Next"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
