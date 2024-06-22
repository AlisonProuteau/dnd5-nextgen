import type { Feature } from '../../representations/abilities/feature.representation';
import type { DefaultRepresentation } from '../../representations/common.representation';

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

export type ChoiceObjectType = DefaultRepresentation & {
  type: number;
  count?: number;
  isMultiple?: boolean;
};
