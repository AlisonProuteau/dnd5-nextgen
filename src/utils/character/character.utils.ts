import { omit } from 'lodash';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type {
  AdditionalMoneyUnitType,
  Equipment,
  MoneyObjectType
} from '@representations/campaign/equipment.representation';
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
  equipment?: ((Equipment | MagicItem) & { equipped?: boolean })[],
  features?: (DefaultRepresentation & {
    subfeatures?: DefaultRepresentation[];
    expertises?: DefaultRepresentation[];
  })[],
  additionnalModifier?: number
): number => {
  let ac = 10 + dexModifier;
  const filteredEquipment = equipment
    ?.filter(({ equipped }) => equipped ?? true)
    ?.map((e) => ({
      index: e.index,
      armor_class: 'armor_class' in e ? e.armor_class : undefined,
      equipped: e.equipped
    }));

  if (filteredEquipment?.length && filteredEquipment.some((e) => e.armor_class)) {
    filteredEquipment.forEach((e) => {
      if (e.index.includes('shield')) return;
      let newAC = 0;

      if (e.armor_class) {
        const dexBonusAmount = e.armor_class.dex_bonus
          ? dexModifier > (e.armor_class.max_bonus || dexModifier)
            ? e.armor_class.max_bonus || dexModifier
            : dexModifier
          : 0;
        newAC = e.armor_class.base + dexBonusAmount;
      }
      if (newAC > ac) ac = newAC;
    });

    const shield = filteredEquipment.find((e) => e.index.includes('shield'));
    if (shield) ac = ac + (shield.armor_class?.base ?? 2);
  } else {
    const featureIndexes = features?.flatMap((f) => [
      f.index,
      ...(f.subfeatures?.map(({ index }) => index) || [])
    ]);

    if (featureIndexes?.some((index) => index.includes('unarmored-defense')))
      ac = ac + (additionnalModifier || 0);
    else if (featureIndexes?.some((index) => index.includes('draconic-resilience')))
      ac = 13 + dexModifier;
  }

  return ac;
};

/**
 * Consolidates a purse of mixed coins into the most efficient denomination breakdown.
 * Converts all coins to their copper value, then redistributes them using the fewest possible coins.
 * By default only returns standard currencies (gp, sp, cp). Include 'pp' or 'ep' in additionalCurrencies to use those denominations.
 */
const consolidateCoins = (
  purse: MoneyObjectType,
  additionalCurrencies: AdditionalMoneyUnitType[] = []
) => {
  // Conversion rates: 1 PP = 1000 CP, 1 GP = 100 CP, 1 EP = 50 CP, 1 SP = 10 CP, 1 CP = 1 CP
  const totalCopper =
    (purse.pp || 0) * 1000 +
    (purse.gp || 0) * 100 +
    (purse.ep || 0) * 50 +
    (purse.sp || 0) * 10 +
    (purse.cp || 0);
  const round = totalCopper < 0 ? Math.ceil : Math.floor;

  const usePP = additionalCurrencies.includes('pp');
  const useEP = additionalCurrencies.includes('ep');

  let remaining = totalCopper;
  let result: MoneyObjectType = {};

  if (usePP) {
    result.pp = round(remaining / 1000) || 0;
    remaining = remaining % 1000;
  }

  result.gp = round(remaining / 100) || 0;
  remaining = remaining % 100;

  if (useEP) {
    result.ep = round(remaining / 50) || 0;
    remaining = remaining % 50;
  }

  result.sp = round(remaining / 10) || 0;
  result.cp = remaining % 10 || 0;

  if (!usePP) result = omit(result, 'pp');
  if (!useEP) result = omit(result, 'ep');

  return result;
};

/**
 * Adds or removes money from a purse and returns the remaining consolidated coins.
 * Handles both positive (add) and negative (remove) amounts.
 * When removing money, it will automatically break down larger denominations if needed.
 * Can result in zero or negative total money.
 * Only includes additional currencies (pp, ep) if they are specified in additionalCurrencies array.
 */
export const updatePurse = (
  purse: MoneyObjectType = { cp: 0, sp: 0, gp: 0 },
  amount: MoneyObjectType,
  additionalCurrencies: AdditionalMoneyUnitType[] = []
): MoneyObjectType => {
  const newTotalCopper = remainingMoneyInCopper(purse, amount);
  return consolidateCoins({ cp: newTotalCopper }, additionalCurrencies);
};

/**
 * Calculates the remaining money in copper after adding/removing a specified amount.
 */
export const remainingMoneyInCopper = (
  purse: MoneyObjectType = { cp: 0, sp: 0, gp: 0 },
  amount: MoneyObjectType
): number => {
  const currentCopper =
    (purse.pp || 0) * 1000 +
    (purse.gp || 0) * 100 +
    (purse.ep || 0) * 50 +
    (purse.sp || 0) * 10 +
    (purse.cp || 0);
  const amountCopper =
    (amount.pp || 0) * 1000 +
    (amount.gp || 0) * 100 +
    (amount.ep || 0) * 50 +
    (amount.sp || 0) * 10 +
    (amount.cp || 0);

  return currentCopper + amountCopper;
};

export enum EquipmentCategoryType {
  Equipment = 'equipment',
  TradeGoods = 'trade-goods',
  Gem = 'gem',
  ArtObject = 'art-object',
  MagicItems = 'magic-items'
}

export const getSellingPrice = (
  itemCost: MoneyObjectType,
  equipmentCategoryType: EquipmentCategoryType,
  additionalCurrencies: AdditionalMoneyUnitType[] = [],
  sellAtFullPrice: boolean = false
): MoneyObjectType => {
  const itemCostCopper =
    (itemCost.pp || 0) * 1000 +
    (itemCost.gp || 0) * 100 +
    (itemCost.ep || 0) * 50 +
    (itemCost.sp || 0) * 10 +
    (itemCost.cp || 0);

  if (sellAtFullPrice) return consolidateCoins({ cp: itemCostCopper }, additionalCurrencies);

  // TODO: Currenly only have MagicItems, could add other categories later
  switch (equipmentCategoryType) {
    case EquipmentCategoryType.TradeGoods:
    case EquipmentCategoryType.Gem:
    case EquipmentCategoryType.ArtObject:
    case EquipmentCategoryType.MagicItems:
      return consolidateCoins({ cp: itemCostCopper }, additionalCurrencies);
    case EquipmentCategoryType.Equipment:
    default:
      return consolidateCoins({ cp: Math.floor(itemCostCopper / 2) }, additionalCurrencies);
  }
};

/**
 * Sells an item and adds the proceeds to a purse based on D&D 5e selling rules:
 * - Equipment sells for half its original cost
 * - Trade goods and valuables (gems, art objects) retain full value
 * - Magic items sell based on rarity pricing
 */
export const sellItem = (
  purse: MoneyObjectType = { cp: 0, sp: 0, gp: 0 },
  itemCost: MoneyObjectType,
  equipmentCategoryType: EquipmentCategoryType,
  additionalCurrencies: AdditionalMoneyUnitType[] = [],
  sellAtFullPrice: boolean = false
): MoneyObjectType => {
  return updatePurse(
    purse,
    getSellingPrice(itemCost, equipmentCategoryType, additionalCurrencies, sellAtFullPrice),
    additionalCurrencies
  );
};

/**
 * Buys an item and deducts the cost from a purse based on D&D 5e buying rules.
 * Throws an error if there are insufficient funds.
 */
export const buyItem = (
  purse: MoneyObjectType = { cp: 0, sp: 0, gp: 0 },
  itemCost: MoneyObjectType,
  additionalCurrencies: AdditionalMoneyUnitType[] = []
): MoneyObjectType => {
  const itemCostCopper = -(
    (itemCost.pp || 0) * 1000 +
    (itemCost.gp || 0) * 100 +
    (itemCost.ep || 0) * 50 +
    (itemCost.sp || 0) * 10 +
    (itemCost.cp || 0)
  );

  if (remainingMoneyInCopper(purse, { cp: itemCostCopper }) < 0)
    throw new Error('Insufficient funds');
  return updatePurse(purse, { cp: itemCostCopper }, additionalCurrencies);
};

export const hasRequiredStrength = (characterStr: number, equipment: Equipment | MagicItem) => {
  return 'str_minimum' in equipment && equipment.str_minimum
    ? characterStr >= equipment.str_minimum
    : true;
};
