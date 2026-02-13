import type { ChangeHandler } from 'react-hook-form';
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
  onChange?: ((arg: string | boolean | undefined) => void) | ChangeHandler;
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
      data-testid={props?.id ? `${props.id}-form` : undefined}
    >
      <InputLabel htmlFor={props.id}>{props.label}</InputLabel>
      <OutlinedInput
        autoComplete={props.id}
        {...props}
        onChange={(e) => {
          if (onChange) {
            // Check if it's an async function (react-hook-form pattern) or has 'event' as param name
            const fnStr = onChange.toString();
            const isReactHookFormHandler =
              fnStr.startsWith('async') ||
              fnStr.includes('async (event)') ||
              fnStr.includes('async(event)');

            if (isReactHookFormHandler) return (onChange as any)(e);
            else return (onChange as (arg: string | boolean | undefined) => void)(e.target.value);
          }
        }}
      />
      {hasError &&
        errorMessage?.map((message, i) => (
          <FormHelperText
            key={props?.id || '' + i}
            id={props?.id || '' + i}
            sx={i ? { marginTop: '-4px' } : {}}
          >
            {message}
          </FormHelperText>
        ))}
    </FormControl>
  );
}
