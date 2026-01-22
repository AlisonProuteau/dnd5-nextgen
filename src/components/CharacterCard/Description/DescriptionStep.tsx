import { AgeIcon, AlignmentIcon, FemaleIcon, HeightIcon, MaleIcon, OtherIcon } from '@assets';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { IconText } from '@shared/IconText';
import type { DefaultProps } from 'src/pages/Header';
import { GenderIndexes } from '../../CharacterCreation/CharacterDescription';

export function Description({ character }: DefaultProps) {
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
    <Box data-testid="description-section" display="flex" gap="15px" flexDirection="column">
      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr 1fr" alignItems="end">
        <IconText
          label="Sex"
          Icon={getGenderIcon((character.sex?.index as GenderIndexes) || GenderIndexes.other)}
          color="grey"
          top="0px"
          testid={`description-sex-${character.sex?.index || GenderIndexes.other}`}
        />
        <IconText
          label="Age"
          value={character.age}
          Icon={AgeIcon}
          color="grey"
          top="45px"
          testid="description-age"
        />
        <IconText
          label="Size"
          value={character.size}
          Icon={HeightIcon}
          color="lightgrey"
          testid="description-size"
        />
        <IconText
          label="Alignment"
          value={character.alignment.abbreviation}
          Icon={AlignmentIcon}
          color="grey"
          testid="description-alignment"
        />
      </Box>

      <Box>
        <Typography data-testid="description-appearance">
          Appearance: {character.appearance}
        </Typography>
        <Typography data-testid="description-background">
          Background: {character.background.name}
        </Typography>
        <Typography data-testid="description-bonds">Bonds: {character.bonds}</Typography>
        <Typography data-testid="description-ideals">Ideals: {character.ideals}</Typography>
        <Typography data-testid="description-flaws">Flaws: {character.flaws}</Typography>
        <Typography data-testid="description-personality">
          Personality: {character.personality}
        </Typography>
      </Box>
    </Box>
  );
}
