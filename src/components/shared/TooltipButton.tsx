import { Fragment, ReactNode } from 'react';
import { Backdrop, Box, ClickAwayListener, IconButton, Tooltip, TooltipProps } from '@mui/material';
import { useToggle } from '@hooks/useToggle';

interface TooltipButtonProps extends Omit<
  TooltipProps,
  'children' | 'open' | 'onClose' | 'disableTouchListener'
> {
  block?: boolean;
  children: ReactNode;
}

export function TooltipButton({
  children,
  sx,
  title,
  block = false,
  ...props
}: TooltipButtonProps) {
  const { isOn: isHovered, turnOn: focus, turnOff: unfocus } = useToggle(false);
  const { isOn: isPinned, turnOn: pin, turnOff: unpin } = useToggle(false);

  const close = () => {
    unpin();
    unfocus();
  };

  return title ? (
    <ClickAwayListener onClickAway={close}>
      <Box sx={sx} display="inline-block">
        {block && (
          <Backdrop
            invisible
            open={isHovered || isPinned}
            onClick={close}
            sx={(theme) => ({ zIndex: theme.zIndex.tooltip - 1 })}
          />
        )}
        <Tooltip title={title} arrow open={isHovered || isPinned} disableTouchListener {...props}>
          <IconButton
            sx={(theme) => ({
              zIndex: isHovered || isPinned ? theme.zIndex.tooltip : 'auto',
              padding: 0
            })}
            onClick={() => (isPinned ? close() : pin())}
            onMouseEnter={focus}
            onMouseLeave={close}
          >
            {children}
          </IconButton>
        </Tooltip>
      </Box>
    </ClickAwayListener>
  ) : (
    <Fragment>{children}</Fragment>
  );
}
