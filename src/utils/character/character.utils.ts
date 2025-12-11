import type { MoneyUnitType } from '@representations/campaign/equipment.representation';
import type { DefaultRepresentation } from '@representations/common.representation';

/**
 * Calculate ability score modifier based on D&D 5e rules
 */
export const getAbilityScoreModifier = (score: number): number => {
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

/**
 * Calculate point buy cost for an ability score
 */
const getPointScoreCost = (score: number): number => {
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

/**
 * Calculate total point buy cost for all ability scores
 */
export const getAbilityPoints = (scores: Record<string, number>): number =>
  Object.values(scores).reduce((total, current) => total + getPointScoreCost(current), 0);

/**
 * Calculate armor class based on equipment, features, and modifiers
 */
export const getArmorClass = (
  dexModifier: number,
  equipment?: (DefaultRepresentation & { count?: number })[],
  features?: (DefaultRepresentation & {
    subfeatures?: DefaultRepresentation[];
    expertises?: DefaultRepresentation[];
  })[],
  additionnalModifier?: number
): number => {
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

/**
 * Consolidates a purse of mixed coins into the most efficient denomination breakdown.
 * Converts all coins to their copper value, then redistributes them using the fewest possible coins (prioritizing gold over silver over copper).
 */
const consolidateCoins = (purse: Partial<Record<MoneyUnitType, number>>) => {
  // TODO: Electrum Piece (EP)	1/2
  // TODO: Platinum Piece (PP)	10
  // Direct conversion using fixed rates (10 copper = 1 silver, 10 silver = 1 gold)
  const totalCopper = (purse.gp || 0) * 100 + (purse.sp || 0) * 10 + (purse.cp || 0);
  const round = totalCopper < 0 ? Math.ceil : Math.floor;

  const gp = round(totalCopper / 100) || 0;
  const sp = round((totalCopper % 100) / 10) || 0;
  const cp = totalCopper % 10 || 0;

  return { gp, sp: sp, cp: cp };
};

/**
 * Adds or removes money from a purse and returns the remaining consolidated coins.
 * Handles both positive (add) and negative (remove) amounts.
 * When removing money, it will automatically break down larger denominations if needed.
 * Can result in zero or negative total money.
 */
export const updatePurse = (
  purse: Record<MoneyUnitType, number> = { cp: 0, sp: 0, gp: 0 },
  amount: Partial<Record<MoneyUnitType, number>>
): Record<MoneyUnitType, number> => {
  const newTotalCopper = remainingMoneyInCopper(purse, amount);
  return consolidateCoins({ cp: newTotalCopper });
};

/**
 * Calculates the remaining money in copper after adding/removing a specified amount.
 */
export const remainingMoneyInCopper = (
  purse: Record<MoneyUnitType, number> = { cp: 0, sp: 0, gp: 0 },
  amount: Partial<Record<MoneyUnitType, number>>
): number => {
  const currentCopper = (purse.gp || 0) * 100 + (purse.sp || 0) * 10 + (purse.cp || 0);
  const amountCopper = (amount.gp || 0) * 100 + (amount.sp || 0) * 10 + (amount.cp || 0);

  return currentCopper + amountCopper;
};

export const getSellingPrice = (
  itemCost: Partial<Record<MoneyUnitType, number>>,
  itemType: 'equipment' | 'trade-goods' | 'gem' | 'art-object' | 'magic-item'
): Record<MoneyUnitType, number> => {
  const itemCostCopper = (itemCost.gp || 0) * 100 + (itemCost.sp || 0) * 10 + (itemCost.cp || 0);

  // TODO: update this with actual types and magic item rarity pricing
  // console.log('itemType', itemType);
  switch (itemType) {
    case 'trade-goods':
    case 'gem':
    case 'art-object':
    case 'magic-item':
      return consolidateCoins({ cp: itemCostCopper });
    case 'equipment':
    default:
      return consolidateCoins({ cp: Math.floor(itemCostCopper / 2) });
  }
};

/**
 * Sells an item and adds the proceeds to a purse based on D&D 5e selling rules:
 * - Equipment sells for half its original cost
 * - Trade goods and valuables (gems, art objects) retain full value
 * - Magic items sell based on rarity pricing
 */
export const sellItem = (
  purse: Record<MoneyUnitType, number> = { cp: 0, sp: 0, gp: 0 },
  itemCost: Partial<Record<MoneyUnitType, number>>,
  itemType: 'equipment' | 'trade-goods' | 'gem' | 'art-object' | 'magic-item'
): Record<MoneyUnitType, number> => {
  return updatePurse(purse, getSellingPrice(itemCost, itemType));
};

/**
 * Buys an item and deducts the cost from a purse based on D&D 5e buying rules.
 * Throws an error if there are insufficient funds.
 */
export const buyItem = (
  purse: Record<MoneyUnitType, number> = { cp: 0, sp: 0, gp: 0 },
  itemCost: Partial<Record<MoneyUnitType, number>>
): Record<MoneyUnitType, number> => {
  const itemCostCopper = -((itemCost.gp || 0) * 100 + (itemCost.sp || 0) * 10 + (itemCost.cp || 0));

  if (remainingMoneyInCopper(purse, { cp: itemCostCopper }) < 0)
    throw new Error('Insufficient funds');
  return updatePurse(purse, { cp: itemCostCopper });
};
