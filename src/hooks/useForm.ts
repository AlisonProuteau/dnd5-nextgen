import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

export interface Step {
  id: string;
  label: string;
}

export type ValidationRule<T> = (value: any, formData: Partial<T>) => string | null;

export interface ValidationSchema<T> {
  [key: string]: ValidationRule<T> | ValidationRule<T>[];
}

// Common validation rules
export const validationRules = {
  required:
    <T>(message = 'This field is required'): ValidationRule<T> =>
    (value) =>
      value === null || value === undefined || value === '' ? message : null,
  minLength:
    <T>(min: number, message?: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'string' && value.length < min
        ? message || `Must be at least ${min} characters`
        : null,
  maxLength:
    <T>(max: number, message?: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'string' && value.length > max
        ? message || `Must be no more than ${max} characters`
        : null,
  pattern:
    <T>(regex: RegExp, message: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'string' && !regex.test(value) ? message : null,
  min:
    <T>(min: number, message?: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'number' && value < min ? message || `Must be at least ${min}` : null,
  max:
    <T>(max: number, message?: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'number' && value > max ? message || `Must be no more than ${max}` : null,
  email: <T>(message = 'Please enter a valid email address'): ValidationRule<T> =>
    validationRules.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, message),
  custom:
    <T>(
      validator: (value: any, formData: Partial<T>) => boolean,
      message: string
    ): ValidationRule<T> =>
    (value, formData) =>
      !validator(value, formData) ? message : null
};

export interface UseFormOptions<T> {
  initialData?: Partial<T>;
  isValid?: (data: Partial<T>) => boolean;
  steps?: Step[];
  autoScroll?: boolean;
  validationSchema?: ValidationSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormReturn<T> {
  formData: Partial<T>;
  errors: Record<string, string>;
  steps: Step[];
  activeStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isMultiStep: boolean;
  isValid: boolean;
  setFormData: (values: Partial<T>) => void;
  setErrors: (values: Record<string, string>) => void;
  setActiveStep: Dispatch<SetStateAction<number>>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  isCurrentStepValid: () => boolean;
  isFormComplete: () => boolean;
  resetForm: () => void;
  clearErrors: () => void;
  clearFieldError: (fieldName: keyof T) => void;
  hasFieldError: (fieldName: keyof T) => boolean;
  getFieldError: (fieldName: keyof T) => string | null;
  validateField: (fieldName: keyof T, value: any) => string | null;
  validateForm: (data?: Partial<T>) => Record<string, string>;
  updateValidationSchema: (schema: ValidationSchema<T>) => void;
}

/**
 * Generic form hook that optionally handles multi-step navigation, form state, and validation
 */
export const useForm = <T extends Record<string, any>>(
  options: UseFormOptions<T> = {}
): UseFormReturn<T> => {
  const {
    steps = [],
    initialData = {},
    isValid: customIsValid,
    autoScroll = true,
    validationSchema,
    validateOnChange = true
  } = options;
  const [formData, setFormDataState] = useState<Partial<T>>(initialData);
  const [errors, setErrorsState] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [currentValidationSchema, setCurrentValidationSchema] = useState<
    ValidationSchema<T> | undefined
  >(validationSchema);

  const isMultiStep = steps.length > 0;

  // Auto-scroll to top when step changes (only for multi-step forms)
  useEffect(() => {
    if (autoScroll && isMultiStep) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStep, autoScroll, isMultiStep]);

  const validateField = (fieldName: keyof T, value: any): string | null => {
    if (!currentValidationSchema || !currentValidationSchema[fieldName as string]) return null;

    const rules = currentValidationSchema[fieldName as string];
    const ruleArray = Array.isArray(rules) ? rules : [rules];

    for (const rule of ruleArray) {
      const error = rule(value, formData);
      if (error) return error;
    }

    return null;
  };

  const validateFormData = (data: Partial<T> = formData): Record<string, string> => {
    const formErrors: Record<string, string> = {};

    if (currentValidationSchema) {
      Object.keys(currentValidationSchema).forEach((fieldName) => {
        const value = data[fieldName as keyof T];
        const error = validateField(fieldName as keyof T, value);

        if (error) formErrors[fieldName] = error;
      });
    }

    return formErrors;
  };

  const setFormData = (values: Partial<T>) => {
    const mergedData = { ...formData, ...values };
    const cleanedData = Object.keys(mergedData).reduce((acc, key) => {
      const value = mergedData[key as keyof T];
      if (value !== undefined && value !== '' && value !== null) {
        (acc as any)[key] = value;
      }
      return acc;
    }, {} as Partial<T>);

    setFormDataState(cleanedData);

    // Auto-validate on change if enabled
    if (validateOnChange && validationSchema) {
      const newErrors = validateFormData(cleanedData);
      setErrorsState(newErrors);
    }
  };

  const setErrors = (values: Record<string, string>) =>
    setErrorsState((prev) => ({ ...prev, ...values }));

  const clearErrors = () => setErrorsState({});

  const clearFieldError = (fieldName: keyof T) =>
    setErrorsState((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName as string];
      return newErrors;
    });

  const hasFieldError = (fieldName: keyof T): boolean => !!errors[fieldName as string];

  const getFieldError = (fieldName: keyof T): string | null => errors[fieldName as string] || null;

  const nextStep = () =>
    isMultiStep && activeStep < steps.length - 1 && setActiveStep((prev) => prev + 1);

  const prevStep = () => isMultiStep && activeStep > 0 && setActiveStep((prev) => prev - 1);

  const goToStep = (stepIndex: number) =>
    isMultiStep && stepIndex >= 0 && stepIndex < steps.length && setActiveStep(stepIndex);

  const isCurrentStepValid = (): boolean =>
    (customIsValid?.(formData) ?? true) && Object.keys(errors).length === 0;

  const isFormComplete = (): boolean =>
    (customIsValid?.(formData) ?? true) && Object.keys(formData).length > 0;

  const resetForm = () => {
    setFormDataState(initialData);
    setErrorsState({});
    setActiveStep(0);
  };

  const updateValidationSchema = (schema: ValidationSchema<T>) => {
    setCurrentValidationSchema(schema);
  };

  const isFirstStep = !isMultiStep || activeStep === 0;
  const isLastStep = !isMultiStep || activeStep === steps.length - 1;
  const isValid = Object.keys(errors).length === 0;

  return {
    formData,
    setFormData,
    isFormComplete,
    errors,
    setErrors,
    clearErrors,
    hasFieldError,
    getFieldError,
    clearFieldError,
    isValid,
    validateField,
    validateForm: validateFormData,
    steps,
    activeStep,
    isFirstStep,
    isLastStep,
    isMultiStep,
    setActiveStep,
    nextStep,
    prevStep,
    goToStep,
    isCurrentStepValid,
    resetForm,
    updateValidationSchema
  };
};
