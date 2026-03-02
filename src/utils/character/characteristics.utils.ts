import {
  AbilityChaIcon,
  AbilityConIcon,
  AbilityDexIcon,
  AbilityIntIcon,
  AbilityStrIcon,
  AbilityWisIcon,
  ProficiencyIcon
} from '@assets';

export const blackList: string[] = [
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
  'tool-proficiency'
];

export const getAbilityIcon = (ability: string) => {
  switch (ability) {
    case 'str':
      return AbilityStrIcon;
    case 'dex':
      return AbilityDexIcon;
    case 'con':
      return AbilityConIcon;
    case 'int':
      return AbilityIntIcon;
    case 'wis':
      return AbilityWisIcon;
    case 'cha':
      return AbilityChaIcon;
    default:
      return ProficiencyIcon; // Fallback icon if ability is not recognized
  }
};
