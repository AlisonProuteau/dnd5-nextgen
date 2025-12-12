import {
  CloudDone,
  CloudOff,
  CloudUpload,
  DownloadDone,
  Downloading,
  FileDownloadOff
} from '@mui/icons-material';
import { Button, type ButtonProps, CircularProgress } from '@mui/material';
import type { ActionState } from '@utils/ui';

interface ActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  actionType: 'download' | 'upload';
  state: ActionState;
  onClick: () => void;
  count?: number;
  bulk?: boolean;
}

export default function ActionButton({
  actionType,
  state,
  onClick,
  count,
  bulk = false,
  disabled,
  ...props
}: ActionButtonProps) {
  const getIcon = () => {
    if (state === 'downloading') return <Downloading />;
    if (state === 'uploading') return bulk ? <CircularProgress size={16} /> : <CloudUpload />;
    if (state === 'done')
      return actionType === 'download' ? (
        <DownloadDone color="success" />
      ) : (
        <CloudDone color="success" />
      );
    if (state === 'failed')
      return actionType === 'download' ? (
        <FileDownloadOff color="error" />
      ) : (
        <CloudOff color="error" />
      );
    return null;
  };

  const isDisabled = disabled || state === 'downloading' || state === 'uploading';

  return (
    <Button
      variant="outlined"
      color={actionType === 'download' ? 'primary' : 'secondary'}
      onClick={onClick}
      disabled={isDisabled}
      startIcon={getIcon()}
      data-testid={['done', 'failed', 'idle'].includes(state) ? `${actionType}-${state}` : state}
      {...props}
    >
      {actionType === 'download' ? 'Download' : 'Upload'}
      {bulk && count !== undefined && ` All (${count})`}
    </Button>
  );
}
