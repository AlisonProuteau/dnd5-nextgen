import { Backdrop, CircularProgress, type CircularProgressProps } from '@mui/material';
import { Box, type SxProps } from '@mui/system';

interface LoaderProps {
  open: boolean;
}

export function FullPageLoader({ open }: LoaderProps) {
  return (
    <Backdrop sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1, marginTop: '48px' })} open={open}>
      <CircularProgress />
    </Backdrop>
  );
}
export function Loader(props: CircularProgressProps) {
  return (
    <Box
      data-testid="loader"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%"
      flexGrow={1}
      sx={props.sx as SxProps}
    >
      <CircularProgress size={24} {...props} />
    </Box>
  );
}
