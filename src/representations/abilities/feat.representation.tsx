import type { DefaultRepresentation } from '../common.representation';

type Prerequisite = {
  ability_score: DefaultRepresentation;
  minimum_score: number;
};

export type Feat = {
  index: string;
  name: string;
  prerequisites: Prerequisite[];
  desc: string[];
};
