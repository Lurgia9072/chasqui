import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const StepIndicator = ({ steps, currentStep, className }: StepIndicatorProps) => {
  return (
    <div className={cn('flex items-center justify-between w-full', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={step} className="flex flex-col items-center flex-1 relative">
            <div className="flex items-center w-full">
              {/* Line before */}
              <div className={cn('flex-1 h-1 transition-colors', index === 0 ? 'bg-transparent' : isCompleted || isActive ? 'bg-blue-600' : 'bg-gray-200')} />
              
              {/* Circle */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isCompleted ? 'bg-blue-600 border-blue-600 text-white' : isActive ? 'bg-white border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>

              {/* Line after */}
              <div className={cn('flex-1 h-1 transition-colors', index === steps.length - 1 ? 'bg-transparent' : isCompleted ? 'bg-blue-600' : 'bg-gray-200')} />
            </div>
            <span className={cn('mt-3 text-xs font-bold uppercase tracking-wider text-center', isCompleted || isActive ? 'text-blue-600' : 'text-gray-400')}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};
