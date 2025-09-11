import { Add, Close } from '@mui/icons-material';
import {
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Typography,
  type DialogProps
} from '@mui/material';
import { Fragment, useState } from 'react';

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
        <Typography variant="subtitle2">{title}</Typography>
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
  const [isOpen, setOpen] = useState(false);

  return (
    <Fragment>
      <AccordionButton fullWidth title={title} onClick={() => setOpen(true)} />
      <Dialog open={isOpen} onClose={() => setOpen(false)} {...props}>
        <DialogTitle>{title}</DialogTitle>
        <DialogActions>
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
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
