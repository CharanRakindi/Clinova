import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, X, Sparkles } from 'lucide-react';

const allSteps = [
  {
    title: 'Welcome to Clinova',
    description:
      'Your modern, unified health workspace. This short tour highlights the tools on your screen.',
    target: 'body',
  },
  {
    title: 'Global search (⌘K)',
    description:
      'Jump to dashboards, patients, and actions instantly with the command palette.',
    target: 'search-trigger',
  },
  {
    title: 'Notifications',
    description:
      'Live alerts for check-ins, lab results, and schedule updates appear here.',
    target: 'notification-bell',
  },
  {
    title: 'Consultation queue',
    description:
      'Today’s appointments, ordered by time. Complete visits or open the patient file.',
    target: 'consultations-queue',
  },
  {
    title: 'Lab pipeline',
    description:
      'Move lab orders through sample collection, processing, and final results.',
    target: 'lab-kanban-board',
  },
  {
    title: 'Health profile',
    description:
      'Your blood group, emergency contacts, and insurance details when configured.',
    target: 'patient-health-profile',
  },
  {
    title: 'Patient registration',
    description:
      'Register new patients and schedule consultations from the reception workspace.',
    target: 'receptionist-register-form',
  },
];

function getVisibleSteps() {
  return allSteps.filter((step) => {
    if (step.target === 'body') return true;
    return document.getElementById(step.target) != null;
  });
}

function clearHighlights() {
  allSteps.forEach((s) => {
    if (s.target === 'body') return;
    document.getElementById(s.target)?.classList.remove('tour-highlight');
  });
}

export default function OnboardingTour() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSteps, setActiveSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const refreshSteps = useCallback((autoOpen) => {
    const filtered = getVisibleSteps();
    setActiveSteps(filtered);
    setCurrentStep(0);

    if (autoOpen && filtered.length > 0) {
      const hasCompleted = localStorage.getItem('clinova_tour_completed');
      if (!hasCompleted) setIsOpen(true);
    }
  }, []);

  // Re-scan when route changes (role dashboards mount different targets)
  useEffect(() => {
    clearHighlights();
    setIsOpen(false);
    const timer = setTimeout(() => refreshSteps(true), 800);
    return () => {
      clearTimeout(timer);
      clearHighlights();
    };
  }, [location.pathname, refreshSteps]);

  // Highlight current target
  useEffect(() => {
    if (!isOpen || activeSteps.length === 0) {
      clearHighlights();
      return undefined;
    }

    const safeIndex = Math.min(currentStep, activeSteps.length - 1);
    if (safeIndex !== currentStep) {
      setCurrentStep(safeIndex);
      return undefined;
    }

    clearHighlights();
    const step = activeSteps[safeIndex];
    if (step && step.target !== 'body') {
      const el = document.getElementById(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('tour-highlight');
      }
    }

    return () => clearHighlights();
  }, [currentStep, isOpen, activeSteps]);

  const handleComplete = () => {
    localStorage.setItem('clinova_tour_completed', 'true');
    setIsOpen(false);
    clearHighlights();
  };

  const handleNext = () => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleRestart = () => {
    const filtered = getVisibleSteps();
    setActiveSteps(filtered);
    setCurrentStep(0);
    if (filtered.length > 0) setIsOpen(true);
  };

  // Never leave isOpen true without a valid step (was causing blank tour / stuck state)
  const step =
    isOpen && activeSteps.length > 0
      ? activeSteps[Math.min(currentStep, activeSteps.length - 1)]
      : null;

  if (!isOpen || !step) {
    return (
      <button
        type="button"
        onClick={handleRestart}
        className="fixed bottom-6 left-6 z-[90] flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-2.5 text-[12px] font-medium text-slate-500 shadow-premium transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
        title="Take onboarding tour"
      >
        <Sparkles className="h-3.5 w-3.5 text-slate-400" />
        <span>Tour guide</span>
      </button>
    );
  }

  const stepNumber = Math.min(currentStep, activeSteps.length - 1) + 1;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[99] bg-slate-950/[0.06]" />

      <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm animate-scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-premium-lg">
        <button
          type="button"
          onClick={handleComplete}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3.5 mt-1">
          <span className="badge badge-neutral uppercase tracking-wider">
            Step {stepNumber} of {activeSteps.length}
          </span>
        </div>

        <h3 className="mb-1.5 pr-6 text-[15px] font-medium leading-tight text-slate-900">
          {step.title}
        </h3>
        <p className="mb-5 text-[12.5px] font-normal leading-relaxed text-slate-500">
          {step.description}
        </p>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleComplete}
            className="text-[12px] font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            Skip
          </button>

          <button type="button" onClick={handleNext} className="btn btn-primary btn-sm">
            <span>{stepNumber >= activeSteps.length ? 'Finish' : 'Next'}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
