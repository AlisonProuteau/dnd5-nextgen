import type { ChangeEvent } from 'react';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  type OutlinedInputProps,
  type SxProps,
  type Theme
} from '@mui/material';

interface ControledInputProps {
  onChange?: (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement, Element>,
    value: string | boolean | undefined
  ) => void;
  errorMessage?: string[];
  sx?: SxProps<Theme>;
  hasError?: boolean;
  fullWidth?: boolean;
}

export function ControledInput({
  onChange,
  errorMessage,
  hasError = false,
  fullWidth = false,
  sx,
  ...props
}: ControledInputProps & Omit<OutlinedInputProps, 'onChange'>) {
  return (
    <FormControl
      sx={sx}
      error={hasError}
      fullWidth={fullWidth}
      margin="dense"
      required={props.required}
      data-testid={props.id ? `${props.id}-form` : undefined}
    >
      <InputLabel htmlFor={props.id}>{props.label}</InputLabel>
      <OutlinedInput
        {...props}
        autoComplete={props.autoComplete ?? props.id}
        onChange={(e) => onChange?.(e, e.target.value)}
      />
      {hasError &&
        errorMessage?.map((message, i) => (
          <FormHelperText
            key={`${props.id ?? 'input'}-error-${i}`}
            id={`${props.id ?? 'input'}-error-${i}`}
            sx={i ? { marginTop: '-4px' } : {}}
          >
            {message}
          </FormHelperText>
        ))}
    </FormControl>
  );
}
