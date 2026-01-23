import type { Choice, DefaultRepresentation } from '../common.representation';

type Equipment = {
  equipment: DefaultRepresentation;
  quantity: number;
};

type SpellcastingInfo = {
  desc: string[];
  name: string;
};

type Spellcasting = {
  info: SpellcastingInfo[];
  level: number;
  spellcasting_ability: DefaultRepresentation;
  prepare?: boolean;
};

type MultiClassingPrereq = {
  ability_score: DefaultRepresentation;
  minimum_score: number;
};

type MultiClassing = {
  prerequisites?: MultiClassingPrereq[];
  prerequisite_options?: Choice;
  proficiencies?: DefaultRepresentation[];
  proficiency_choices?: Choice[];
};

export type Classes = {
  multi_classing: MultiClassing;
  hit_die: number;
  index: string;
  name: string;
  proficiencies: DefaultRepresentation[];
  proficiency_choices: Choice[];
  saving_throws: DefaultRepresentation[];
  spellcasting?: Spellcasting;
  starting_equipment?: Equipment[];
  starting_equipment_options: Choice[];
  subclasses: DefaultRepresentation[];
};

type SpellPrerequisite = {
  index: string;
  name: string;
  type: 'level' | 'feature';
};

type Spell = {
  index: string;
  name: string;
  prerequisites: SpellPrerequisite[];
};

export type Subclass = {
  desc: string[];
  index: string;
  name: string;
  spells?: Spell[];
  subclass_flavor: string;
};
