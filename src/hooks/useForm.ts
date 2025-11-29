import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { omit } from 'lodash';

export interface Step {
  id: string;
  label: string;
}

export type ValidationRule<T> = (value: any, formData: Partial<T>) => string | string[] | undefined;

export interface ValidationSchema<T> {
  [key: string]: ValidationRule<T> | ValidationRule<T>[];
}

// Common validation rules
export const validationRules = {
  required:
    <T>(message = 'Required'): ValidationRule<T> =>
    (value) =>
      value === null || value === undefined || value === '' ? message : undefined,
  minLength:
    <T>(min: number, message?: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'string' && value.length < min
        ? message || `Must be at least ${min} characters`
        : undefined,
  maxLength:
    <T>(max: number, message?: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'string' && value.length > max
        ? message || `Must be no more than ${max} characters`
        : undefined,
  pattern:
    <T>(regex: RegExp, message: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'string' && !regex.test(value) ? message : undefined,
  min:
    <T>(min: number, message?: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'number' && value < min ? message || `Must be at least ${min}` : undefined,
  max:
    <T>(max: number, message?: string): ValidationRule<T> =>
    (value) =>
      typeof value === 'number' && value > max
        ? message || `Must be no more than ${max}`
        : undefined,
  email: <T>(message = 'Email invalid'): ValidationRule<T> =>
    validationRules.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, message),
  custom:
    <T>(
      validator: (value: any, formData: Partial<T>) => boolean,
      message: string
    ): ValidationRule<T> =>
    (value, formData) =>
      !validator(value, formData) ? message : undefined
};

export interface UseFormOptions<T> {
  initialData?: Partial<T>;
  isValid?: (data: Partial<T>) => boolean;
  steps?: Step[];
  autoScroll?: boolean;
  validationSchema?: ValidationSchema<T>;
  validateOnChange?: boolean;
}

export interface UseFormReturn<T> {
  formData: Partial<T>;
  setFormData: (values: Partial<T>) => void;
  errors: Record<string, string[]>;
  setErrors: (values: Record<string, string[]>) => void;
  getFieldError: (fieldName: keyof T) => string[] | undefined;
  clearFieldError: (fieldName: keyof T) => void;
  clearErrors: () => void;
  isValid: boolean;
  isFieldValid: (fieldName: keyof T) => boolean;
  validateField: (fieldName: keyof T) => void;
  validateForm: () => void;
  steps: Step[];
  activeStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isMultiStep: boolean;
  setActiveStep: Dispatch<SetStateAction<number>>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  resetForm: () => void;
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
    validateOnChange = false
  } = options;
  const [formData, setFormDataState] = useState<Partial<T>>(initialData);
  const [errors, setErrorsState] = useState<Record<string, string[]>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [currentValidationSchema, setCurrentValidationSchema] = useState<
    ValidationSchema<T> | undefined
  >(validationSchema);

  const isMultiStep = steps.length > 0;

  // Auto-scroll to top when step changes (only for multi-step forms)
  useEffect(() => {
    if (autoScroll && isMultiStep) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep, autoScroll, isMultiStep]);

  const setErrors = (values: Record<string, string[]>) =>
    setErrorsState((prev) => ({ ...prev, ...values }));
  const clearErrors = () => setErrorsState({});
  const clearFieldError = (fieldName: keyof T) => setErrorsState((prev) => omit(prev, fieldName));

  const getFieldError = (fieldName: keyof T, value = formData[fieldName]): string[] | undefined => {
    if (!currentValidationSchema || !currentValidationSchema[fieldName as string]) return;

    const rules = currentValidationSchema[fieldName as string];
    const ruleArray = Array.isArray(rules) ? rules : [rules];

    const currentErrors: string[] = [];
    ruleArray.forEach((rule) => {
      const error = rule(value, formData);
      if (error) {
        if (Array.isArray(error)) currentErrors.push(...error);
        else currentErrors.push(error);
      }
    });

    return currentErrors.length ? currentErrors : undefined;
  };

  const validateField = (fieldName: keyof T, value = formData[fieldName as keyof T]): void => {
    const currentErrors = getFieldError(fieldName, value);
    currentErrors ? setErrors({ [fieldName]: currentErrors }) : clearFieldError(fieldName);
  };

  const validateFormData = (data: Partial<T> = formData): void => {
    Object.keys(currentValidationSchema || {}).forEach((fieldName) => {
      const value = data[fieldName as keyof T];
      validateField(fieldName as keyof T, value);
    });
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
    if (validateOnChange) validateFormData(cleanedData);
  };

  const nextStep = () =>
    isMultiStep && activeStep < steps.length - 1 && setActiveStep((prev) => prev + 1);
  const prevStep = () => isMultiStep && activeStep > 0 && setActiveStep((prev) => prev - 1);
  const goToStep = (stepIndex: number) =>
    isMultiStep && stepIndex >= 0 && stepIndex < steps.length && setActiveStep(stepIndex);

  const resetForm = () => {
    setFormDataState(initialData);
    setErrorsState({});
    setActiveStep(0);
  };

  const updateValidationSchema = (schema: ValidationSchema<T>) =>
    setCurrentValidationSchema(schema);

  const isFirstStep = !isMultiStep || activeStep === 0;
  const isLastStep = !isMultiStep || activeStep === steps.length - 1;

  const isFieldValid = (fieldName: keyof T): boolean => !errors[fieldName as string];
  const isValid = useMemo(() => {
    let currentErrors: string[] = [];
    Object.keys(currentValidationSchema || {}).forEach((fieldName) => {
      const err = getFieldError(fieldName);
      if (err?.length) currentErrors.push(fieldName);
    });

    return (customIsValid?.(formData) ?? true) && currentErrors.length === 0;
  }, [currentValidationSchema, Object.values(formData).sort((a, b) => a - b)]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    clearErrors,
    getFieldError,
    clearFieldError,
    isValid,
    isFieldValid,
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
    resetForm,
    updateValidationSchema
  };
};
