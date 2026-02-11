import { type ForwardedRef, forwardRef } from 'react';
import {
  Unstable_NumberInput as BaseNumberInput,
  type NumberInputProps
} from '@mui/base/Unstable_NumberInput';
import { Add, Remove } from '@mui/icons-material';
import { Box, InputLabel, type SxProps, type Theme } from '@mui/material';
import { styled } from '@mui/system';

interface CustomNumberInputProps {
  id: string;
  label?: string;
  sx?: SxProps<Theme>;
  fullWidth?: boolean;
  addDisabled?: boolean;
  removeDisabled?: boolean;
  compact?: boolean;
}

export const NumberInput = forwardRef(function CustomNumberInput(
  {
    id,
    label,
    addDisabled,
    removeDisabled,
    compact = false,
    ...props
  }: CustomNumberInputProps & NumberInputProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      marginY={compact ? 0 : '5px'}
      sx={props.readOnly ? { ' button': { display: 'none' } } : {}}
    >
      <InputLabel sx={{ marginBottom: compact ? 0 : '-2px' }} htmlFor={id}>
        {label}
      </InputLabel>
      <BaseNumberInput
        id={id}
        {...props}
        slots={{
          root: StyledInputRoot,
          input: compact ? StyledInputCompact : StyledInput,
          incrementButton: compact ? StyledButtonCompact : StyledButton,
          decrementButton: compact ? StyledButtonCompact : StyledButton,
          ...props.slots
        }}
        slotProps={{
          input: {
            id,
            'aria-label': props['aria-label'] || label,
            disabled: props.disabled
          },
          incrementButton: {
            children: <Add fontSize="small" />,
            className: 'increment',
            disabled: props.disabled || addDisabled,
            id: `${id}-increment`
          },
          decrementButton: {
            children: <Remove fontSize="small" />,
            className: 'decrement',
            disabled: props.disabled || removeDisabled,
            id: `${id}-decrement`
          },
          ...props.slotProps
        }}
        ref={ref}
      />
    </Box>
  );
});

const StyledInputRoot = styled('div')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 400;
  color: ${theme.palette.grey[500]};
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`
);

const StyledInput = styled('input')(
  ({ theme }) => `
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 400;
  line-height: 1.375;
  color: ${theme.palette.text.primary};
  background: ${theme.palette.background.paper};
  border: 1px solid ${theme.palette.grey[700]};
  box-shadow: 0px 2px 4px ${
    theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.5)' : 'rgba(0,0,0, 0.05)'
  };
  border-radius: 8px;
  margin: 0 8px;
  padding: 10px 12px;
  outline: 0;
  min-width: 0;
  width: 4rem;
  text-align: center;

  &:hover {
    border-color: ${theme.palette.primary.main};
  }

  &:focus {
    border-color: ${theme.palette.primary.main};
    box-shadow: 0 0 0 3px ${theme.palette.primary.dark};
  }

  &:focus-visible {
    outline: 0;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background: ${theme.palette.action.disabledBackground};
    color: ${theme.palette.text.disabled};
  }
`
);

const StyledButton = styled('button')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  line-height: 1.5;
  border: 1px solid;
  border-radius: 999px;
  border-color: ${theme.palette.grey[700]};
  background: ${theme.palette.background.default};
  color: ${theme.palette.text.primary};
  width: 32px;
  height: 32px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &:hover {
    cursor: pointer;
    background: ${theme.palette.primary.main};
    border-color: ${theme.palette.primary.dark};
    color: ${theme.palette.primary.contrastText};
  }

  &:focus-visible {
    outline: 0;
  }

  &.increment {
    order: 1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background: ${theme.palette.action.disabledBackground};
    color: ${theme.palette.text.disabled};
  }
`
);

const StyledInputCompact = styled('input')(
  ({ theme }) => `
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 400;
  line-height: 1.375;
  color: ${theme.palette.text.primary};
  background: ${theme.palette.background.paper};
  border: 1px solid ${theme.palette.grey[700]};
  box-shadow: 0px 2px 4px ${
    theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.5)' : 'rgba(0,0,0, 0.05)'
  };
  border-radius: 8px;
  margin: 0 4px;
  padding: 4px 6px;
  outline: 0;
  min-width: 0;
  width: 2.5rem;
  text-align: center;

  &:hover {
    border-color: ${theme.palette.primary.main};
  }

  &:focus {
    border-color: ${theme.palette.primary.main};
    box-shadow: 0 0 0 3px ${theme.palette.primary.dark};
  }

  &:focus-visible {
    outline: 0;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background: ${theme.palette.action.disabledBackground};
    color: ${theme.palette.text.disabled};
  }
`
);

const StyledButtonCompact = styled('button')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  line-height: 1.5;
  border: 1px solid;
  border-radius: 999px;
  border-color: ${theme.palette.grey[700]};
  background: ${theme.palette.background.default};
  color: ${theme.palette.text.primary};
  width: 24px;
  height: 24px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &:hover {
    cursor: pointer;
    background: ${theme.palette.primary.main};
    border-color: ${theme.palette.primary.dark};
    color: ${theme.palette.primary.contrastText};
  }

  &:focus-visible {
    outline: 0;
  }

  &.increment {
    order: 1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background: ${theme.palette.action.disabledBackground};
    color: ${theme.palette.text.disabled};
  }
`
);
