import type { Character } from 'src/representations/user.representation';

export const baseCharacter: Character = {
  id: 'base-character-001',
  name: 'Test Character',
  version: 'Legacy',
  level: 1,
  age: 25,
  sex: { index: 'O', name: 'Other' },
  alignment: {
    abbreviation: 'NG',
    desc: 'Neutral good (NG) creatures do the best that a good person can do.',
    index: 'neutral-good',
    name: 'Neutral Good'
  },
  race: { index: 'human', name: 'Human' },
  subrace: { index: 'variant-human', name: 'Variant Human' },
  traits: [{ index: 'extra-language', name: 'Extra Language' }],
  class: { index: 'fighter', name: 'Fighter' },
  subclass: { index: 'champion', name: 'Champion' },
  features: [{ index: 'second-wind', name: 'Second Wind' }],
  background: { index: 'custom', name: 'Custom' },
  proficiencyBonus: 2,
  armorClass: 16,
  hit_die: 10,
  hit_points: 12,
  speed: 30,
  size: 'Medium',
  size_description: 'Humans vary widely in height and build. Your size is Medium.',
  abilityScores: {
    str: { full_name: 'Strength', index: 'str', modifier: 3, name: 'STR', score: 16 },
    dex: { full_name: 'Dexterity', index: 'dex', modifier: 2, name: 'DEX', score: 14 },
    con: { full_name: 'Constitution', index: 'con', modifier: 2, name: 'CON', score: 14 },
    int: { full_name: 'Intelligence', index: 'int', modifier: 1, name: 'INT', score: 12 },
    wis: { full_name: 'Wisdom', index: 'wis', modifier: 0, name: 'WIS', score: 10 },
    cha: { full_name: 'Charisma', index: 'cha', modifier: 1, name: 'CHA', score: 12 }
  },
  abilities: [{ ability_score: { index: 'str', name: 'STR' }, bonus: 1 }],
  saving_throws: [
    { index: 'str', name: 'STR' },
    { index: 'con', name: 'CON' }
  ],
  skills: [
    { index: 'skill-athletics', name: 'Skill: Athletics', type: 'class' },
    { index: 'skill-intimidation', name: 'Skill: Intimidation', type: 'background' }
  ],
  languages: [
    { index: 'common', name: 'Common', type: 'race' },
    { index: 'elvish', name: 'Elvish', type: 'trait' }
  ],
  proficiencies: [
    { index: 'all-armor', name: 'All Armor', type: 'class' },
    { index: 'shields', name: 'Shields', type: 'class' },
    { index: 'simple-weapons', name: 'Simple Weapons', type: 'class' },
    { index: 'martial-weapons', name: 'Martial Weapons', type: 'class' }
  ],
  equipments: [
    { index: 'longsword', name: 'Longsword', type: 'class' },
    { index: 'shield', name: 'Shield', type: 'class' },
    { index: 'chain-mail', name: 'Chain Mail', type: 'class' },
    { index: 'adventurers-pack', name: "Adventurer's Pack", type: 'background' }
  ],
  spells: [],
  preparedSpells: []
} as any;
