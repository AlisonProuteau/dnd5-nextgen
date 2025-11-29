import type { DefaultRepresentation } from './common.representation';

export interface GuideType {
  index: string;
  name: string;
  playstyle: string;
  pros: string[];
  cons: string[];
  bestFor: { instances: DefaultRepresentation[]; reason: string }[];
}

export type RaceGuide = GuideType & {
  race: DefaultRepresentation;
  subraces?: Omit<GuideType, 'cons'>[];
};

export type ClassGuide = GuideType & {
  class: DefaultRepresentation;
  evolution: string;
  subclasses: (Omit<GuideType, 'pros' | 'cons'> & { evolution: string })[];
};
