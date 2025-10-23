import type { Feature } from '@representations/abilities/feature.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { DefaultRepresentation } from '@representations/common.representation';

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
