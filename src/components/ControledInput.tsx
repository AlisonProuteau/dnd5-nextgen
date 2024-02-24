import { FormControl, FormHelperText, InputLabel, OutlinedInput } from '@mui/material';
import type { ReactNode } from 'react';

interface ControledInputProps {
  id: string;
  type: string;
  label: string;
  endAdornment?: ReactNode;
  onChange?: (arg: string | boolean | undefined) => void;
  errorMessage?: string;
  hasError?: boolean;
}

export function ControledInput({
  id,
  type,
  label,
  endAdornment,
  onChange,
  errorMessage,
  hasError = false
}: ControledInputProps) {
  return (
    <FormControl error={hasError} fullWidth autoFocus margin="dense">
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <OutlinedInput
        id={id}
        type={type}
        autoComplete={id}
        label={label}
        onChange={({ currentTarget }) => onChange?.(currentTarget.value)}
        endAdornment={endAdornment}
      />
      {hasError && <FormHelperText id={id}>{errorMessage}</FormHelperText>}
    </FormControl>
  );
}
