import { type ForwardedRef, forwardRef, ReactNode } from 'react';
import { NumberField, type NumberFieldRootProps } from '@base-ui/react/number-field';
import { Add, Remove } from '@mui/icons-material';
import { Box, InputLabel } from '@mui/material';
import { styled } from '@mui/material/styles';

interface CustomNumberInputProps {
  id: string;
  label?: ReactNode;
  addDisabled?: boolean;
  removeDisabled?: boolean;
  compact?: boolean;
  onChange?: (event: Event, value: number | null) => void;
  buttonsHidden?: boolean;
}

export const NumberInput = forwardRef(function CustomNumberInput(
  {
    id,
    label,
    addDisabled,
    removeDisabled,
    onChange,
    compact = false,
    buttonsHidden = false,
    ...props
  }: CustomNumberInputProps & NumberFieldRootProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  return (
    <NumberField.Root
      id={id}
      {...props}
      onValueChange={(newValue, e) => {
        // TODO-blocked: Workaround for step not snapping properly with keyboard input - remove when fixed in @base-ui/react
        const snappedValue =
          newValue && props.step && props.step !== 'any'
            ? Math.round(newValue / props.step) * props.step
            : newValue;
        onChange && e.reason !== 'input-blur' && onChange(e.event, snappedValue);
      }}
      ref={ref}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        marginY={compact ? 0 : '4px'}
        sx={props.readOnly ? { ' button': { display: 'none' } } : {}}
      >
        {label ? (
          <InputLabel sx={{ marginBottom: compact ? 0 : '-3px' }} htmlFor={id}>
            {label}
          </InputLabel>
        ) : null}
        <StyledGroup as={NumberField.Group}>
          {buttonsHidden ? null : (
            <StyledButton
              as={NumberField.Decrement}
              disabled={removeDisabled}
              compact={compact}
              position="left"
              id={`${id}-decrement`}
            >
              <Remove fontSize="small" />
            </StyledButton>
          )}
          <StyledInput as={NumberField.Input} compact={compact} id={id} />
          {buttonsHidden ? null : (
            <StyledButton
              as={NumberField.Increment}
              disabled={addDisabled}
              compact={compact}
              position="right"
              id={`${id}-increment`}
            >
              <Add fontSize="small" />
            </StyledButton>
          )}
        </StyledGroup>
      </Box>
    </NumberField.Root>
  );
});

const StyledGroup = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}));

const StyledInput = styled('input')<{ compact?: boolean }>(({ theme, compact }) => ({
  boxSizing: 'border-box',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  fontWeight: 400,
  lineHeight: 1.375,
  color: theme.palette.text.primary,
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  margin: compact ? '0 3px' : '0 6px',
  padding: compact ? '3px 5px' : '8px 10px',
  outline: 0,
  minWidth: 0,
  width: compact ? '2.5rem' : '4rem',
  textAlign: 'center',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 1px 2px rgba(0, 0, 0, 0.3)'
      : '0 1px 2px rgba(0, 0, 0, 0.05)',

  '&:hover': {
    borderColor: theme.palette.primary.light
  },

  '&:focus': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.25)' : 'rgba(25, 118, 210, 0.25)'}`
  },

  '&:focus-visible': {
    outline: 0
  },

  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.4,
    background: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled
  }
}));

const StyledButton = styled('button')<{ compact?: boolean; position: 'left' | 'right' }>(
  ({ theme, compact, position }) => ({
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    lineHeight: 1.5,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 999,
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    width: compact ? 24 : 32,
    height: compact ? 24 : 32,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
    outline: 0,
    padding: 0,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 1px 2px rgba(0, 0, 0, 0.3)'
        : '0 1px 2px rgba(0, 0, 0, 0.05)',

    ...(position === 'right' && {
      order: 1
    }),

    '&:hover:not(:disabled)': {
      background: theme.palette.action.hover,
      borderColor: theme.palette.primary.light,
      boxShadow:
        theme.palette.mode === 'dark'
          ? '0 2px 4px rgba(0, 0, 0, 0.4)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)'
    },

    '&:active:not(:disabled)': {
      background: theme.palette.action.selected
    },

    '&:focus-visible': {
      outline: 0,
      borderColor: theme.palette.primary.main
    },

    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.4,
      background: theme.palette.action.disabledBackground,
      color: theme.palette.text.disabled,
      boxShadow: 'none'
    }
  })
);
