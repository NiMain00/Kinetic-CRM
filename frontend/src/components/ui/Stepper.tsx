import React from 'react';

export interface StepperStep {
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
}

export default function Stepper({ steps, currentStep, className = '' }: StepperProps) {
  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={step.label} className="flex flex-col gap-2">
            <div
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                isCompleted ? 'bg-primary' : isActive ? 'bg-primary' : 'bg-slate-200'
              }`}
            />
            <div
              className={`flex items-center gap-1.5 transition-colors duration-300 ${
                isActive || isCompleted ? 'text-primary font-bold' : 'text-slate-500'
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
          </div>
        );
      })}
    </div>
  );
}
