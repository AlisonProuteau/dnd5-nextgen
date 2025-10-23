/**
 * Form validation utilities for consistent form handling across the application
 */

/**
 * Check if all form fields are valid (no validation errors)
 */
export const isFormValid = (formError: Record<string, boolean | string>): boolean => {
  return !Object.values(formError).some((v) => v);
};

/**
 * Check if form has required data based on provided criteria
 */
export const hasRequiredFormData = <T extends Record<string, any>>(
  formData: T,
  requiredFields: (keyof T)[]
): boolean => {
  return requiredFields.every((field) => {
    const value = formData[field];
    return Array.isArray(value) ? value.length > 0 : !!value;
  });
};

/**
 * Generic form data setter with merge capability
 */
export const createFormDataSetter = <T extends Record<string, any>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) => {
  return (values: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...values }));
  };
};

/**
 * Generic form error setter with merge capability
 */
export const createFormErrorSetter = <T extends Record<string, any>>(
  setFormError: React.Dispatch<React.SetStateAction<T>>
) => {
  return (values: Partial<T>) => {
    setFormError((prev) => ({ ...prev, ...values }));
  };
};
