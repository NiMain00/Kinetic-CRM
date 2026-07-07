import React from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';

export interface StepperStep {
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
  onStepClick?: (step: number) => void;
}

export default function Stepper({ steps, currentStep, className = '', onStepClick }: StepperProps) {
  const isMobile = useIsMobile();

  const handleClick = (index: number) => {
    if (onStepClick && index <= currentStep + 1) {
      onStepClick(index);
    }
  };

  if (isMobile) {
    return (
      <div className={`space-y-3 ${className}`}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <button key={step.label} onClick={() => handleClick(index)} type="button" className="flex items-start gap-3 text-left w-full">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted ? 'bg-success text-white' : isActive ? 'bg-primary text-white' : 'bg-surface-container-high text-secondary'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-6 ${isCompleted ? 'bg-success' : 'bg-surface-container-high'}`} />
                )}
              </div>
              <div className={`pt-1.5 text-sm ${isActive || isCompleted ? 'text-primary font-semibold' : 'text-secondary'}`}>
                {step.label}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <button key={step.label} onClick={() => handleClick(index)} type="button" className="flex flex-col gap-2 text-left">
            <div
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                isCompleted ? 'bg-success' : isActive ? 'bg-primary' : 'bg-surface-container-high'
              }`}
            />
            <div
              className={`flex items-center gap-1.5 transition-colors duration-300 ${
                isActive || isCompleted ? 'text-primary font-bold' : 'text-secondary'
              }`}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: isActive || isCompleted ? "'FILL' 1" : undefined }}
              >
                {isCompleted ? 'check_circle' : isActive ? 'radio_button_checked' : 'circle'}
              </span>
              <span className="text-xs">{index + 1}. {step.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
