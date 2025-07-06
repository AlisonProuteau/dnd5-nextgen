import { Box, Card, CardMedia, CircularProgress, Typography } from '@mui/material';
import { Fragment, useState } from 'react';
import { ActionState, downloadImage, uploadImage } from '../utils/actions';
import type { CharacterDetails } from '../utils/character';
import ActionButton from './ActionButton';

export default function PortraitDisplay({
  isLoading,
  character
}: {
  isLoading: boolean;
  character: CharacterDetails | null;
}) {
  const [uploadState, setUploadState] = useState<ActionState>('idle');
  const [downloadState, setDownloadState] = useState<ActionState>('idle');

  const handleDownload = async () => {
    if (!character?.url) return;
    await downloadImage(character.url, character, setDownloadState);
  };

  const handleUpload = async () => {
    if (!character?.url) return;
    await uploadImage(character.url, character, setUploadState);
  };

  if (isLoading) {
    return (
      <Box
        mt={4}
        mb={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress size={60} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Generating your portrait...
        </Typography>
      </Box>
    );
  }

  if (!character) return null;

  return (
    <Fragment>
      <Box mt={4} mb={2} display="flex" justifyContent="center">
        {character.url ? (
          <Card sx={{ maxWidth: 400, boxShadow: 4, borderRadius: 2 }}>
            <CardMedia
              component="img"
              image={character.url}
              alt="Generated Portrait"
              sx={{ objectFit: 'contain', borderRadius: 2 }}
            />
          </Card>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Your generated portrait will appear here.
          </Typography>
        )}
      </Box>

      {character.url && (
        <Box mt={2} display="flex" gap={2} justifyContent="center">
          <ActionButton actionType="download" state={downloadState} onClick={handleDownload} />
          <ActionButton
            actionType="upload"
            state={uploadState}
            onClick={handleUpload}
            disabled={uploadState === 'done'}
          />
        </Box>
      )}
    </Fragment>
  );
}
