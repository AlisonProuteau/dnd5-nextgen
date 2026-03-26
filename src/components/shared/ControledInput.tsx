import type { ChangeEvent } from 'react';
import { Control, Controller, ControllerProps } from 'react-hook-form';
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
  control?: Control<any, any, any>;
  rules?: ControllerProps['rules'];
  hiddenValues?: any[];
}

export function ControledInput({
  onChange,
  errorMessage,
  hasError = false,
  fullWidth = false,
  control,
  rules,
  hiddenValues,
  sx,
  ...props
}: ControledInputProps & Omit<OutlinedInputProps, 'onChange'>) {
  return control ? (
    <Controller
      name={props.id ?? props.name ?? 'input'}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormControl
          error={!!fieldState.error || hasError}
          fullWidth={fullWidth}
          margin="dense"
          required={props.required}
          size={props.size}
          data-testid={props.id ? `${props.id}-form` : undefined}
        >
          <InputLabel htmlFor={props.id}>{props.label}</InputLabel>
          <OutlinedInput
            {...field}
            {...props}
            value={
              !hiddenValues?.includes(field.value) && field.value !== undefined ? field.value : ''
            }
            autoComplete={props.autoComplete ?? props.id}
            onChange={(e) =>
              onChange ? onChange(e, e.target.value) : field.onChange(e.target.value)
            }
          />
          {(!!fieldState.error || hasError) &&
            (errorMessage?.length
              ? errorMessage.map((message, i) => (
                  <FormHelperText
                    key={`${props.id ?? 'input'}-error-${i}`}
                    id={`${props.id ?? 'input'}-error-${i}`}
                    sx={i ? { marginTop: '-4px' } : {}}
                  >
                    {message}
                  </FormHelperText>
                ))
              : fieldState.error?.message && (
                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                ))}
        </FormControl>
      )}
    />
  ) : (
    <FormControl
      sx={sx}
      error={hasError}
      fullWidth={fullWidth}
      margin="dense"
      required={props.required}
      size={props.size}
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
