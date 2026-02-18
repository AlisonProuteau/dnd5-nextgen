import type { RegisterOptions } from 'react-hook-form';

export const getNameValidation = (isLogin: boolean): RegisterOptions =>
  isLogin ? {} : { required: 'Required' };

export const getEmailValidation = (): RegisterOptions => ({
  required: 'Required',
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email invalid'
  }
});

export const getPasswordValidation = (isLogin: boolean): RegisterOptions =>
  isLogin
    ? { required: 'Required' }
    : {
        required: 'Required',
        minLength: {
          value: 8,
          message: 'Must be at least 8 characters'
        },
        validate: (value: string) => {
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

          return errors.length > 0 ? errors.join('\n') : undefined;
        }
      };

export const getPasswordConfirmValidation = (
  isLogin: boolean,
  password: string
): RegisterOptions =>
  isLogin
    ? {}
    : {
        required: 'Required',
        validate: (value: string) => value === password || 'Passwords mismatch'
      };
