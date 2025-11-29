import type { DefaultRepresentation } from '../common.representation';

export type DamageType = {
  desc: string[];
  index: string;
  name: string;
};

export type Condition = {
  desc: string[];
  index: string;
  name: string;
};

export type Skill = {
  ability_score: DefaultRepresentation;
  desc: string[];
  index: string;
  name: string;
};

export type DifficultyClass = {
  dc_type: DefaultRepresentation;
  dc_value?: number;
  success_type: 'none' | 'half' | 'other';
};

export type Damage = {
  damage_type: DefaultRepresentation;
  damage_dice: string;
};

export interface ActionDamage {
  damage_at_slot_level?: Record<number, string>;
  damage_at_character_level?: Record<number, string>;
  damage_type?: DefaultRepresentation;
}

export type AbilityScore = {
  desc: string[];
  full_name: string;
  index: string;
  name: string;
  skills: DefaultRepresentation[] | [];
};

export interface AreaOfEffect {
  size: number;
  type: 'sphere' | 'cube' | 'cylinder' | 'line' | 'cone';
}

type Reference = {
  index: string;
  name: string;
  type: string;
};
export type Proficiency = {
  classes?: DefaultRepresentation[];
  index: string;
  name: string;
  races?: DefaultRepresentation[];
  reference: Reference;
  type: string;
};
