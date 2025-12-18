import type { DefaultRepresentation } from '../common.representation';
import type { Damage } from './adventure.representation';

type ArmorClass = {
  base: number;
  dex_bonus: boolean;
  max_bonus?: number;
};

type Content = {
  item: DefaultRepresentation;
  quantity: number;
};

export const StandardMoneyUnits = ['gp', 'sp', 'cp'] as const;
export const AdditionalMoneyUnits = ['pp', 'ep'] as const;
export const MoneyUnits = ['pp', 'gp', 'ep', 'sp', 'cp'] as const;
export type StandardMoneyUnitType = (typeof StandardMoneyUnits)[number];
export type AdditionalMoneyUnitType = (typeof AdditionalMoneyUnits)[number];
export type MoneyUnitType = StandardMoneyUnitType | AdditionalMoneyUnitType;
export type MoneyObjectType = Partial<Record<MoneyUnitType, number>>;
type Cost = {
  quantity: number;
  unit: MoneyUnitType;
};

type Range = {
  long?: number;
  normal: number;
};

type Speed = {
  quantity: number;
  unit: string;
};

type ThrowRange = {
  long: number;
  normal: number;
};

type TwoHandedDamage = {
  damage_dice: string;
  damage_type: DefaultRepresentation;
};

export type Equipment = {
  index: string;
  name: string;
  desc: string[];
  cost: Cost;
  equipment_category: DefaultRepresentation;
  armor_category?: string;
  armor_class?: ArmorClass;
  capacity?: number;
  category_range?: string;
  contents?: Content[];
  damage?: Damage;
  gear_category?: DefaultRepresentation;
  properties?: DefaultRepresentation[];
  quantity?: number;
  range?: Range;
  special?: string[];
  speed?: Speed;
  stealth_disadvantage?: boolean;
  str_minimum?: number;
  throw_range?: ThrowRange;
  tool_category?: string;
  two_handed_damage?: TwoHandedDamage;
  vehicle_category?: string;
  weapon_category?: string;
  weapon_range?: string;
  weight?: number;
};

export type WeaponProperty = {
  desc: string[];
  index: string;
  name: string;
};

export type EquipmentCategory = {
  equipment: DefaultRepresentation[];
  index: string;
  name: string;
};
