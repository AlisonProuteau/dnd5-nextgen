import { ReactNode } from 'react';
import { Box, ClickAwayListener, IconButton, SxProps, Tooltip, TooltipProps } from '@mui/material';
import { useToggle } from '@hooks/useToggle';

export function TooltipButton({
  children,
  sx,
  ...props
}: {
  sx?: SxProps;
  children: ReactNode;
} & Omit<TooltipProps, 'children' | 'open' | 'onClose' | 'disableTouchListener'>) {
  const { isOn: isOpen, turnOn: open, turnOff: close } = useToggle(false);

  return (
    <ClickAwayListener onClickAway={close}>
      <Box sx={sx} display="inline-block">
        <Tooltip arrow open={isOpen} disableTouchListener onClose={close} {...props}>
          <IconButton onClick={open} sx={{ padding: 0 }} onMouseEnter={open} onMouseLeave={close}>
            {children}
          </IconButton>
        </Tooltip>
      </Box>
    </ClickAwayListener>
  );
}
