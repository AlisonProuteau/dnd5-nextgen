import type { FieldError } from 'react-hook-form';

export const getAllValidationErrors = (errors?: FieldError) => {
  if (!errors) return undefined;

  const fieldErrorMessages = (Object.values(errors.types || {}) as string[]).flatMap((message) =>
    message.split('/n')
  );
  if (fieldErrorMessages.length > 0) return fieldErrorMessages;

  const errorMessage = errors.message;
  return errorMessage ? [errorMessage] : undefined;
};
