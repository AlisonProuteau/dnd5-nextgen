import type {
  ActionDamage,
  AreaOfEffect,
  DifficultyClass
} from '../campaign/adventure.representation';
import type { Choice, DefaultRepresentation } from '../common.representation';

export type Usage = {
  type: string;
  times: number;
};

export type Action = {
  index: string;
  name: string;
  desc: string;
  usage: Usage;
  dc: DifficultyClass;
  damage: ActionDamage[];
  area_of_effect: AreaOfEffect;
};

type TraitSpecific = {
  subtrait_options?: Choice;
  spell_options?: Choice;
  damage_type?: DefaultRepresentation;
  action?: Action;
};

export type Trait = {
  desc: string[];
  index: string;
  name: string;
  proficiencies?: DefaultRepresentation[];
  proficiency_choices?: Choice;
  language_options?: Choice;
  races?: DefaultRepresentation[];
  subraces?: DefaultRepresentation[];
  parent?: DefaultRepresentation;
  trait_specific?: TraitSpecific;
};
