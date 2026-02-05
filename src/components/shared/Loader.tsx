import { Backdrop, CircularProgress } from '@mui/material';

interface LoaderProps {
  open: boolean;
}

export function Loader({ open }: LoaderProps) {
  return (
    <Backdrop sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1, marginTop: '48px' })} open={open}>
      <CircularProgress />
    </Backdrop>
  );
}
