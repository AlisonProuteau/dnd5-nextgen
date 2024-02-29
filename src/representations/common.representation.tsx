import type { Damage, DifficultyClass } from './campaign/adventure.representation';

export type DefaultRepresentation = {
  index: string;
  name: string;
};

export type Choice = {
  desc?: string;
  choose: number;
  type: string;
  from: OptionSet;
};

export type OptionSet =
  | {
      option_set_type: 'options_array';
      options: Option[];
      equipment_category?: never;
      resource_list_url?: never;
    }
  | {
      option_set_type: 'equipment_category';
      options?: never;
      equipment_category: DefaultRepresentation;
      resource_list_url?: never;
    }
  | {
      option_set_type: 'resource_list';
      options?: never;
      equipment_category?: never;
      resource_list_url: string;
    };

// TODO: Add optionnals
export type Option =
  | {
      option_type: 'reference';
      item: DefaultRepresentation;
      choice?: never;
      action_name?: never;
      type?: never;
      items?: never;
      string?: never;
      desc?: never;
      alignments?: never;
      count?: never;
      of?: never;
      prerequisites?: never;
      minimum_score?: never;
      ability_score?: never;
      bonus?: never;
      name?: never;
      dc?: never;
      damage?: never;
      damage_type?: never;
      damage_dice?: never;
      notes?: never;
    }
  | {
      option_type: 'action';
      action_name: string;
      count: number | string;
      type: 'melee' | 'ranged' | 'ability' | 'magic';
      notes: string;
      item?: never;
      choice?: never;
      items?: never;
      string?: never;
      desc?: never;
      alignments?: never;
      of?: never;
      prerequisites?: never;
      minimum_score?: never;
      ability_score?: never;
      bonus?: never;
      name?: never;
      dc?: never;
      damage?: never;
      damage_type?: never;
      damage_dice?: never;
    }
  | {
      option_type: 'multiple';
      items: Option[];
      item?: never;
      choice?: never;
      action_name?: never;
      count?: never;
      type?: never;
      notes?: never;
      string?: never;
      desc?: never;
      alignments?: never;
      of?: never;
      prerequisites?: never;
      minimum_score?: never;
      ability_score?: never;
      bonus?: never;
      name?: never;
      dc?: never;
      damage?: never;
      damage_type?: never;
      damage_dice?: never;
    }
  | {
      option_type: 'choice';
      choice: Choice;
      item?: never;
      action_name?: never;
      type?: never;
      items?: never;
      string?: never;
      desc?: never;
      alignments?: never;
      count?: never;
      of?: never;
      prerequisites?: never;
      minimum_score?: never;
      ability_score?: never;
      bonus?: never;
      name?: never;
      dc?: never;
      damage?: never;
      damage_type?: never;
      damage_dice?: never;
      notes?: never;
    }
  | {
      option_type: 'string';
      string: string;
      item?: never;
      choice?: never;
      action_name?: never;
      count?: never;
      type?: never;
      notes?: never;
      items?: never;
      desc?: never;
      alignments?: never;
      of?: never;
      prerequisites?: never;
      minimum_score?: never;
      ability_score?: never;
      bonus?: never;
      name?: never;
      dc?: never;
      damage?: never;
      damage_type?: never;
      damage_dice?: never;
    }
  | {
      option_type: 'ideal';
      desc: string;
      alignments: DefaultRepresentation[];
      item?: never;
      choice?: never;
      action_name?: never;
      count?: never;
      type?: never;
      notes?: never;
      items?: never;
      string?: never;
      of?: never;
      prerequisites?: never;
      minimum_score?: never;
      ability_score?: never;
      bonus?: never;
      name?: never;
      dc?: never;
      damage?: never;
      damage_type?: never;
      damage_dice?: never;
    }
  | {
      option_type: 'counted_reference';
      count: number;
      of: DefaultRepresentation;
      prerequisites?: {
        type: 'proficiency';
        proficiency?: DefaultRepresentation;
      }[];
      item?: never;
      choice?: never;
      action_name?: never;
      type?: never;
      notes?: never;
      items?: never;
      string?: never;
      desc?: never;
      alignments?: never;
      minimum_score?: never;
      ability_score?: never;
      bonus?: never;
      name?: never;
      dc?: never;
      damage?: never;
      damage_type?: never;
      damage_dice?: never;
    }
  | {
      option_type: 'score_prerequisite';
      ability_score: DefaultRepresentation;
      minimum_score: number;
      item?: never;
      choice?: never;
      action_name?: never;
      type?: never;
      notes?: never;
      items?: never;
      string?: never;
      desc?: never;
      alignments?: never;
      count?: never;
      of?: never;
      prerequisites?: never;
      bonus?: never;
      name?: never;
      dc?: never;
      damage?: never;
      damage_type?: never;
      damage_dice?: never;
    }
  | {
      option_type: 'ability_bonus';
      ability_score: DefaultRepresentation;
      bonus: number;
      item?: never;
      choice?: never;
      action_name?: never;
      type?: never;
      notes?: never;
      items?: never;
      string?: never;
      desc?: never;
      alignments?: never;
      count?: never;
      of?: never;
      prerequisites?: never;
      minimum_score?: never;
      name?: never;
      dc?: never;
      damage?: never;
      damage_type?: never;
      damage_dice?: never;
    }
  | {
      option_type: 'breath';
      name: string;
      dc: DifficultyClass;
      damage?: Damage[];
      item?: never;
      choice?: never;
      action_name?: never;
      type?: never;
      notes?: never;
      items?: never;
      string?: never;
      desc?: never;
      alignments?: never;
      count?: never;
      of?: never;
      prerequisites?: never;
      minimum_score?: never;
      ability_score?: never;
      bonus?: never;
      damage_type?: never;
      damage_dice?: never;
    }
  | {
      option_type: 'damage';
      damage_type: DefaultRepresentation;
      damage_dice: string;
      notes: string;
      item?: never;
      choice?: never;
      action_name?: never;
      type?: never;
      items?: never;
      string?: never;
      desc?: never;
      alignments?: never;
      count?: never;
      of?: never;
      prerequisites?: never;
      minimum_score?: never;
      ability_score?: never;
      bonus?: never;
      name?: never;
      dc?: never;
      damage?: never;
    };
