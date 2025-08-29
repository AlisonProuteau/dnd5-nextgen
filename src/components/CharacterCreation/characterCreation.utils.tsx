import type { Feature } from '@representations/abilities/feature.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { DefaultRepresentation } from '@representations/common.representation';

export const scrollOnOpen = (
  { currentTarget }: { currentTarget: EventTarget & Element },
  expanded: boolean
) => {
  expanded && setTimeout(() => currentTarget.scrollIntoView({ behavior: 'smooth' }), 100);
};

export type ChoiceSelection = DefaultRepresentation & {
  type: 'class' | 'race' | 'background';
  count?: number;
};

export const mapDataForForm = (
  array: (DefaultRepresentation & { count?: number })[],
  type: 'class' | 'race' | 'background'
) =>
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

export const mapFeatures = (
  classFeatures: Feature[],
  selectedFeatures: ChoiceObjectType[],
  selectedExpertises: ChoiceObjectType[]
) =>
  classFeatures?.map(({ index, name }) => {
    let subfeatures: DefaultRepresentation[] = [];
    let expertises: DefaultRepresentation[] = [];

    const subFeatureIndex =
      classFeatures
        ?.filter(({ feature_specific }) => feature_specific?.subfeature_options)
        ?.findIndex((f) => f.index.includes(index)) ?? -1;
    if (subFeatureIndex > -1)
      subfeatures = selectedFeatures
        .filter(({ type }) => type === subFeatureIndex)
        .map(({ index, name }) => ({ index, name }));

    const expertisesIndex =
      classFeatures
        ?.filter(({ feature_specific }) => feature_specific?.expertise_options)
        ?.findIndex((f) => f.index === index) ?? -1;
    if (expertisesIndex > -1)
      expertises = selectedExpertises
        .filter(({ type }) => type === expertisesIndex)
        .map(({ index, name }) => ({ index, name }));

    const data = subfeatures.length ? { index, name, subfeatures } : { index, name };
    return expertises.length ? { ...data, expertises } : data;
  });

export const mapTraits = (
  raceTraits: Trait[],
  selectedTraits: ChoiceObjectType[],
  selectedSpells: ChoiceObjectType[]
) =>
  raceTraits?.map(({ index, name }) => {
    let subtraits: DefaultRepresentation[] = [];
    let spells: DefaultRepresentation[] = [];

    const subTraitIndex =
      raceTraits
        ?.filter(({ trait_specific }) => trait_specific?.subtrait_options)
        ?.findIndex((f) => f.index.includes(index)) ?? -1;
    if (subTraitIndex > -1)
      subtraits = selectedTraits
        .filter(({ type }) => type === subTraitIndex)
        .map(({ index, name }) => ({ index, name }));

    const spellIndex =
      raceTraits
        ?.filter(({ trait_specific }) => trait_specific?.spell_options)
        ?.findIndex((f) => f.index === index) ?? -1;
    if (spellIndex > -1)
      spells = selectedSpells
        .filter(({ type }) => type === spellIndex)
        .map(({ index, name }) => ({ index, name }));

    const data = subtraits.length ? { index, name, subtraits } : { index, name };
    return spells.length ? { ...data, spells } : data;
  });

export type ChoiceObjectType = DefaultRepresentation & {
  type: number;
  count?: number;
  isMultiple?: boolean;
};
