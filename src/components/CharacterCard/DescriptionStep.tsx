import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Fragment } from 'react';
import Age from '../../svgs/age.svg?react';
import Alignment from '../../svgs/alignement.svg?react';
import Female from '../../svgs/female.svg?react';
import Height from '../../svgs/height.svg?react';
import Male from '../../svgs/male.svg?react';
import Other from '../../svgs/other.svg?react';
import { GenderIndexes } from '../CharacterCreation/CharacterDescription';
import { IconText } from '../shared/IconText';
import type { Character } from './CharacterContainer';

export function Description({ character }: { character: Character }) {
  const getGenderIcon = (genderIndex: GenderIndexes) => {
    switch (genderIndex) {
      case GenderIndexes.female:
        return Female;
      case GenderIndexes.male:
        return Male;
      default:
        return Other;
    }
  };

  return (
    <Fragment>
      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr 1fr" alignItems="end">
        <IconText
          label="Sex"
          Icon={getGenderIcon(character.sex.index as GenderIndexes)}
          color="grey"
          top="0px"
        />
        <IconText label="Age" value={character.age} Icon={Age} color="grey" top="45px" />
        <IconText label="Size" value={character.size} Icon={Height} color="grey" />
        <IconText
          label="Alignment"
          value={character.alignment.abbreviation}
          Icon={Alignment}
          color="grey"
        />
      </Box>

      <Box>
        <Typography>Appearance: {character.appearance}</Typography>
        <Typography>Background: {character.background.name}</Typography>
        <Typography>Bonds: {character.bonds}</Typography>
        <Typography>Ideals: {character.ideals}</Typography>
        <Typography>Flaws: {character.flaws}</Typography>
        <Typography>Personality: {character.personality}</Typography>
      </Box>
    </Fragment>
  );
}
