import type { ActionDamage, AreaOfEffect } from '../campaign/adventure.representation';
import type { DefaultRepresentation } from '../common.representation';

interface DC {
  dc_success: string;
  dc_type: DefaultRepresentation;
  desc?: string;
}

export interface Spell {
  area_of_effect?: AreaOfEffect;
  attack_type?: string;
  casting_time: string;
  classes: DefaultRepresentation[];
  components: string[];
  concentration: boolean;
  damage?: ActionDamage;
  dc?: DC;
  desc: string[];
  duration: string;
  heal_at_slot_level?: Record<number, string>;
  higher_level?: string;
  index: string;
  level: number;
  material?: string;
  name: string;
  range: string;
  ritual: boolean;
  school: DefaultRepresentation;
  subclasses?: DefaultRepresentation[];
}

export type MagicItem = {
  desc: string[];
  equipment_category: DefaultRepresentation;
  index: string;
  name: string;
  rarity: {
    name: string;
  };

  variants: DefaultRepresentation[];
  variant: boolean;
};

export type MagicSchool = {
  desc: string;
  index: string;
  name: string;
};
