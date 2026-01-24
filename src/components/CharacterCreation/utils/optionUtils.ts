import { uniqBy } from 'lodash';
import type {
  AbilityBonusOption,
  CountedReferenceOption,
  DefaultRepresentation,
  IdealOption,
  Option,
  ReferenceOption,
  StringOption
} from '@representations/common.representation';

type CheckboxOption =
  | ReferenceOption
  | StringOption
  | IdealOption
  | CountedReferenceOption
  | AbilityBonusOption;

/**
 * Type guard to check if option is a simple checkbox type
 */
export function isCheckboxOption(option: Option): option is CheckboxOption {
  return (
    option.option_type === 'reference' ||
    option.option_type === 'string' ||
    option.option_type === 'ideal' ||
    option.option_type === 'counted_reference' ||
    option.option_type === 'ability_bonus'
  );
}

/**
 * Formats an option into a standardized structure for rendering
 */
export function formatOption(
  option: CheckboxOption,
  type?: string,
  index?: number
): {
  item: DefaultRepresentation & { count?: number };
  label: string;
  labelData?: { alignments: string; desc: string };
  prerequisites: boolean;
} {
  const formattedItem: DefaultRepresentation & { count?: number } = {
    index:
      option.item?.index ||
      option.of?.index ||
      option.ability_score?.index ||
      (option.string && `${option.string}-${type}`) ||
      `${type}-${index}`,
    name:
      option.item?.name ||
      option.string ||
      option.desc ||
      option.of?.name ||
      option.ability_score?.name ||
      `${type}-${index}`,
    count: option.count
  };

  let label: string =
    option.item?.name ||
    option.ability_score?.name ||
    option.string ||
    (option.of && `${option.count} ${option.of.name}`) ||
    '';

  // Data for special formatting (ideals with alignments)
  let labelData =
    'alignments' in option && option.alignments
      ? {
          alignments: option.alignments.map(({ name }) => name).join(' / '),
          desc: option.desc || ''
        }
      : undefined;

  const prerequisites =
    'prerequisites' in option && option.prerequisites
      ? option.prerequisites.every(({ proficiency }) => !proficiency || true)
      : true;

  return { item: formattedItem, label, labelData, prerequisites };
}

/**
 * Validates if option meets proficiency requirements
 */
export function hasRequiredProficiencies(
  option: CheckboxOption,
  proficiencies: DefaultRepresentation[]
): boolean {
  if (!('prerequisites' in option) || !option.prerequisites) return true;

  return option.prerequisites.every(({ proficiency }) =>
    proficiency ? proficiencies.some((p) => p.index === proficiency.index) : true
  );
}

/**
 * Combines current item with bundle siblings, filtering out the current item to avoid duplicates
 */
export const getBundleItems = (
  itemToSelect: (DefaultRepresentation | AbilityBonusOption) & {
    count?: number;
  },
  bundleSiblings: ((AbilityBonusOption | DefaultRepresentation) & {
    count?: number;
  })[]
) =>
  uniqBy([itemToSelect, ...bundleSiblings], (el) =>
    'index' in el
      ? `${el.index}-${el.count || 0}`
      : 'ability_score' in el
        ? `${el.ability_score.index}-${el.count || 0}`
        : ''
  );
