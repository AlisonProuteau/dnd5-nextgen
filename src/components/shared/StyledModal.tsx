import { Box, Modal, Typography, type ModalProps } from '@mui/material';

export function StyledModal(props: ModalProps) {
  const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4
  };

  return (
    <Modal {...props}>
      <Box sx={style}>
        {props.title && (
          <Typography variant="h6" component="h2">
            {props.title}
          </Typography>
        )}
        {props.children}
      </Box>
    </Modal>
  );
}
