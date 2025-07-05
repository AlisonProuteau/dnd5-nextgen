import { CloudDone, CloudOff, DownloadDone, Downloading } from '@mui/icons-material';
import { Box, Button, Card, CardMedia, CircularProgress, Typography } from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import type { CharacterDetails } from '../utils/character';
import { saveImageToFirebase } from '../utils/firebase';

export default function PortraitDisplay({
  character,
  prompt,
  isLoading
}: {
  character: CharacterDetails;
  prompt: string;
  isLoading: boolean;
}) {
  const [uploadState, setUploadState] = useState<string>('idle');
  const [downloadState, setDownloadState] = useState<string>('idle');

  useEffect(() => {
    if (isLoading) {
      setUploadState('idle');
      setDownloadState('idle');
    }
  }, [character.url, isLoading]);

  return (
    <Fragment>
      {isLoading ? (
        <CircularProgress />
      ) : (
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
                    const result = await saveImageToFirebase(character.url!, '', {});
                    if (result) {
                      setUploadState('done');
                    } else {
                      setUploadState('failed');
                    }
                  } catch {
                    setUploadState('failed');
                  }
                }}
                disabled={uploadState === 'uploading'}
                endIcon={
                  uploadState === 'uploading' ? (
                    <CircularProgress size={16} />
                  ) : uploadState === 'done' ? (
                    <CloudDone color="success" />
                  ) : uploadState === 'failed' ? (
                    <CloudOff color="error" />
                  ) : null
                }
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
                  link.download = 'character.png';
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
      )}
      x
    </Fragment>
  );
}
