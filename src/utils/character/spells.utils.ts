import { max, uniq } from 'lodash';
import type { ActionDamage } from '@representations/campaign/adventure.representation';
import type { DefaultRepresentation } from '@representations/common.representation';

/**
 * Filter prepared spells to only include valid ones (still in known spells list)
 * Cantrips (level 0) are always valid, higher level spells must be in knownSpells
 */
export const filterValidPreparedSpells = (
  preparedSpells: (DefaultRepresentation & { level: number })[],
  knownSpells: (DefaultRepresentation & { level: number })[]
): (DefaultRepresentation & { level: number })[] => {
  return preparedSpells.filter((spell) =>
    spell.level > 0
      ? knownSpells.some(({ index, level }) => index === spell.index && level === spell.level)
      : true
  );
};

/**
 * Get min-max values for spell slots based on level
 */
export const getSlotMinMax = (
  slots?: Record<number, string>,
  levels: number[] = []
): string | undefined => {
  if (!slots) return undefined;

  let latestValue: string | undefined = undefined;
  const allLevelSize = max(levels) ?? parseInt(max(Object.keys(slots)) ?? '') ?? 0;
  const allLevels: Record<number, string> = Array.from(
    { length: allLevelSize },
    (_, i) => i + 1
  ).reduce((acc, level) => {
    if (slots[level]) {
      latestValue = slots[level];
      return { ...acc, [level]: slots[level] };
    } else return { ...acc, [level]: latestValue };
  }, {});

  const formattedLevels = levels.filter((l) => l > 0);
  if (formattedLevels.length === 1) return allLevels[formattedLevels[0]];

  const slotValuesSortedByLevel = uniq(
    formattedLevels.length
      ? formattedLevels
          .sort()
          .map((level) => allLevels[level])
          .filter((level) => !!level)
      : Object.entries(slots)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .flatMap((val) => val[1])
  );
  if (!slotValuesSortedByLevel.length) return undefined;

  return slotValuesSortedByLevel.length > 1
    ? `${slotValuesSortedByLevel.at(0)} -> ${slotValuesSortedByLevel.at(-1)}`
    : slotValuesSortedByLevel.at(0);
};

/**
 * Get damage min-max values for spells and abilities
 */
export const getDamageMinMax = (
  damage: ActionDamage,
  charLevel?: number,
  slotLevels?: number[]
): string | undefined => {
  if (slotLevels?.length)
    return getSlotMinMax(
      damage.damage_at_slot_level || damage.damage_at_character_level,
      slotLevels
    );
  if (charLevel) return getSlotMinMax(damage.damage_at_character_level, [charLevel]);
  else return getSlotMinMax(damage.damage_at_slot_level || damage.damage_at_character_level);
};
