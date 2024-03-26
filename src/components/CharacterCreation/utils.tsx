import type { DefaultRepresentation } from '../../representations/common.representation';
import type { ChoiceSelection } from './CharacterCreation';

export const mapDataForForm = (array: (DefaultRepresentation & { count?: number })[]) =>
  array.map(
    (data) =>
      (data.count
        ? {
            index: data.index,
            name: data.name,
            count: data.count,
            type: 'class'
          }
        : { index: data.index, name: data.name, type: 'class' }) as ChoiceSelection
  );
