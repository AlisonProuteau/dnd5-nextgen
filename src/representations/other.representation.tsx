import type { DefaultRepresentation } from './common.representation';

export type RuleSection = {
  desc: string;
  index: string;
  name: string;
};

export type Rule = {
  desc: string;
  index: string;
  name: string;
  subsections: DefaultRepresentation[];
};
