import {
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  type SxProps,
  type Theme
} from '@mui/material';
import type { ReactNode } from 'react';

interface ControledInputProps {
  id: string;
  type?: string;
  label?: string;
  sx?: SxProps<Theme>;
  endAdornment?: ReactNode;
  onChange?: (arg: string | boolean | undefined) => void;
  errorMessage?: string[];
  hasError?: boolean;
  multiline?: boolean;
  fullWidth?: boolean;
}

export function ControledInput({
  id,
  type,
  label,
  sx,
  endAdornment,
  onChange,
  errorMessage,
  hasError = false,
  multiline = false,
  fullWidth = false
}: ControledInputProps) {
  return (
    <FormControl sx={sx} error={hasError} fullWidth={fullWidth} margin="dense">
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <OutlinedInput
        id={id}
        type={type}
        multiline={multiline}
        autoComplete={id}
        label={label}
        onChange={({ currentTarget }) => onChange?.(currentTarget.value)}
        endAdornment={endAdornment}
      />
      {hasError &&
        errorMessage?.map((message, i) => (
          <FormHelperText key={id + i} id={id + i} sx={i ? { marginTop: '-4px' } : {}}>
            {message}
          </FormHelperText>
        ))}
    </FormControl>
  );
}
