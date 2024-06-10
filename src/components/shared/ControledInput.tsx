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
  onChange?: (arg: string | boolean | undefined) => void;
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
}: ControledInputProps & OutlinedInputProps) {
  return (
    <FormControl sx={sx} error={hasError} fullWidth={fullWidth} margin="dense">
      <InputLabel htmlFor={props.id}>{props.label}</InputLabel>
      <OutlinedInput
        autoComplete={props.id}
        onChange={({ currentTarget }) => onChange?.(currentTarget.value)}
        {...props}
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
