import { useEffect, useState } from 'react';

export interface Step {
  id: string;
  label: string;
}

export interface UseMultiStepFormOptions {
  steps: Step[];
  autoScroll?: boolean;
}

export interface UseMultiStepFormReturn {
  steps: Step[];
  activeStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isMultiStep: boolean;
  setActiveStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
}

/**
 * Hook to manage multi-step form navigation
 * Use this in conjunction with react-hook-form for multi-step forms
 */
export const useMultiStepForm = (
  options: UseMultiStepFormOptions = { steps: [] }
): UseMultiStepFormReturn => {
  const { steps = [], autoScroll = true } = options;
  const [activeStep, setActiveStep] = useState(0);

  const isMultiStep = steps.length > 0;

  // Auto-scroll to top when step changes (only for multi-step forms)
  useEffect(() => {
    if (autoScroll && isMultiStep) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStep, autoScroll, isMultiStep]);

  const nextStep = () => {
    if (isMultiStep && activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (isMultiStep && activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (isMultiStep && stepIndex >= 0 && stepIndex < steps.length) {
      setActiveStep(stepIndex);
    }
  };

  const isFirstStep = !isMultiStep || activeStep === 0;
  const isLastStep = !isMultiStep || activeStep === steps.length - 1;

  return {
    steps,
    activeStep,
    isFirstStep,
    isLastStep,
    isMultiStep,
    setActiveStep,
    nextStep,
    prevStep,
    goToStep
  };
};
