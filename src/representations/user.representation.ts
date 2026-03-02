import type { ChoiceSelection } from '@utils/character/creation.utils';
import type { Version } from '@utils/constants/versions.constants';
import type { AdditionalMoneyUnitType, MoneyObjectType } from './campaign/equipment.representation';
import type { Alignment } from './character/background.representation';
import type { RaceAbilityBonus } from './character/race.representation';
import type { DefaultRepresentation, Sizes, UsageTypes } from './common.representation';

export interface CharacterFormData {
  name: string;
  age: number;
  sex: DefaultRepresentation;
  appearance?: string;
  background: DefaultRepresentation;
  alignment: Alignment;
  personality?: string[];
  ideals?: string[];
  bonds?: string[];
  flaws?: string[];
  race: DefaultRepresentation;
  subrace?: DefaultRepresentation;
  speed: number;
  size?: Sizes;
  size_description?: string;
  traits?: (DefaultRepresentation & {
    subtraits?: DefaultRepresentation[];
    spells?: DefaultRepresentation[];
  })[];
  class: DefaultRepresentation;
  subclass?: DefaultRepresentation;
  proficiencies: ChoiceSelection[];
  skills?: ChoiceSelection[];
  equipments: (ChoiceSelection & { equipped?: boolean })[];
  languages: ChoiceSelection[];
  abilities: RaceAbilityBonus[];
  features?: (DefaultRepresentation & {
    subfeatures?: DefaultRepresentation[];
    expertises?: DefaultRepresentation[];
  })[];
  proficiencyBonus: number;
}

export type AbilityScoreMethod = 'set' | 'random' | 'point_cost';
export type Character = CharacterFormData & {
  id: string;
  hit_die: number;
  hit_points: number;
  saving_throws?: DefaultRepresentation[];
  armorClass: number;
  abilityScores: Record<
    string,
    {
      index: string;
      name: string;
      full_name: string;
      score: number;
      modifier: number;
    }
  >;
  abilityScoreMethod: AbilityScoreMethod;
  level: number;
  knownSpells?: (DefaultRepresentation & { level: number; ritual?: boolean; added?: boolean })[];
  preparedSpells?: (DefaultRepresentation & { level: number })[];
  usedSpellSlots?: Record<string, number>;
  version: Version;
  money?: MoneyObjectType;
  health?: {
    current: number;
    temporary?: number;
    deathSaves?: {
      successes: number;
      failures: number;
    };
  };
  resourceUsages?: {
    [resourceName: string]: {
      type: 'feature' | 'spell' | 'trait' | 'other';
      usage: UsageTypes | UsageTypes[];
      current: number;
    };
  };
};

export interface CharacterNote {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  pinned?: boolean;
  archived?: boolean;
}

export type UserData = {
  identifier: string;
  admin?: boolean;
  version?: Version;
  additionalCurrencies?: AdditionalMoneyUnitType[];
};
