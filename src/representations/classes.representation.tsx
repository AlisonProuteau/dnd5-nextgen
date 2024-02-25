import { DefaultInstance, OptionChoices } from './default.representation';

export interface ClassInfo extends DefaultInstance {
  hit_die?: number;
  multi_classing?: {
    prerequisites?: [{ ability_score: DefaultInstance; minimum_score: number }];
    prerequisite_options?: [OptionChoices];
    proficiencies?: [DefaultInstance];
    proficiency_choices?: [OptionChoices];
  };
  spellcasting?: {
    level?: number;
    info?: [{ name: string; desc: [string] }];
    spellcasting_ability?: DefaultInstance;
  };
  starting_equipment?: [{ equipement: DefaultInstance; quantity: number }];
  starting_equipment_options?: [OptionChoices];
  proficiency_choices?: [OptionChoices];
  proficiencies?: [DefaultInstance];
  saving_throws?: [DefaultInstance];
  subclasses?: [DefaultInstance];
}

export interface RaceInfo extends DefaultInstance {
  speed?: number;
  ability_bonuses?: [{ ability_score: DefaultInstance; bonus: number }];
  alignment?: string;
  age?: string;
  size?: string;
  size_description?: string;
  starting_proficiencies?: [DefaultInstance];
  languages?: [DefaultInstance];
  language_desc?: string;
  traits?: [DefaultInstance];
  subraces?: [DefaultInstance];
}
