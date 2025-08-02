import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Character } from '@representations/user.representation';
import { Fragment } from 'react';
import { FeaturesDisplay } from './FeaturesDisplay';
import { TraitsDisplay } from './TraitsDisplay';

export function Characteristics({ character }: { character: Character }) {
  return (
    <Fragment>
      <Box>
        <Typography variant="body2" color="lightgrey" display="inline" paddingRight="5px">
          Proficiencies:
        </Typography>
        <Typography display="inline">
          {character.proficiencies.map((p) => p.name).join(', ')}
        </Typography>
      </Box>
      <Box>
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
