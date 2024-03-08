import type { Choice, DefaultRepresentation } from '../common.representation';

type RaceAbilityBonus = {
  ability_score: DefaultRepresentation;
  bonus: number;
};

export type Race = {
  ability_bonus_options?: Choice;
  ability_bonuses: RaceAbilityBonus[];
  age: string;
  alignment: string;
  index: string;
  language_desc: string;
  language_options: Choice;
  languages: DefaultRepresentation[];
  name: string;
  size: string;
  size_description: string;
  speed: number;
  starting_proficiencies?: DefaultRepresentation[];
  starting_proficiency_options?: Choice;
  subraces?: DefaultRepresentation[];
  traits?: DefaultRepresentation[];
};

type AbilityBonus = {
  ability_score: DefaultRepresentation;
  bonus: number;
};

export type Subrace = {
  race: DefaultRepresentation;
  index: string;
  name: string;
  desc: string;
  speed?: number;
  ability_bonuses: AbilityBonus[];
  language_options?: Choice;
  racial_traits: DefaultRepresentation[];
  starting_proficiencies?: DefaultRepresentation[];
};
