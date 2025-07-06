import { CloudDone, CloudOff, CloudUpload, DownloadDone, Downloading } from '@mui/icons-material';
import { Box, Button, Card, CardMedia, CircularProgress, Typography } from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import type { CharacterDetails } from '../utils/character';
import { saveImageToFirebase } from '../utils/firebase';

export default function PortraitDisplay({
  isLoading,
  character
}: {
  isLoading: boolean;
  character: CharacterDetails | null;
}) {
  const [uploadState, setUploadState] = useState<string>('idle');
  const [downloadState, setDownloadState] = useState<string>('idle');

  useEffect(() => {
    if (isLoading) {
      setUploadState('idle');
      setDownloadState('idle');
    }
  }, [character?.url, isLoading]);

  const getUploadIcon = () => {
    switch (uploadState) {
      case 'uploading':
        return <CloudUpload />;
      case 'done':
        return <CloudDone color="success" />;
      case 'failed':
        return <CloudOff color="error" />;
      default:
        return null;
    }
  };

  return isLoading ? (
    <Box mt={4} mb={2} display="flex" justifyContent="center">
      <CircularProgress />
    </Box>
  ) : (
    character !== null && (
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
          <Box mt={2}>
            <Button
              variant="outlined"
              onClick={async () => {
                setUploadState('uploading');
                try {
                  const result = await saveImageToFirebase(character.url!, character);

                  if (result) setUploadState('done');
                  else setUploadState('failed');
                } catch {
                  setUploadState('failed');
                }
              }}
              disabled={uploadState === 'uploading'}
              endIcon={getUploadIcon()}
            >
              Upload to Firebase
            </Button>

            <Button
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={() => {
                setDownloadState('downloading');
                const link = document.createElement('a');
                link.href = character.url!;
                link.download = `${character.class}-${character.race}-${
                  character.gender
                }_${Date.now()}.png`;

                link.click();
                setTimeout(() => {
                  setDownloadState('done');
                }, 500);
              }}
              disabled={downloadState === 'downloading'}
              endIcon={
                downloadState === 'downloading' ? (
                  <Downloading />
                ) : downloadState === 'done' ? (
                  <DownloadDone color="success" />
                ) : null
              }
            >
              Download Image
            </Button>
          </Box>
        )}
      </Fragment>
    )
  );
}
