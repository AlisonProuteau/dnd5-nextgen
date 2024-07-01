import { getAllAbilities } from '@api/ressources';
import { ArmorIcon, HitPointsIcon, ProficiencyIcon, SpeedIcon } from '@assets';
import { CircularProgress } from '@mui/material';
import { Box } from '@mui/system';
import type { AbilityScore } from '@representations/campaign/adventure.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { IconText } from '@shared/IconText';
import { useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { AbilityComponent } from './AbilityComponent';

export function Stats({ character }: { character: Character }) {
  const { data: abilities } = useQuery({
    queryKey: ['fetchAbilities'],
    queryFn: async () => (await getAllAbilities()).results
  });

  const abilitySorter = (
    a: AbilityScore,
    b: AbilityScore,
    abilityScores: Record<string, { score: number }>,
    savingThrows?: DefaultRepresentation[]
  ) => {
    return (
      (b.index === 'con' ? -1 : 0) ||
      (a.index === 'con' ? 1 : 0) ||
      abilityScores[b.index].score - abilityScores[a.index].score ||
      (savingThrows?.find(({ index }) => index === b.index) ? 1 : 0) -
        (savingThrows?.find(({ index }) => index === a.index) ? 1 : 0) ||
      b.skills.length - a.skills.length
    );
  };

  return (
    <Fragment>
      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr 1fr" paddingTop="15px">
        <IconText label="Armor" value={character.armorClass} Icon={ArmorIcon} color="grey" />
        <IconText
          label="Hit Points"
          value={character.hit_points}
          Icon={HitPointsIcon}
          color="grey"
        />
        <IconText label="Speed" value={character.speed} Icon={SpeedIcon} color="grey" />
        <IconText
          label="Proficiency Bonus"
          value={character.proficiencyBonus}
          Icon={ProficiencyIcon}
          color="grey"
        />
      </Box>

      {abilities?.length ? (
        <Box display="grid" rowGap="10px" justifyContent="center">
          {abilities
            .sort((a, b) => abilitySorter(a, b, character.abilityScores, character.saving_throws))
            .map((ability) => (
              <AbilityComponent
                key={ability.index}
                ability={ability}
                skills={character.skills}
                score={character.abilityScores[ability.index].score}
                modifier={character.abilityScores[ability.index].modifier}
                savingThrows={character.saving_throws?.map(({ name, index }) => {
                  const fullName = abilities.find((ability) => ability.index === index)?.full_name;
                  return { index, name: fullName || name };
                })}
              />
            ))}
        </Box>
      ) : (
        <CircularProgress size={24} />
      )}
    </Fragment>
  );
}
