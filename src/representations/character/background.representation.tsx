import type { Choice, DefaultRepresentation } from '../common.representation';

type Equipment = {
  equipment: DefaultRepresentation;
  quantity: number;
};

type Feature = {
  name: string;
  desc: string[];
};

export type Background = {
  index: string;
  name: string;
  starting_proficiencies: DefaultRepresentation[];
  language_options: Choice;

  starting_equipment: Equipment[];
  starting_equipment_options: Choice[];
  feature: Feature;
  personality_traits: Choice;
  ideals: Choice;
  bonds: Choice;
  flaws: Choice;
};

export type Language = {
  desc?: string;
  index: string;
  name: string;
  script?: string;
  type: string;
  typical_speakers: string[];
};

export type Alignment = {
  desc: string;
  abbreviation: string;
  index: string;
  name: string;
};
