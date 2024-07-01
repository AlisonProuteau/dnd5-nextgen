import { AgeIcon, AlignmentIcon, FemaleIcon, HeightIcon, MaleIcon, OtherIcon } from '@assets';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Character } from '@representations/user.representation';
import { IconText } from '@shared/IconText';
import { Fragment } from 'react';
import { GenderIndexes } from '../../CharacterCreation/CharacterDescription';

export function Description({ character }: { character: Character }) {
  const getGenderIcon = (genderIndex: GenderIndexes) => {
    switch (genderIndex) {
      case GenderIndexes.female:
        return FemaleIcon;
      case GenderIndexes.male:
        return MaleIcon;
      default:
        return OtherIcon;
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
        <IconText label="Age" value={character.age} Icon={AgeIcon} color="grey" top="45px" />
        <IconText label="Size" value={character.size} Icon={HeightIcon} color="grey" />
        <IconText
          label="Alignment"
          value={character.alignment.abbreviation}
          Icon={AlignmentIcon}
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
