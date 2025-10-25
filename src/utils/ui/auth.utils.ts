import { validationRules, type ValidationSchema } from '@hooks/useForm';

interface AuthFormData {
  name?: string;
  email?: string;
  password?: string;
  passwordConfrim?: string;
  showPassword: boolean;
}

export const getLoginValidationSchema = (isLogin: boolean): ValidationSchema<AuthFormData> => ({
  name: !isLogin ? [validationRules.required('Required')] : [],
  email: [validationRules.required('Required'), validationRules.email()],
  password: !isLogin
    ? [
        validationRules.required('Required'),
        validationRules.minLength(8, 'Must be at least 8 characters'),
        (value: string) => {
          if (!value) return undefined;
          const errors: string[] = [];

          if (!/[0-9]/.test(value)) errors.push('Must contain at least 1 number');
          if (!/[a-z]/.test(value)) errors.push('Must contain at least 1 lowercase');
          if (!/[A-Z]/.test(value)) errors.push('Must contain at least 1 uppercase');

          const specialChars = '.,:;?!@$%&*^=+~_-';
          if (!new RegExp(`[${specialChars}]`).test(value)) {
            errors.push(`Must contain at least 1 special character in ${specialChars}`);
          }
          if (!new RegExp(`^[a-zA-Z0-9${specialChars}]*$`).test(value)) {
            errors.push('Contains invalid characters');
          }

          return errors.length > 0 ? errors : undefined;
        }
      ]
    : [validationRules.required('Required')],
  passwordConfrim: !isLogin
    ? [
        validationRules.required('Required'),
        (value: string, formData: Partial<AuthFormData>) =>
          value !== formData.password ? 'Passwords mismatch' : undefined
      ]
    : []
});
