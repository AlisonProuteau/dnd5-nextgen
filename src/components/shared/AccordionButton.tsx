import { Add } from '@mui/icons-material';
import { Button, Divider, Paper, Typography, type ButtonProps } from '@mui/material';

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
