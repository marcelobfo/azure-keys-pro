import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: { title: string; icon: React.ReactNode }[];
}

export const OnboardingProgress = ({ currentStep, totalSteps, steps }: OnboardingProgressProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary bg-primary/10",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px]",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all duration-300",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
