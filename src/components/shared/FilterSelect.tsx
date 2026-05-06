import type { ReactNode } from 'react';
import {
  FormControl,
  type FormControlProps,
  InputLabel,
  MenuItem,
  Select,
  type SelectProps
} from '@mui/material';

interface FilterOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface FilterSelectProps extends Omit<FormControlProps, 'onChange' | 'children'> {
  id: string;
  label?: string;
  value: FilterOption['value'];
  onChange: (v: FilterOption['value']) => void;
  options?: FilterOption[];
  children?: ReactNode;
  selectSx?: SelectProps['sx'];
}

export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  children,
  selectSx,
  ...formControlProps
}: FilterSelectProps) {
  return (
    <FormControl size="small" {...formControlProps}>
      {label && <InputLabel htmlFor={id}>{label}</InputLabel>}
      <Select
        id={id}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={selectSx}
      >
        {children ??
          options?.map(({ value: v, label: l, disabled }) => (
            <MenuItem key={String(v)} value={v} disabled={disabled}>
              {l}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
