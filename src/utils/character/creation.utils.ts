import { pickBy, uniqBy } from 'lodash';
import type { Feature } from '@representations/abilities/feature.representation';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { AbilityScore } from '@representations/campaign/adventure.representation';
import type { Equipment } from '@representations/campaign/equipment.representation';
import type { Classes } from '@representations/character/class.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character, CharacterFormData } from '@representations/user.representation';
import { getAbilityScoreModifier, getArmorClass } from './character.utils';

export type ChoiceSelection = DefaultRepresentation & {
  type: 'class' | 'race' | 'background';
  count?: number;
};

export type ChoiceObjectType = DefaultRepresentation & {
  type: number;
  count?: number;
  isMultiple?: boolean;
};

/**
 * Map data array to form selection format
 */
export const mapDataForForm = (
  array: (DefaultRepresentation & { count?: number })[],
  type: 'class' | 'race' | 'background'
): ChoiceSelection[] =>
  array.map(
    (data) =>
      (data.count
        ? {
            index: data.index,
            name: data.name,
            count: data.count,
            type
          }
        : { index: data.index, name: data.name, type }) as ChoiceSelection
  );

/**
 * Generic function to map items with their selected sub-options
 */
const mapItemsWithSubOptions = <T extends DefaultRepresentation & Record<string, any>>(
  items: T[],
  selections: [ChoiceObjectType[], ChoiceObjectType[]],
  config: {
    firstOptionFilter: (item: T) => boolean;
    firstOptionMatcher: (item: T, index: string) => boolean;
    firstOptionKey: string;
    secondOptionFilter: (item: T) => boolean;
    secondOptionMatcher: (item: T, index: string) => boolean;
    secondOptionKey: string;
  }
) =>
  items?.map(({ index, name }) => {
    const [firstSelections, secondSelections] = selections;
    let firstOptions: DefaultRepresentation[] = [];
    let secondOptions: DefaultRepresentation[] = [];

    const firstIndex =
      items
        ?.filter(config.firstOptionFilter)
        ?.findIndex((f) => config.firstOptionMatcher(f, index)) ?? -1;
    if (firstIndex > -1) {
      firstOptions = firstSelections
        .filter(({ type }) => type === firstIndex)
        .map(({ index, name }) => ({ index, name }));
    }

    const secondIndex =
      items
        ?.filter(config.secondOptionFilter)
        ?.findIndex((f) => config.secondOptionMatcher(f, index)) ?? -1;
    if (secondIndex > -1) {
      secondOptions = secondSelections
        .filter(({ type }) => type === secondIndex)
        .map(({ index, name }) => ({ index, name }));
    }

    const data = firstOptions.length
      ? { index, name, [config.firstOptionKey]: firstOptions }
      : { index, name };
    return secondOptions.length ? { ...data, [config.secondOptionKey]: secondOptions } : data;
  });

/**
 * Map class features with selected subfeatures and expertises
 */
export const mapFeatures = (
  classFeatures: Feature[],
  selectedFeatures: ChoiceObjectType[],
  selectedExpertises: ChoiceObjectType[]
): (DefaultRepresentation & {
  subfeatures?: DefaultRepresentation[];
  expertises?: DefaultRepresentation[];
})[] =>
  mapItemsWithSubOptions(classFeatures, [selectedFeatures, selectedExpertises], {
    firstOptionFilter: ({ feature_specific }) => Boolean(feature_specific?.subfeature_options),
    firstOptionMatcher: (f, index) => f.index.includes(index),
    firstOptionKey: 'subfeatures',
    secondOptionFilter: ({ feature_specific }) => Boolean(feature_specific?.expertise_options),
    secondOptionMatcher: (f, index) => f.index === index,
    secondOptionKey: 'expertises'
  });

/**
 * Map race traits with selected subtraits and spells
 */
export const mapTraits = (
  raceTraits: Trait[],
  selectedTraits: ChoiceObjectType[],
  selectedSpells: ChoiceObjectType[]
): (DefaultRepresentation & {
  subtraits?: DefaultRepresentation[];
  spells?: DefaultRepresentation[];
})[] =>
  mapItemsWithSubOptions(raceTraits, [selectedTraits, selectedSpells], {
    firstOptionFilter: ({ trait_specific }) => Boolean(trait_specific?.subtrait_options),
    firstOptionMatcher: (f, index) => f.index.includes(index),
    firstOptionKey: 'subtraits',
    secondOptionFilter: ({ trait_specific }) => Boolean(trait_specific?.spell_options),
    secondOptionMatcher: (f, index) => f.index === index,
    secondOptionKey: 'spells'
  });

export const transformFormData = (data: Partial<CharacterFormData>): Partial<Character> => {
  const skills = data.proficiencies?.filter((p) => p.index.startsWith('skill-'));
  const formattedProficiencies = data.proficiencies?.filter(
    (p) => !p.index.startsWith('saving-throw-') && !p.index.startsWith('skill-')
  );

  return pickBy(
    {
      ...data,
      class: data.class ? { index: data.class?.index, name: data.class?.name } : undefined,
      race: data.race ? { index: data.race?.index, name: data.race?.name } : undefined,
      languages: uniqBy(data.languages, 'index'),
      proficiencies: uniqBy(formattedProficiencies, 'index'),
      skills: uniqBy(skills, 'index'),
      equipments: data.equipments?.reduce((acc: ChoiceSelection[], curr) => {
        const existingIndex = acc.findIndex(({ index }) => index === curr.index);
        if (existingIndex >= 0) {
          return acc.with(existingIndex, {
            ...curr,
            count: (acc[existingIndex].count || 1) + (curr.count || 1)
          });
        }
        return [...acc, curr];
      }, []),
      bonds: data.bonds?.flatMap((bond) => bond.split('\n')),
      personality: data.personality?.flatMap((trait) => trait.split('\n')),
      ideals: data.ideals?.flatMap((ideal) => ideal.split('\n')),
      flaws: data.flaws?.flatMap((flaw) => flaw.split('\n')),
      level: 1
    },
    (d) => !!(Array.isArray(d) ? d?.length : d)
  );
};

export const formatPointsForDB = (
  character: Character,
  points: Record<string, number>,
  abilities?: AbilityScore[] | null,
  classInfo?: Classes | null,
  equipmentList?: (Equipment | MagicItem)[]
) => {
  let formattedAbilities: Record<
    string,
    {
      index: string;
      name: string;
      full_name: string;
      score: number;
      modifier: number;
    }
  > = {};
  abilities?.forEach((ability) => {
    const score = points[ability.index] || character.abilityScores?.[ability.index]?.score || 8;
    const raceModifier = character?.abilities.find(
      (bonusAbility) => bonusAbility.ability_score.index === ability.index
    );

    const finalScore = raceModifier ? score + raceModifier.bonus : score;
    formattedAbilities[ability.index] = {
      index: ability.index,
      name: ability.name,
      full_name: ability.full_name,
      score: finalScore,
      modifier: getAbilityScoreModifier(finalScore)
    };
  });

  const hitPoints =
    (classInfo?.hit_die || 6) +
    (formattedAbilities['con']?.modifier || 0) +
    (character?.features?.some(({ index }) => index === 'draconic-resilience') ? 1 : 0);

  return {
    hit_die: classInfo?.hit_die,
    hit_points: hitPoints,
    saving_throws: classInfo?.saving_throws,
    armorClass: getArmorClass(
      formattedAbilities['dex'].modifier,
      equipmentList,
      character?.features,
      character?.class.index === 'monk'
        ? formattedAbilities['wis']?.modifier || 0
        : formattedAbilities['con']?.modifier || 0
    ),
    abilityScores: formattedAbilities
  };
};
