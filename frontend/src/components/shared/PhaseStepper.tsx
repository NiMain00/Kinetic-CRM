interface StepperStep {
  label: string;
  path: string;
}

interface PhaseStepperProps {
  steps: StepperStep[];
  currentStepIndex: number;
  accessibleUpToIndex: number;
  onStepClick: (path: string) => void;
  isStepUnlocked?: (index: number) => boolean;
}

export default function PhaseStepper({
  steps,
  currentStepIndex,
  accessibleUpToIndex,
  onStepClick,
  isStepUnlocked,
}: PhaseStepperProps) {
  const current = accessibleUpToIndex;

  return (
    <section className="bg-surface-container-lowest px-6 py-5 border-b border-border overflow-x-auto select-none">
      <div className="min-w-[500px] flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 -z-0">
          <div className="h-full bg-border rounded-full relative overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0}%` }}
            />
          </div>
        </div>

        {steps.map((step, index) => {
          const isCompleted = index < current;
          const isActive = index === current;
          const isFuture = !isCompleted && !isActive && !(isStepUnlocked?.(index) ?? false);

          return (
            <div
              key={step.label}
              onClick={() => { if (!isFuture) onStepClick(step.path); }}
              className={`relative z-10 flex flex-col items-center gap-1.5 bg-surface-container-lowest px-3 ${isFuture ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'} transition-transform`}
            >
              {isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
              ) : isActive ? (
                <div className="w-10 h-10 -m-1 rounded-full bg-surface-container-lowest border-2 border-primary text-primary flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-primary/10">
                  {index + 1}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-border text-on-surface-variant flex items-center justify-center font-bold text-xs">
                  {index + 1}
                </div>
              )}
              <span className={`text-[11px] whitespace-nowrap font-semibold ${isActive ? 'text-primary' : isCompleted ? 'text-on-surface' : 'text-outline'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
