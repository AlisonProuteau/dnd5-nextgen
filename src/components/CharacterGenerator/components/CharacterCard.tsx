import { Box, Card, CardContent, CardMedia, Typography } from '@mui/material';
import { ActionState } from '@utils/ui';
import { Fragment } from 'react';
import { CharacterDetails } from '../utils/character';
import { classColors } from '../utils/imageUtils';
import ActionButton from './ActionButton';

interface CharacterCardProps {
  character: CharacterDetails;
  status: 'pending' | 'generating' | 'done' | 'failed';
  url?: string;
  downloadState?: ActionState;
  uploadState?: ActionState;
  onDownload?: () => void;
  onUpload?: () => void;
}

export default function CharacterCard({
  character,
  status,
  url,
  downloadState = 'idle',
  uploadState = 'idle',
  onDownload,
  onUpload
}: CharacterCardProps) {
  return (
    <Card
      data-testid={`character-card-${character.class}-${character.race}-${character.gender}`}
      sx={{
        width: 220,
        borderRadius: 3,
        borderLeft: `6px solid ${classColors[character.class] || '#ccc'}`
      }}
    >
      <CardContent>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          {character.race} {character.class}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {status}
        </Typography>

        {status === 'done' && url && (
          <Fragment>
            <CardMedia component="img" src={url} sx={{ borderRadius: 1, mt: 1 }} />
            <Box mt={1} display="flex" gap={1} flexDirection="column">
              <ActionButton
                actionType="download"
                state={downloadState}
                onClick={onDownload || (() => {})}
                size="small"
              />
              <ActionButton
                actionType="upload"
                state={uploadState}
                onClick={onUpload || (() => {})}
                size="small"
                disabled={uploadState === 'done'}
              />
            </Box>
          </Fragment>
        )}
      </CardContent>
    </Card>
  );
}
