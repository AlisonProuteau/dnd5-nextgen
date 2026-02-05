import { ArmorIcon, HitPointsIcon, ProficiencyIcon, SpeedIcon } from '@assets';
import { Box } from '@mui/system';
import { useQuery } from '@tanstack/react-query';
import { getAllAbilities } from '@api/ressources';
import { IconText } from '@shared/IconText';
import { Loader } from '@shared/Loader';
import type { AbilityScore } from '@representations/campaign/adventure.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { DefaultProps } from 'src/pages/Header';
import { useAuth } from 'src/providers/AuthProvider';
import { AbilityComponent } from './AbilityComponent';

export function Stats({ character }: DefaultProps) {
  const { version } = useAuth();

  const { data: abilities } = useQuery({
    queryKey: ['fetchAbilities', version],
    queryFn: async () => (version ? (await getAllAbilities(version)).results : null),
    enabled: !!version
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
    <Box data-testid="stats-section" display="flex" gap="15px" flexDirection="column">
      <Box
        data-testid="stats-section-header"
        display="grid"
        gridTemplateColumns="1fr 1fr 1fr 1fr"
        paddingTop="15px"
      >
        <IconText
          label="Armor"
          value={character.armorClass}
          Icon={ArmorIcon}
          color="grey"
          testid="armor-class"
        />
        <IconText
          label="Hit Points"
          value={character.hit_points}
          Icon={HitPointsIcon}
          color="grey"
          testid="hit-points"
        />
        <IconText
          label="Speed"
          value={character.speed}
          Icon={SpeedIcon}
          color="grey"
          testid="speed"
        />
        <IconText
          label="Proficiency Bonus"
          value={character.proficiencyBonus}
          Icon={ProficiencyIcon}
          color="grey"
          testid="proficiency-bonus"
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
        <Loader sx={{ minHeight: '50vh', alignContent: 'center' }} />
      )}
    </Box>
  );
}
