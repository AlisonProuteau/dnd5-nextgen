import type { Choice, DefaultRepresentation, Usage } from '../common.representation';

type Prerequisite = LevelPrerequisite | FeaturePrerequisite | SpellPrerequisite;
type LevelPrerequisite = {
  type: string;
  level: number;
};
type FeaturePrerequisite = {
  type: string;
  feature: string;
};
type SpellPrerequisite = {
  type: string;
  spell: string;
};
type FeatureSpecific = {
  subfeature_options?: Choice;
  expertise_options?: Choice;
  invocations?: DefaultRepresentation[];
};

export type Feature = {
  class: DefaultRepresentation;
  desc: string[];
  usage?: Usage;
  parent?: DefaultRepresentation;
  index: string;
  level: number;
  name: string;
  prerequisites?: Prerequisite[];
  reference?: string;
  subclass?: DefaultRepresentation;
  feature_specific?: FeatureSpecific;
  onRest?: 'short_rest' | 'long_rest';
};
