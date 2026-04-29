import { Fragment, ReactNode } from 'react';
import {
  Backdrop,
  Box,
  ClickAwayListener,
  IconButton,
  SxProps,
  Tooltip,
  TooltipProps
} from '@mui/material';
import { useToggle } from '@hooks/useToggle';

export function TooltipButton({
  children,
  sx,
  title,
  ...props
}: {
  sx?: SxProps;
  children: ReactNode;
} & Omit<TooltipProps, 'children' | 'open' | 'onClose' | 'disableTouchListener'>) {
  const { isOn: isOpen, turnOn: open, turnOff: close } = useToggle(false);

  return title ? (
    <ClickAwayListener onClickAway={close}>
      <Box sx={sx} display="inline-block">
        <Backdrop invisible open={isOpen} onClick={close} />
        <Tooltip title={title} arrow open={isOpen} disableTouchListener onClose={close} {...props}>
          <IconButton onClick={open} sx={{ padding: 0 }} onMouseEnter={open} onMouseLeave={close}>
            {children}
          </IconButton>
        </Tooltip>
      </Box>
    </ClickAwayListener>
  ) : (
    <Fragment>{children}</Fragment>
  );
}
