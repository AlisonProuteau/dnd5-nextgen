import { Fragment } from 'react';
import { Add, Close } from '@mui/icons-material';
import {
  Button,
  type ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Typography
} from '@mui/material';
import { useToggle } from '@hooks/useToggle';

export function AccordionButton({ title, ...props }: { title: string } & ButtonProps) {
  return (
    <Button
      component={Paper}
      sx={{
        ...props.sx,
        display: 'flex',
        alignItems: 'center',
        minHeight: '48px',
        paddingX: 2,
        textTransform: 'none',
        color: 'white'
      }}
      {...props}
    >
      <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
        <Typography component="h3" variant="subtitle2">
          {title}
        </Typography>
      </Divider>
      <Add />
    </Button>
  );
}

export function AccordionButtonDialog({
  title,
  children,
  ...props
}: { title: string } & Omit<DialogProps, 'open' | 'onClose'>) {
  const { isOn: isOpen, turnOn: open, turnOff: close } = useToggle();

  return (
    <Fragment>
      <AccordionButton fullWidth title={title} onClick={open} />
      <Dialog {...props} open={isOpen} onClose={close}>
        <DialogTitle>{title}</DialogTitle>
        <DialogActions>
          <IconButton
            aria-label="close"
            onClick={close}
            sx={(theme) => ({
              position: 'absolute',
              right: 2,
              top: 2,
              color: theme.palette.grey[500]
            })}
          >
            <Close />
          </IconButton>
        </DialogActions>
        <DialogContent sx={{ paddingTop: 0 }}>{children}</DialogContent>
      </Dialog>
    </Fragment>
  );
}
