import { Fragment } from 'react';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { DefaultProps } from 'src/pages/Header';
import { FeaturesDisplay } from './FeaturesDisplay';
import { TraitsDisplay } from './TraitsDisplay';

export function Characteristics({ character }: DefaultProps) {
  return (
    <Fragment>
      <Box data-testid="proficiencies-section">
        <Typography variant="body2" color="lightgrey" display="inline" paddingRight="5px">
          Proficiencies:
        </Typography>
        <Typography display="inline">
          {character.proficiencies.map((p) => p.name).join(', ')}
        </Typography>
      </Box>
      <Box data-testid="language-section">
        <Typography variant="body2" color="lightgrey" display="inline" paddingRight="5px">
          Languages:{' '}
        </Typography>
        <Typography display="inline">
          {character.languages.map((language) => language.name).join(', ')}
        </Typography>
      </Box>
      <FeaturesDisplay character={character} />
      <TraitsDisplay character={character} />
    </Fragment>
  );
}
