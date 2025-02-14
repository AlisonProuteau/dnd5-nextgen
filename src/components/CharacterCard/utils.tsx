import type { ActionDamage } from '@representations/campaign/adventure.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { max, uniq } from 'lodash';

export const randomInteger = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const getAbilityScoreModifier = (score: number) => {
  if (score === 1) return -5;
  else if (score <= 3) return -4;
  else if (score <= 5) return -3;
  else if (score <= 7) return -2;
  else if (score <= 9) return -1;
  else if (score <= 11) return 0;
  else if (score <= 13) return 1;
  else if (score <= 15) return 2;
  else if (score <= 17) return 3;
  else if (score <= 19) return 4;
  else if (score <= 21) return 5;
  else if (score <= 23) return 6;
  else if (score <= 25) return 7;
  else if (score <= 27) return 8;
  else if (score <= 29) return 9;
  else if (score === 30) return 10;

  return 0;
};

const getPointScoreCost = (score: number) => {
  switch (score) {
    case 9:
      return 1;
    case 10:
      return 2;
    case 11:
      return 3;
    case 12:
      return 4;
    case 13:
      return 5;
    case 14:
      return 7;
    case 15:
      return 9;
    default:
      return 0;
  }
};

export const getAbilityPoints = (scores: Record<string, number>) =>
  Object.values(scores).reduce((total, current) => total + getPointScoreCost(current), 0);

export const getArmorClass = (
  dexModifier: number,
  equipment?: (DefaultRepresentation & { count?: number })[],
  features?: (DefaultRepresentation & {
    subfeatures?: DefaultRepresentation[];
    expertises?: DefaultRepresentation[];
  })[],
  additionnalModifier?: number
) => {
  let ac = 10 + dexModifier;

  if (equipment?.length) {
    const mappedEquipment = equipment.map((e) => e.index);
    const reducedModifier = dexModifier > 2 ? 2 : dexModifier;

    if (mappedEquipment.includes('plate-armor')) ac = 18;
    else if (mappedEquipment.includes('splint-armor')) ac = 17;
    else if (mappedEquipment.includes('chain-mail')) ac = 16;
    else if (mappedEquipment.includes('ring-mail')) ac = 14;
    else if (mappedEquipment.includes('half-plate-armor')) ac = 15 + reducedModifier;
    else if (mappedEquipment.includes('scale-mail') || mappedEquipment.includes('breastplate'))
      ac = 14 + reducedModifier;
    else if (mappedEquipment.includes('chain-shirt')) ac = 13 + reducedModifier;
    else if (
      mappedEquipment.includes('studded-leather-armor') ||
      mappedEquipment.includes('hide-armor')
    )
      ac = 12 + dexModifier;
    else if (mappedEquipment.includes('padded-armor') || mappedEquipment.includes('leather-armor'))
      ac = 11 + dexModifier;
    else if (
      features
        ?.flatMap((f) => [f.index, ...(f.subfeatures?.map(({ index }) => index) || [])])
        ?.some((index) => index.includes('unarmored-defense'))
    )
      ac = ac + (additionnalModifier || 0);
    else if (
      features
        ?.flatMap((f) => [f.index, ...(f.subfeatures?.map(({ index }) => index) || [])])
        ?.some((index) => index.includes('draconic-resilience'))
    )
      ac = 13 + dexModifier;

    if (mappedEquipment.includes('shield')) ac = ac + 2;
  }

  return ac;
};

export const getSlotMinMax = (slots?: Record<number, string>, levels: number[] = []) => {
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

export const getDamageMinMax = (
  damage: ActionDamage,
  charLevel?: number,
  slotLevels?: number[]
) => {
  if (slotLevels?.length)
    return getSlotMinMax(
      damage.damage_at_slot_level || damage.damage_at_character_level,
      slotLevels
    );
  if (charLevel) return getSlotMinMax(damage.damage_at_character_level, [charLevel]);
  else return getSlotMinMax(damage.damage_at_slot_level || damage.damage_at_character_level);
};
