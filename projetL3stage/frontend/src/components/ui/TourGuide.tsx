import { useState, useEffect } from 'react';
import { X, ArrowRight,  Check } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourGuideProps {
  steps: TourStep[];
  onComplete: () => void;
}

export default function TourGuide({ steps, onComplete }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const step = steps[currentStep];

  useEffect(() => {
    // Si on arrive à la fin, on ne calcule plus
    if (!step) return;

    const updatePosition = () => {
      const element = document.getElementById(step.targetId);
      
      // Si l'élément n'existe pas (ex: erreur d'id), on passe à l'étape suivante
      if (!element) {
        console.warn(`TourGuide: Element #${step.targetId} introuvable.`);
        if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
        else onComplete();
        return;
      }

      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });

      let tTop = rect.top + window.scrollY + rect.height + 16;
      let tLeft = rect.left + window.scrollX + rect.width / 2 - 150;

      if (rect.top > window.innerHeight / 2) {
         tTop = rect.top + window.scrollY - 180; 
      }
      
      if (tLeft < 16) tLeft = 16;
      if (tLeft + 300 > window.innerWidth) tLeft = window.innerWidth - 316;

      setTooltipPos({ top: tTop, left: tLeft });

      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, step, steps.length, onComplete]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onComplete();
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none">
      {/* Spotlight */}
      <div 
        className="absolute bg-transparent transition-all duration-300 ease-out pointer-events-auto"
        style={{
          top: coords.top,
          left: coords.left,
          width: coords.width,
          height: coords.height,
          borderRadius: '8px',
          boxShadow: '0 0 0 9999px rgba(16, 24, 40, 0.7)',
        }}
      />

      {/* Tooltip */}
      <div 
        className="absolute w-80 bg-card rounded-xl shadow-2xl border border-line p-5 pointer-events-auto transition-all duration-300 ease-out animate-fadeIn"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <button onClick={onComplete} className="absolute top-3 right-3 text-ink-faint hover:text-ink transition-colors">
          <X size={16} />
        </button>

        <h3 className="text-base font-bold text-ink mb-2">{step?.title}</h3>
        <p className="text-sm text-ink-soft mb-6">{step?.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-4 bg-primary' : 'w-1.5 bg-line-strong'}`} />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button onClick={handlePrev} className="px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface rounded-md transition-colors">
                Précédent
              </button>
            )}
            <button onClick={handleNext} className="px-3 py-1.5 text-sm font-medium bg-primary text-white hover:bg-primary-hover rounded-md transition-colors flex items-center gap-1">
              {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
              {currentStep === steps.length - 1 ? <Check size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}