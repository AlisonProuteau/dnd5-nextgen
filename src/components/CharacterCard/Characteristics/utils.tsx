import {
  AbilityIcon_cha,
  AbilityIcon_con,
  AbilityIcon_dex,
  AbilityIcon_int,
  AbilityIcon_str,
  AbilityIcon_wis,
  ProficiencyIcon
} from '@assets';

export const blackList: string[] = [
  'draconic-ancestry',
  'otherworldly-patron',
  'barbarian-unarmored-defense',
  'monk-unarmored-defense',
  'divine-domain',
  'bonus-proficiency',
  'dwarven-combat-training',
  'keen-senses',
  'elf-weapon-training',
  'extra-language',
  'menacing',
  'sorcerous-origin',
  'draconic-resilience',
  'otherworldly-patron',
  'tool-proficiency'
];

export const getAbilityIcon = (ability: string) => {
  switch (ability) {
    case 'str':
      return AbilityIcon_str;
    case 'dex':
      return AbilityIcon_dex;
    case 'con':
      return AbilityIcon_con;
    case 'int':
      return AbilityIcon_int;
    case 'wis':
      return AbilityIcon_wis;
    case 'cha':
      return AbilityIcon_cha;
    default:
      return ProficiencyIcon; // Fallback icon if ability is not recognized
  }
};
