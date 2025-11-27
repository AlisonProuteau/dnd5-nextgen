import type { Character } from 'src/representations/user.representation';

export const characters: Character[] = [
  {
    armorClass: 13,
    speed: 30,
    sex: {
      index: 'F',
      name: 'Female'
    },
    size_description:
      'Elves range from under 5 to over 6 feet tall and have slender builds. Your size is Medium.',
    features: [
      {
        name: 'Spellcasting: Druid',
        index: 'spellcasting-druid'
      },
      {
        index: 'druidic',
        name: 'Druidic'
      }
    ],
    saving_throws: [
      {
        index: 'int',
        name: 'INT'
      },
      {
        index: 'wis',
        name: 'WIS'
      }
    ],
    abilityScores: {
      wis: {
        score: 14,
        name: 'WIS',
        full_name: 'Wisdom',
        modifier: 2,
        index: 'wis'
      },
      str: {
        score: 10,
        index: 'str',
        full_name: 'Strength',
        name: 'STR',
        modifier: 0
      },
      con: {
        modifier: 1,
        full_name: 'Constitution',
        index: 'con',
        score: 13,
        name: 'CON'
      },
      int: {
        index: 'int',
        score: 16,
        full_name: 'Intelligence',
        name: 'INT',
        modifier: 3
      },
      cha: {
        name: 'CHA',
        score: 8,
        index: 'cha',
        modifier: -1,
        full_name: 'Charisma'
      },
      dex: {
        index: 'dex',
        score: 14,
        full_name: 'Dexterity',
        modifier: 2,
        name: 'DEX'
      }
    },
    race: {
      name: 'Elf',
      index: 'elf'
    },
    subclass: {
      index: 'land',
      name: 'Land'
    },
    id: '0ooqXkNBZa8ClCa5uhsX',
    proficiencies: [
      {
        index: 'light-armor',
        type: 'class',
        name: 'Light Armor'
      },
      {
        name: 'Medium Armor',
        type: 'class',
        index: 'medium-armor'
      },
      {
        index: 'shields',
        name: 'Shields',
        type: 'class'
      },
      {
        type: 'class',
        name: 'Clubs',
        index: 'clubs'
      },
      {
        index: 'daggers',
        name: 'Daggers',
        type: 'class'
      },
      {
        name: 'Javelins',
        index: 'javelins',
        type: 'class'
      },
      {
        index: 'maces',
        name: 'Maces',
        type: 'class'
      },
      {
        type: 'class',
        index: 'quarterstaffs',
        name: 'Quarterstaffs'
      },
      {
        type: 'class',
        name: 'Sickles',
        index: 'sickles'
      },
      {
        type: 'class',
        index: 'spears',
        name: 'Spears'
      },
      {
        name: 'Darts',
        type: 'class',
        index: 'darts'
      },
      {
        name: 'Slings',
        type: 'class',
        index: 'slings'
      },
      {
        index: 'scimitars',
        type: 'class',
        name: 'Scimitars'
      },
      {
        index: 'herbalism-kit',
        name: 'Herbalism Kit',
        type: 'class'
      },
      {
        type: 'race',
        name: 'Longswords',
        index: 'longswords'
      },
      {
        name: 'Shortswords',
        index: 'shortswords',
        type: 'race'
      },
      {
        name: 'Shortbows',
        index: 'shortbows',
        type: 'race'
      },
      {
        type: 'race',
        index: 'longbows',
        name: 'Longbows'
      }
    ],
    size: 'Medium',
    traits: [
      {
        name: 'Darkvision',
        index: 'darkvision'
      },
      {
        index: 'fey-ancestry',
        name: 'Fey Ancestry'
      },
      {
        name: 'Trance',
        index: 'trance'
      },
      {
        name: 'Keen Senses',
        index: 'keen-senses'
      },
      {
        index: 'elf-weapon-training',
        name: 'Elf Weapon Training'
      },
      {
        index: 'high-elf-cantrip',
        spells: [
          {
            name: 'Mending',
            index: 'mending'
          }
        ],
        name: 'High Elf Cantrip'
      },
      {
        index: 'extra-language',
        name: 'Extra Language'
      }
    ],
    subrace: {
      index: 'high-elf',
      name: 'High Elf'
    },
    languages: [
      {
        name: 'Primordial',
        index: 'primordial',
        type: 'race'
      },
      {
        name: 'Common',
        index: 'common',
        type: 'race'
      },
      {
        name: 'Elvish',
        type: 'race',
        index: 'elvish'
      }
    ],
    hit_points: 9,
    alignment: {
      desc: 'Chaotic good (CG) creatures act as their conscience directs, with little regard for what others expect. Copper dragons, many elves, and unicorns are chaotic good.',
      index: 'chaotic-good',
      name: 'Chaotic Good',
      abbreviation: 'CG'
    },
    name: 'Delfy',
    proficiencyBonus: 2,
    abilities: [
      {
        bonus: 2,
        ability_score: {
          name: 'DEX',
          index: 'dex'
        }
      },
      {
        bonus: 1,
        ability_score: {
          index: 'int',
          name: 'INT'
        }
      }
    ],
    background: {
      index: 'custom',
      name: 'Custom'
    },
    skills: [
      {
        type: 'class',
        name: 'Skill: Nature',
        index: 'skill-nature'
      },
      {
        index: 'skill-animal-handling',
        name: 'Skill: Animal Handling',
        type: 'class'
      },
      {
        type: 'race',
        index: 'skill-perception',
        name: 'Skill: Perception'
      }
    ],
    class: {
      index: 'druid',
      name: 'Druid'
    },
    equipments: [
      {
        index: 'dagger',
        type: 'class',
        name: 'Dagger'
      },
      {
        count: 1,
        type: 'class',
        name: 'Scimitar',
        index: 'scimitar'
      },
      {
        type: 'class',
        index: 'sprig-of-mistletoe',
        name: 'Sprig of mistletoe'
      },
      {
        type: 'class',
        name: 'Leather Armor',
        index: 'leather-armor'
      },
      {
        type: 'class',
        name: "Explorer's Pack",
        index: 'explorers-pack'
      }
    ],
    hit_die: 8,
    age: 23
  },
  {
    armorClass: 11,
    speed: 25,
    id: '1r4IWhZMJZADiedJLxRa',
    abilities: [
      {
        bonus: 2,
        ability_score: {
          name: 'INT',
          index: 'int'
        }
      },
      {
        bonus: 1,
        ability_score: {
          index: 'con',
          name: 'CON'
        }
      }
    ],
    proficiencies: [
      {
        name: "Alchemist's Supplies",
        index: 'alchemists-supplies',
        type: 'class'
      },
      {
        index: 'simple-weapons',
        name: 'Simple Weapons',
        type: 'class'
      },
      {
        type: 'class',
        index: 'shortswords',
        name: 'Shortswords'
      },
      {
        index: 'tinkers-tools',
        name: "Tinker's Tools",
        type: 'race'
      }
    ],
    size: 'Small',
    hit_points: 7,
    background: {
      name: 'Custom',
      index: 'custom'
    },
    size_description:
      'Gnomes are between 3 and 4 feet tall and average about 40 pounds. Your size is Small.',
    name: 'Mark',
    abilityScores: {
      dex: {
        name: 'DEX',
        score: 10,
        full_name: 'Dexterity',
        index: 'dex',
        modifier: 0
      },
      int: {
        index: 'int',
        modifier: 3,
        name: 'INT',
        score: 17,
        full_name: 'Intelligence'
      },
      wis: {
        modifier: 1,
        score: 13,
        full_name: 'Wisdom',
        name: 'WIS',
        index: 'wis'
      },
      str: {
        full_name: 'Strength',
        modifier: 1,
        name: 'STR',
        score: 12,
        index: 'str'
      },
      con: {
        score: 9,
        index: 'con',
        full_name: 'Constitution',
        modifier: -1,
        name: 'CON'
      },
      cha: {
        modifier: 2,
        score: 14,
        name: 'CHA',
        full_name: 'Charisma',
        index: 'cha'
      }
    },
    proficiencyBonus: 2,
    subclass: {
      index: 'open-hand',
      name: 'Open Hand'
    },
    saving_throws: [
      {
        index: 'str',
        name: 'STR'
      },
      {
        index: 'dex',
        name: 'DEX'
      }
    ],
    traits: [
      {
        index: 'darkvision',
        name: 'Darkvision'
      },
      {
        index: 'gnome-cunning',
        name: 'Gnome Cunning'
      },
      {
        name: "Artificer's Lore",
        index: 'artificers-lore'
      },
      {
        index: 'tinker',
        name: 'Tinker'
      }
    ],
    alignment: {
      name: 'Lawful Neutral',
      index: 'lawful-neutral',
      desc: 'Lawful neutral (LN) individuals act in accordance with law, tradition, or personal codes. Many monks and some wizards are lawful neutral.',
      abbreviation: 'LN'
    },
    race: {
      name: 'Gnome',
      index: 'gnome'
    },
    equipments: [
      {
        name: 'Quarterstaff',
        type: 'class',
        index: 'quarterstaff'
      },
      {
        count: 1,
        name: "Dungeoneer's Pack",
        index: 'dungeoneers-pack',
        type: 'class'
      },
      {
        name: 'Dart',
        type: 'class',
        index: 'dart'
      }
    ],
    sex: {
      index: 'M',
      name: 'Male'
    },
    languages: [
      {
        index: 'common',
        name: 'Common',
        type: 'race'
      },
      {
        name: 'Gnomish',
        index: 'gnomish',
        type: 'race'
      }
    ],
    hit_die: 8,
    skills: [
      {
        type: 'class',
        index: 'skill-history',
        name: 'Skill: History'
      },
      {
        name: 'Skill: Religion',
        index: 'skill-religion',
        type: 'class'
      }
    ],
    subrace: {
      index: 'rock-gnome',
      name: 'Rock Gnome'
    },
    features: [
      {
        name: 'Unarmored Defense',
        index: 'monk-unarmored-defense'
      },
      {
        name: 'Martial Arts',
        index: 'martial-arts'
      }
    ],
    class: {
      index: 'monk',
      name: 'Monk'
    },
    age: 58
  },
  {
    languages: [
      {
        type: 'race',
        name: 'Deep Speech',
        index: 'deep-speech'
      },
      {
        type: 'race',
        index: 'common',
        name: 'Common'
      }
    ],
    proficiencyBonus: 2,
    features: [
      {
        name: 'Otherworldly Patron',
        index: 'otherworldly-patron'
      },
      {
        name: 'Pact Magic',
        index: 'pact-magic'
      },
      {
        name: "Dark One's Blessing",
        index: 'dark-ones-blessing'
      }
    ],
    armorClass: 14,
    alignment: {
      desc: 'Lawful good (LG) creatures can be counted on to do the right thing as expected by society. Gold dragons, paladins, and most dwarves are lawful good.',
      name: 'Lawful Good',
      index: 'lawful-good',
      abbreviation: 'LG'
    },
    abilities: [
      {
        bonus: 1,
        ability_score: {
          name: 'STR',
          index: 'str'
        }
      },
      {
        ability_score: {
          name: 'DEX',
          index: 'dex'
        },
        bonus: 1
      },
      {
        ability_score: {
          index: 'con',
          name: 'CON'
        },
        bonus: 1
      },
      {
        ability_score: {
          index: 'int',
          name: 'INT'
        },
        bonus: 1
      },
      {
        ability_score: {
          name: 'WIS',
          index: 'wis'
        },
        bonus: 1
      },
      {
        ability_score: {
          index: 'cha',
          name: 'CHA'
        },
        bonus: 1
      }
    ],
    size: 'Medium',
    size_description:
      'Humans vary widely in height and build, from barely 5 feet to well over 6 feet tall. Regardless of your position in that range, your size is Medium.',
    hit_die: 8,
    proficiencies: [
      {
        index: 'light-armor',
        type: 'class',
        name: 'Light Armor'
      },
      {
        name: 'Simple Weapons',
        type: 'class',
        index: 'simple-weapons'
      }
    ],
    sex: {
      name: 'Male',
      index: 'M'
    },
    saving_throws: [
      {
        name: 'WIS',
        index: 'wis'
      },
      {
        name: 'CHA',
        index: 'cha'
      }
    ],
    age: 23,
    race: {
      index: 'human',
      name: 'Human'
    },
    subclass: {
      name: 'Fiend',
      index: 'fiend'
    },
    abilityScores: {
      dex: {
        modifier: 3,
        score: 17,
        full_name: 'Dexterity',
        index: 'dex',
        name: 'DEX'
      },
      int: {
        score: 15,
        full_name: 'Intelligence',
        name: 'INT',
        modifier: 2,
        index: 'int'
      },
      con: {
        name: 'CON',
        score: 8,
        index: 'con',
        full_name: 'Constitution',
        modifier: -1
      },
      cha: {
        name: 'CHA',
        score: 11,
        index: 'cha',
        modifier: 0,
        full_name: 'Charisma'
      },
      str: {
        score: 16,
        modifier: 3,
        full_name: 'Strength',
        name: 'STR',
        index: 'str'
      },
      wis: {
        full_name: 'Wisdom',
        name: 'WIS',
        score: 14,
        modifier: 2,
        index: 'wis'
      }
    },
    speed: 30,
    equipments: [
      {
        index: 'crossbow-bolt',
        type: 'class',
        name: 'Crossbow bolt',
        count: 20
      },
      {
        index: 'crossbow-light',
        type: 'class',
        count: 1,
        name: 'Crossbow, light'
      },
      {
        type: 'class',
        name: 'Component pouch',
        index: 'component-pouch',
        count: 1
      },
      {
        name: "Scholar's Pack",
        count: 1,
        index: 'scholars-pack',
        type: 'class'
      },
      {
        index: 'light-hammer',
        type: 'class',
        name: 'Light hammer'
      },
      {
        type: 'class',
        name: 'Dagger',
        index: 'dagger'
      },
      {
        index: 'leather-armor',
        name: 'Leather Armor',
        type: 'class'
      }
    ],
    id: '52BUkSo5uF4YbTgjN6Jm',
    hit_points: 7,
    background: {
      name: 'Custom',
      index: 'custom'
    },
    class: {
      name: 'Warlock',
      index: 'warlock'
    },
    skills: [
      {
        index: 'skill-investigation',
        type: 'class',
        name: 'Skill: Investigation'
      },
      {
        type: 'class',
        index: 'skill-arcana',
        name: 'Skill: Arcana'
      }
    ],
    name: 'Willy'
  },
  {
    languages: [
      {
        type: 'race',
        name: 'Common',
        index: 'common'
      },
      {
        index: 'elvish',
        name: 'Elvish',
        type: 'race'
      }
    ],
    armorClass: 15,
    race: {
      index: 'elf',
      name: 'Elf'
    },
    size_description:
      'Elves range from under 5 to over 6 feet tall and have slender builds. Your size is Medium.',
    name: 'Woody',
    speed: 35,
    age: 23,
    skills: [
      {
        index: 'skill-intimidation',
        type: 'class',
        name: 'Skill: Intimidation'
      },
      {
        type: 'class',
        index: 'skill-athletics',
        name: 'Skill: Athletics'
      },
      {
        index: 'skill-perception',
        type: 'race',
        name: 'Skill: Perception'
      }
    ],
    abilities: [
      {
        bonus: 2,
        ability_score: {
          name: 'DEX',
          index: 'dex'
        }
      },
      {
        bonus: 1,
        ability_score: {
          name: 'WIS',
          index: 'wis'
        }
      }
    ],
    hit_die: 10,
    id: '5ZLJpNRAYkE4EyRJcngz',
    features: [
      {
        subfeatures: [
          {
            index: 'fighter-fighting-style-archery',
            name: 'Fighting Style: Archery'
          }
        ],
        index: 'fighter-fighting-style',
        name: 'Fighting Style'
      },
      {
        name: 'Second Wind',
        index: 'second-wind'
      }
    ],
    proficiencies: [
      {
        type: 'class',
        name: 'All armor',
        index: 'all-armor'
      },
      {
        name: 'Shields',
        index: 'shields',
        type: 'class'
      },
      {
        type: 'class',
        index: 'simple-weapons',
        name: 'Simple Weapons'
      },
      {
        name: 'Martial Weapons',
        index: 'martial-weapons',
        type: 'class'
      },
      {
        index: 'longsword',
        name: 'Longsword',
        type: 'race'
      },
      {
        name: 'Shortsword',
        type: 'race',
        index: 'shortsword'
      },
      {
        type: 'race',
        index: 'shortbow',
        name: 'Shortbow'
      },
      {
        name: 'Longbow',
        index: 'longbow',
        type: 'race'
      }
    ],
    background: {
      name: 'Custom',
      index: 'custom'
    },
    sex: {
      name: 'Male',
      index: 'M'
    },
    abilityScores: {
      dex: {
        full_name: 'Dexterity',
        modifier: 2,
        index: 'dex',
        name: 'DEX',
        score: 15
      },
      wis: {
        score: 16,
        full_name: 'Wisdom',
        name: 'WIS',
        index: 'wis',
        modifier: 3
      },
      con: {
        name: 'CON',
        full_name: 'Constitution',
        score: 16,
        modifier: 3,
        index: 'con'
      },
      str: {
        full_name: 'Strength',
        name: 'STR',
        score: 16,
        index: 'str',
        modifier: 3
      },
      int: {
        full_name: 'Intelligence',
        name: 'INT',
        score: 15,
        modifier: 2,
        index: 'int'
      },
      cha: {
        name: 'CHA',
        index: 'cha',
        full_name: 'Charisma',
        score: 13,
        modifier: 1
      }
    },
    proficiencyBonus: 2,
    traits: [
      {
        index: 'darkvision',
        name: 'Darkvision'
      },
      {
        index: 'fey-ancestry',
        name: 'Fey Ancestry'
      },
      {
        name: 'Trance',
        index: 'trance'
      },
      {
        index: 'keen-senses',
        name: 'Keen Senses'
      },
      {
        index: 'mask-of-the-wild',
        name: 'Mask of the Wild'
      }
    ],
    size: 'Medium',
    alignment: {
      index: 'lawful-neutral',
      name: 'Lawful Neutral',
      desc: 'Lawful neutral (LN) individuals act in accordance with law, tradition, or personal codes. Many monks and some wizards are lawful neutral.',
      abbreviation: 'LN'
    },
    subclass: {
      index: 'champion',
      name: 'Champion'
    },
    hit_points: 13,
    subrace: {
      index: 'wood-elf',
      name: 'Wood Elf'
    },
    equipments: [
      {
        type: 'class',
        name: 'Leather Armor',
        index: 'leather-armor',
        count: 1
      },
      {
        count: 1,
        index: 'longbow',
        type: 'class',
        name: 'Longbow'
      },
      {
        name: 'Arrow',
        count: 20,
        index: 'arrow',
        type: 'class'
      },
      {
        type: 'class',
        index: 'shield',
        name: 'Shield',
        count: 1
      },
      {
        name: 'Crossbow bolt',
        type: 'class',
        count: 20,
        index: 'crossbow-bolt'
      },
      {
        type: 'class',
        index: 'crossbow-light',
        name: 'Crossbow, light',
        count: 1
      },
      {
        name: "Explorer's Pack",
        count: 1,
        type: 'class',
        index: 'explorers-pack'
      },
      {
        type: 'class',
        name: 'Crossbow, hand',
        index: 'crossbow-hand'
      }
    ],
    saving_throws: [
      {
        name: 'STR',
        index: 'str'
      },
      {
        name: 'CON',
        index: 'con'
      }
    ],
    class: {
      index: 'fighter',
      name: 'Fighter'
    }
  },
  {
    equipments: [
      {
        name: 'Mace',
        type: 'class',
        count: 1,
        index: 'mace'
      },
      {
        count: 1,
        type: 'class',
        index: 'leather-armor',
        name: 'Leather Armor'
      },
      {
        type: 'class',
        name: 'Crossbow bolt',
        count: 20,
        index: 'crossbow-bolt'
      },
      {
        count: 1,
        type: 'class',
        index: 'crossbow-light',
        name: 'Crossbow, light'
      },
      {
        name: "Priest's Pack",
        index: 'priests-pack',
        count: 1,
        type: 'class'
      },
      {
        type: 'class',
        index: 'reliquary',
        name: 'Reliquary'
      },
      {
        name: 'Shield',
        type: 'class',
        index: 'shield'
      }
    ],
    subrace: {
      name: 'Mountain Dwarf',
      index: 'mountain-dwarf'
    },
    skills: [
      {
        name: 'Skill: Religion',
        index: 'skill-religion',
        type: 'class'
      },
      {
        index: 'skill-history',
        type: 'class',
        name: 'Skill: History'
      }
    ],
    armorClass: 13,
    background: {
      name: 'Custom',
      index: 'custom'
    },
    languages: [
      {
        index: 'common',
        name: 'Common',
        type: 'race'
      },
      {
        type: 'race',
        index: 'dwarvish',
        name: 'Dwarvish'
      }
    ],
    race: {
      index: 'dwarf',
      name: 'Dwarf'
    },
    proficiencies: [
      {
        name: 'Light Armor',
        type: 'class',
        index: 'light-armor'
      },
      {
        type: 'class',
        index: 'medium-armor',
        name: 'Medium Armor'
      },
      {
        index: 'shields',
        name: 'Shields',
        type: 'class'
      },
      {
        index: 'simple-weapons',
        type: 'class',
        name: 'Simple Weapons'
      },
      {
        index: 'battleaxes',
        name: 'Battleaxes',
        type: 'race'
      },
      {
        name: 'Handaxes',
        type: 'race',
        index: 'handaxes'
      },
      {
        type: 'race',
        name: 'Light hammers',
        index: 'light-hammers'
      },
      {
        name: 'Warhammers',
        type: 'race',
        index: 'warhammers'
      },
      {
        name: 'Heavy armor',
        index: 'heavy-armor'
      }
    ],
    hit_die: 8,
    class: {
      name: 'Cleric',
      index: 'cleric'
    },
    abilities: [
      {
        bonus: 2,
        ability_score: {
          name: 'CON',
          index: 'con'
        }
      },
      {
        ability_score: {
          index: 'str',
          name: 'STR'
        },
        bonus: 2
      }
    ],
    subclass: {
      index: 'life',
      name: 'Life'
    },
    size: 'Medium',
    traits: [
      {
        index: 'darkvision',
        name: 'Darkvision'
      },
      {
        name: 'Dwarven Resilience',
        index: 'dwarven-resilience'
      },
      {
        index: 'stonecunning',
        name: 'Stonecunning'
      },
      {
        name: 'Dwarven Combat Training',
        index: 'dwarven-combat-training'
      },
      {
        name: 'Tool Proficiency',
        index: 'tool-proficiency'
      }
    ],
    hit_points: 8,
    speed: 25,
    abilityScores: {
      int: {
        modifier: 2,
        name: 'INT',
        score: 15,
        full_name: 'Intelligence',
        index: 'int'
      },
      str: {
        score: 13,
        modifier: 1,
        name: 'STR',
        full_name: 'Strength',
        index: 'str'
      },
      wis: {
        full_name: 'Wisdom',
        index: 'wis',
        score: 15,
        name: 'WIS',
        modifier: 2
      },
      con: {
        score: 11,
        index: 'con',
        modifier: 0,
        full_name: 'Constitution',
        name: 'CON'
      },
      cha: {
        full_name: 'Charisma',
        modifier: 0,
        index: 'cha',
        score: 10,
        name: 'CHA'
      },
      dex: {
        index: 'dex',
        score: 11,
        modifier: 0,
        name: 'DEX',
        full_name: 'Dexterity'
      }
    },
    size_description:
      'Dwarves stand between 4 and 5 feet tall and average about 150 pounds. Your size is Medium.',
    id: 'MgcZTVak3q0e8SwtCM8w',
    name: 'Mounty',
    alignment: {
      name: 'Chaotic Neutral',
      desc: 'Chaotic neutral (CN) creatures follow their whims, holding their personal freedom above all else. Many barbarians and rogues, and some bards, are chaotic neutral.',
      index: 'chaotic-neutral',
      abbreviation: 'CN'
    },
    saving_throws: [
      {
        name: 'WIS',
        index: 'wis'
      },
      {
        name: 'CHA',
        index: 'cha'
      }
    ],
    age: 87,
    sex: {
      name: 'Other',
      index: 'O'
    },
    features: [
      {
        index: 'spellcasting-cleric',
        name: 'Spellcasting: Cleric'
      },
      {
        index: 'divine-domain',
        name: 'Divine Domain'
      },
      {
        index: 'domain-spells-1',
        name: 'Domain Spells'
      },
      {
        index: 'bonus-proficiency',
        name: 'Bonus Proficiency'
      },
      {
        name: 'Disciple of Life',
        index: 'disciple-of-life'
      }
    ],
    proficiencyBonus: 2
  },
  {
    features: [
      {
        name: 'Divine Sense',
        index: 'divine-sense'
      },
      {
        index: 'lay-on-hands',
        name: 'Lay on Hands'
      }
    ],
    speed: 30,
    traits: [
      {
        index: 'darkvision',
        name: 'Darkvision'
      },
      {
        index: 'fey-ancestry',
        name: 'Fey Ancestry'
      }
    ],
    background: {
      name: 'Custom',
      index: 'custom'
    },
    class: {
      index: 'paladin',
      name: 'Paladin'
    },
    size_description:
      'Half-elves are about the same size as humans, ranging from 5 to 6 feet tall. Your size is Medium.',
    languages: [
      {
        name: 'Deep Speech',
        index: 'deep-speech',
        type: 'race'
      },
      {
        name: 'Common',
        type: 'race',
        index: 'common'
      },
      {
        type: 'race',
        name: 'Elvish',
        index: 'elvish'
      }
    ],
    saving_throws: [
      {
        index: 'wis',
        name: 'WIS'
      },
      {
        name: 'CHA',
        index: 'cha'
      }
    ],
    age: 61,
    race: {
      name: 'Half-elf',
      index: 'half-elf'
    },
    proficiencies: [
      {
        index: 'all-armor',
        type: 'class',
        name: 'All armor'
      },
      {
        index: 'shields',
        name: 'Shields',
        type: 'class'
      },
      {
        type: 'class',
        name: 'Simple Weapons',
        index: 'simple-weapons'
      },
      {
        name: 'Martial Weapons',
        index: 'martial-weapons',
        type: 'class'
      }
    ],
    hit_die: 10,
    alignment: {
      name: 'Chaotic Neutral',
      desc: 'Chaotic neutral (CN) creatures follow their whims, holding their personal freedom above all else. Many barbarians and rogues, and some bards, are chaotic neutral.',
      index: 'chaotic-neutral',
      abbreviation: 'CN'
    },
    equipments: [
      {
        index: 'whip',
        name: 'Whip',
        type: 'class'
      },
      {
        count: 1,
        index: 'shield',
        type: 'class',
        name: 'Shield'
      },
      {
        name: 'Javelin',
        index: 'javelin',
        type: 'class',
        count: 5
      },
      {
        count: 1,
        index: 'priests-pack',
        type: 'class',
        name: "Priest's Pack"
      },
      {
        name: 'Emblem',
        type: 'class',
        index: 'emblem'
      },
      {
        name: 'Chain Mail',
        type: 'class',
        index: 'chain-mail'
      }
    ],
    hit_points: 12,
    sex: {
      name: 'Other',
      index: 'O'
    },
    name: 'Devy',
    proficiencyBonus: 2,
    abilities: [
      {
        ability_score: {
          name: 'INT',
          index: 'int'
        },
        bonus: 1
      },
      {
        ability_score: {
          name: 'WIS',
          index: 'wis'
        },
        bonus: 1
      },
      {
        ability_score: {
          name: 'CHA',
          index: 'cha'
        },
        bonus: 2
      }
    ],
    id: 'PpOGithJfyDALfoyOtGr',
    size: 'Medium',
    armorClass: 18,
    subclass: {
      name: 'Devotion',
      index: 'devotion'
    },
    abilityScores: {
      int: {
        full_name: 'Intelligence',
        modifier: 0,
        index: 'int',
        score: 11,
        name: 'INT'
      },
      con: {
        index: 'con',
        modifier: 2,
        full_name: 'Constitution',
        name: 'CON',
        score: 15
      },
      wis: {
        full_name: 'Wisdom',
        name: 'WIS',
        index: 'wis',
        modifier: 2,
        score: 14
      },
      str: {
        full_name: 'Strength',
        name: 'STR',
        index: 'str',
        modifier: 0,
        score: 10
      },
      cha: {
        name: 'CHA',
        index: 'cha',
        score: 13,
        full_name: 'Charisma',
        modifier: 1
      },
      dex: {
        index: 'dex',
        name: 'DEX',
        full_name: 'Dexterity',
        modifier: 2,
        score: 14
      }
    },
    skills: [
      {
        name: 'Skill: Insight',
        type: 'class',
        index: 'skill-insight'
      },
      {
        index: 'skill-medicine',
        type: 'class',
        name: 'Skill: Medicine'
      },
      {
        type: 'race',
        name: 'Skill: Religion',
        index: 'skill-religion'
      },
      {
        name: 'Skill: Arcana',
        type: 'race',
        index: 'skill-arcana'
      }
    ]
  },
  {
    armorClass: 11,
    age: 37,
    size_description: 'Tieflings are about the same size and build as humans. Your size is Medium.',
    sex: {
      index: 'F',
      name: 'Female'
    },
    subclass: {
      index: 'evocation',
      name: 'Evocation'
    },
    traits: [
      {
        index: 'darkvision',
        name: 'Darkvision'
      },
      {
        name: 'Hellish Resistance',
        index: 'hellish-resistance'
      },
      {
        index: 'infernal-legacy',
        name: 'Infernal Legacy'
      }
    ],
    size: 'Medium',
    saving_throws: [
      {
        name: 'INT',
        index: 'int'
      },
      {
        name: 'WIS',
        index: 'wis'
      }
    ],
    languages: [
      {
        index: 'common',
        name: 'Common',
        type: 'race'
      },
      {
        type: 'race',
        name: 'Infernal',
        index: 'infernal'
      }
    ],
    name: 'Tilly',
    features: [
      {
        name: 'Spellcasting: Wizard',
        index: 'spellcasting-wizard'
      },
      {
        index: 'arcane-recovery',
        name: 'Arcane Recovery'
      }
    ],
    alignment: {
      abbreviation: 'NG',
      desc: 'Neutral good (NG) folk do the best they can to help others according to their needs. Many celestials, some cloud giants, and most gnomes are neutral good.',
      index: 'neutral-good',
      name: 'Neutral Good'
    },
    speed: 30,
    equipments: [
      {
        count: 1,
        type: 'class',
        index: 'quarterstaff',
        name: 'Quarterstaff'
      },
      {
        name: 'Component pouch',
        count: 1,
        index: 'component-pouch',
        type: 'class'
      },
      {
        index: 'scholars-pack',
        type: 'class',
        count: 1,
        name: "Scholar's Pack"
      },
      {
        name: 'Spellbook',
        type: 'class',
        index: 'spellbook'
      }
    ],
    abilities: [
      {
        ability_score: {
          index: 'int',
          name: 'INT'
        },
        bonus: 1
      },
      {
        ability_score: {
          index: 'cha',
          name: 'CHA'
        },
        bonus: 2
      }
    ],
    hit_die: 6,
    proficiencyBonus: 2,
    proficiencies: [
      {
        index: 'daggers',
        name: 'Daggers',
        type: 'class'
      },
      {
        name: 'Darts',
        index: 'darts',
        type: 'class'
      },
      {
        type: 'class',
        name: 'Slings',
        index: 'slings'
      },
      {
        name: 'Quarterstaffs',
        index: 'quarterstaffs',
        type: 'class'
      },
      {
        index: 'crossbows-light',
        type: 'class',
        name: 'Crossbows, light'
      }
    ],
    race: {
      name: 'Tiefling',
      index: 'tiefling'
    },
    class: {
      index: 'wizard',
      name: 'Wizard'
    },
    abilityScores: {
      con: {
        score: 10,
        name: 'CON',
        modifier: 0,
        index: 'con',
        full_name: 'Constitution'
      },
      cha: {
        index: 'cha',
        score: 14,
        modifier: 2,
        name: 'CHA',
        full_name: 'Charisma'
      },
      dex: {
        index: 'dex',
        full_name: 'Dexterity',
        modifier: 1,
        name: 'DEX',
        score: 13
      },
      int: {
        name: 'INT',
        modifier: 3,
        index: 'int',
        score: 16,
        full_name: 'Intelligence'
      },
      str: {
        full_name: 'Strength',
        index: 'str',
        score: 8,
        modifier: -1,
        name: 'STR'
      },
      wis: {
        index: 'wis',
        score: 14,
        name: 'WIS',
        full_name: 'Wisdom',
        modifier: 2
      }
    },
    skills: [
      {
        index: 'skill-arcana',
        type: 'class',
        name: 'Skill: Arcana'
      },
      {
        name: 'Skill: Medicine',
        type: 'class',
        index: 'skill-medicine'
      }
    ],
    id: 'Y8LOzfZsY0FQmiWPtHzQ',
    background: {
      name: 'Custom',
      index: 'custom'
    },
    hit_points: 6
  },
  {
    id: 'kPfVDYuElbm5q44pcyOs',
    size: 'Medium',
    hit_points: 10,
    age: 24,
    speed: 25,
    class: {
      index: 'bard',
      name: 'Bard'
    },
    size_description:
      'Dwarves stand between 4 and 5 feet tall and average about 150 pounds. Your size is Medium.',
    features: [
      {
        name: 'Spellcasting: Bard',
        index: 'spellcasting-bard'
      },
      {
        index: 'bardic-inspiration-d6',
        name: 'Bardic Inspiration (d6)'
      }
    ],
    race: {
      name: 'Dwarf',
      index: 'dwarf'
    },
    hit_die: 8,
    name: 'Dill',
    armorClass: 12,
    equipments: [
      {
        type: 'class',
        count: 1,
        name: 'Longsword',
        index: 'longsword'
      },
      {
        name: "Entertainer's Pack",
        type: 'class',
        index: 'entertainers-pack',
        count: 1
      },
      {
        type: 'class',
        name: 'Bagpipes',
        index: 'bagpipes'
      },
      {
        type: 'class',
        name: 'Leather Armor',
        index: 'leather-armor'
      },
      {
        type: 'class',
        name: 'Dagger',
        index: 'dagger'
      }
    ],
    saving_throws: [
      {
        name: 'DEX',
        index: 'dex'
      },
      {
        name: 'CHA',
        index: 'cha'
      }
    ],
    subrace: {
      index: 'hill-dwarf',
      name: 'Hill Dwarf'
    },
    skills: [
      {
        index: 'skill-investigation',
        type: 'class',
        name: 'Skill: Investigation'
      },
      {
        name: 'Skill: Performance',
        type: 'class',
        index: 'skill-performance'
      },
      {
        type: 'class',
        name: 'Skill: Insight',
        index: 'skill-insight'
      }
    ],
    abilityScores: {
      str: {
        name: 'STR',
        full_name: 'Strength',
        index: 'str',
        modifier: -2,
        score: 7
      },
      wis: {
        index: 'wis',
        score: 11,
        name: 'WIS',
        full_name: 'Wisdom',
        modifier: 0
      },
      cha: {
        score: 14,
        index: 'cha',
        full_name: 'Charisma',
        modifier: 2,
        name: 'CHA'
      },
      dex: {
        score: 12,
        modifier: 1,
        index: 'dex',
        name: 'DEX',
        full_name: 'Dexterity'
      },
      con: {
        name: 'CON',
        modifier: 2,
        index: 'con',
        score: 14,
        full_name: 'Constitution'
      },
      int: {
        full_name: 'Intelligence',
        score: 13,
        modifier: 1,
        index: 'int',
        name: 'INT'
      }
    },
    sex: {
      name: 'Female',
      index: 'F'
    },
    subclass: {
      name: 'Lore',
      index: 'lore'
    },
    alignment: {
      name: 'Neutral Good',
      desc: 'Neutral good (NG) folk do the best they can to help others according to their needs. Many celestials, some cloud giants, and most gnomes are neutral good.',
      abbreviation: 'NG',
      index: 'neutral-good'
    },
    abilities: [
      {
        bonus: 2,
        ability_score: {
          index: 'con',
          name: 'CON'
        }
      },
      {
        bonus: 1,
        ability_score: {
          index: 'wis',
          name: 'WIS'
        }
      }
    ],
    languages: [
      {
        name: 'Common',
        type: 'race',
        index: 'common'
      },
      {
        index: 'dwarvish',
        name: 'Dwarvish',
        type: 'race'
      }
    ],
    proficiencies: [
      {
        name: 'Bagpipes',
        type: 'class',
        index: 'bagpipes'
      },
      {
        name: 'Pan flute',
        type: 'class',
        index: 'pan-flute'
      },
      {
        index: 'viol',
        name: 'Viol',
        type: 'class'
      },
      {
        index: 'light-armor',
        type: 'class',
        name: 'Light Armor'
      },
      {
        index: 'simple-weapons',
        name: 'Simple Weapons',
        type: 'class'
      },
      {
        name: 'Longswords',
        index: 'longswords',
        type: 'class'
      },
      {
        index: 'rapiers',
        type: 'class',
        name: 'Rapiers'
      },
      {
        type: 'class',
        index: 'shortswords',
        name: 'Shortswords'
      },
      {
        name: 'Hand crossbows',
        type: 'class',
        index: 'hand-crossbows'
      },
      {
        type: 'race',
        name: "Brewer's Supplies",
        index: 'brewers-supplies'
      },
      {
        index: 'battleaxes',
        type: 'race',
        name: 'Battleaxes'
      },
      {
        type: 'race',
        name: 'Handaxes',
        index: 'handaxes'
      },
      {
        index: 'light-hammers',
        type: 'race',
        name: 'Light hammers'
      },
      {
        type: 'race',
        name: 'Warhammers',
        index: 'warhammers'
      }
    ],
    proficiencyBonus: 2,
    background: {
      index: 'custom',
      name: 'Custom'
    },
    traits: [
      {
        name: 'Darkvision',
        index: 'darkvision'
      },
      {
        name: 'Dwarven Resilience',
        index: 'dwarven-resilience'
      },
      {
        index: 'stonecunning',
        name: 'Stonecunning'
      },
      {
        index: 'dwarven-combat-training',
        name: 'Dwarven Combat Training'
      },
      {
        name: 'Tool Proficiency',
        index: 'tool-proficiency'
      },
      {
        name: 'Dwarven Toughness',
        index: 'dwarven-toughness'
      }
    ]
  },
  {
    sex: {
      index: 'O',
      name: 'Other'
    },
    name: 'Bert',
    speed: 30,
    background: {
      index: 'custom',
      name: 'Custom'
    },
    saving_throws: [
      {
        index: 'str',
        name: 'STR'
      },
      {
        index: 'con',
        name: 'CON'
      }
    ],
    languages: [
      {
        type: 'race',
        name: 'Common',
        index: 'common'
      },
      {
        index: 'draconic',
        name: 'Draconic',
        type: 'race'
      }
    ],
    subclass: {
      name: 'Berserker',
      index: 'berserker'
    },
    proficiencies: [
      {
        index: 'light-armor',
        name: 'Light Armor',
        type: 'class'
      },
      {
        name: 'Medium Armor',
        index: 'medium-armor',
        type: 'class'
      },
      {
        type: 'class',
        name: 'Shields',
        index: 'shields'
      },
      {
        name: 'Simple Weapons',
        index: 'simple-weapons',
        type: 'class'
      },
      {
        name: 'Martial Weapons',
        index: 'martial-weapons',
        type: 'class'
      }
    ],
    age: 42,
    skills: [
      {
        name: 'Skill: Intimidation',
        type: 'class',
        index: 'skill-intimidation'
      },
      {
        name: 'Skill: Athletics',
        index: 'skill-athletics',
        type: 'class'
      }
    ],
    armorClass: 13,
    id: 'o1YrL8WdiC6hWDRQRDaJ',
    hit_points: 14,
    size: 'Medium',
    abilityScores: {
      con: {
        full_name: 'Constitution',
        score: 14,
        modifier: 2,
        name: 'CON',
        index: 'con'
      },
      int: {
        name: 'INT',
        full_name: 'Intelligence',
        score: 10,
        modifier: 0,
        index: 'int'
      },
      str: {
        index: 'str',
        name: 'STR',
        modifier: 3,
        full_name: 'Strength',
        score: 17
      },
      wis: {
        score: 8,
        name: 'WIS',
        full_name: 'Wisdom',
        modifier: -1,
        index: 'wis'
      },
      cha: {
        score: 13,
        index: 'cha',
        full_name: 'Charisma',
        name: 'CHA',
        modifier: 1
      },
      dex: {
        full_name: 'Dexterity',
        modifier: 1,
        index: 'dex',
        name: 'DEX',
        score: 13
      }
    },
    features: [
      {
        index: 'rage',
        name: 'Rage'
      },
      {
        name: 'Unarmored Defense',
        index: 'barbarian-unarmored-defense'
      }
    ],
    alignment: {
      name: 'Chaotic Evil',
      desc: 'Chaotic evil (CE) creatures act with arbitrary violence, spurred by their greed, hatred, or bloodlust. Demons, red dragons, and orcs are chaotic evil.',
      index: 'chaotic-evil',
      abbreviation: 'CE'
    },
    hit_die: 12,
    size_description:
      'Dragonborn are taller and heavier than humans, standing well over 6 feet tall and averaging almost 250 pounds. Your size is Medium.',
    traits: [
      {
        name: 'Draconic Ancestry',
        subtraits: [
          {
            index: 'draconic-ancestry-copper',
            name: 'Draconic Ancestry (Copper)'
          }
        ],
        index: 'draconic-ancestry'
      },
      {
        name: 'Breath Weapon',
        index: 'breath-weapon'
      },
      {
        name: 'Damage Resistance',
        index: 'damage-resistance'
      }
    ],
    class: {
      name: 'Barbarian',
      index: 'barbarian'
    },
    proficiencyBonus: 2,
    equipments: [
      {
        index: 'greataxe',
        count: 1,
        type: 'class',
        name: 'Greataxe'
      },
      {
        type: 'class',
        name: 'Handaxe',
        index: 'handaxe',
        count: 2
      },
      {
        index: 'explorers-pack',
        type: 'class',
        name: "Explorer's Pack"
      },
      {
        name: 'Javelin',
        index: 'javelin',
        type: 'class'
      }
    ],
    race: {
      index: 'dragonborn',
      name: 'Dragonborn'
    },
    abilities: [
      {
        bonus: 2,
        ability_score: {
          name: 'STR',
          index: 'str'
        }
      },
      {
        ability_score: {
          name: 'CHA',
          index: 'cha'
        },
        bonus: 1
      }
    ]
  },
  {
    size: 'Medium',
    hit_points: 10,
    id: 'c7GSL1NfFVwL5al1esPp',
    proficiencies: [
      {
        type: 'class',
        name: 'Light Armor',
        index: 'light-armor'
      },
      {
        index: 'medium-armor',
        type: 'class',
        name: 'Medium Armor'
      },
      {
        name: 'Shields',
        index: 'shields',
        type: 'class'
      },
      {
        name: 'Simple Weapons',
        index: 'simple-weapons',
        type: 'class'
      },
      {
        index: 'martial-weapons',
        name: 'Martial Weapons',
        type: 'class'
      }
    ],
    saving_throws: [
      {
        index: 'str',
        name: 'STR'
      },
      {
        name: 'DEX',
        index: 'dex'
      }
    ],
    name: 'Ravy',
    speed: 30,
    abilities: [
      {
        ability_score: {
          index: 'str',
          name: 'STR'
        },
        bonus: 2
      },
      {
        bonus: 1,
        ability_score: {
          name: 'CON',
          index: 'con'
        }
      }
    ],
    alignment: {
      name: 'Neutral',
      desc: "Neutral (N) is the alignment of those who prefer to steer clear of moral questions and don't take sides, doing what seems best at the time. Lizardfolk, most druids, and many humans are neutral.",
      index: 'neutral',
      abbreviation: 'N'
    },
    age: 26,
    traits: [
      {
        name: 'Darkvision',
        index: 'darkvision'
      },
      {
        index: 'savage-attacks',
        name: 'Savage Attacks'
      },
      {
        name: 'Relentless Endurance',
        index: 'relentless-endurance'
      },
      {
        index: 'menacing',
        name: 'Menacing'
      }
    ],
    subclass: {
      name: 'Hunter',
      index: 'hunter'
    },
    languages: [
      {
        type: 'race',
        name: 'Common',
        index: 'common'
      },
      {
        index: 'orc',
        name: 'Orc',
        type: 'race'
      }
    ],
    sex: {
      name: 'Female',
      index: 'F'
    },
    armorClass: 13,
    class: {
      index: 'ranger',
      name: 'Ranger'
    },
    race: {
      name: 'Half-orc',
      index: 'half-orc'
    },
    skills: [
      {
        index: 'skill-animal-handling',
        name: 'Skill: Animal Handling',
        type: 'class'
      },
      {
        name: 'Skill: Nature',
        index: 'skill-nature',
        type: 'class'
      },
      {
        index: 'skill-survival',
        type: 'class',
        name: 'Skill: Survival'
      },
      {
        name: 'Skill: Intimidation',
        index: 'skill-intimidation',
        type: 'race'
      }
    ],
    proficiencyBonus: 2,
    abilityScores: {
      str: {
        score: 17,
        index: 'str',
        modifier: 3,
        name: 'STR',
        full_name: 'Strength'
      },
      int: {
        full_name: 'Intelligence',
        modifier: 3,
        index: 'int',
        name: 'INT',
        score: 16
      },
      dex: {
        modifier: 2,
        name: 'DEX',
        full_name: 'Dexterity',
        score: 14,
        index: 'dex'
      },
      con: {
        index: 'con',
        modifier: 0,
        score: 11,
        full_name: 'Constitution',
        name: 'CON'
      },
      cha: {
        full_name: 'Charisma',
        modifier: 2,
        name: 'CHA',
        score: 15,
        index: 'cha'
      },
      wis: {
        name: 'WIS',
        modifier: 2,
        score: 15,
        index: 'wis',
        full_name: 'Wisdom'
      }
    },
    size_description:
      'Half-orcs are somewhat larger and bulkier than humans, and they range from 5 to well over 6 feet tall. Your size is Medium.',
    hit_die: 10,
    background: {
      name: 'Custom',
      index: 'custom'
    },
    equipments: [
      {
        type: 'class',
        index: 'leather-armor',
        name: 'Leather Armor',
        count: 1
      },
      {
        index: 'handaxe',
        name: 'Handaxe',
        type: 'class'
      },
      {
        name: 'Light hammer',
        type: 'class',
        index: 'light-hammer'
      },
      {
        type: 'class',
        count: 1,
        name: "Explorer's Pack",
        index: 'explorers-pack'
      },
      {
        name: 'Longbow',
        type: 'class',
        index: 'longbow'
      },
      {
        index: 'arrow',
        type: 'class',
        name: 'Arrow'
      }
    ],
    features: [
      {
        index: 'favored-enemy-1-type',
        name: 'Favored Enemy (1 type)'
      },
      {
        index: 'natural-explorer-1-terrain-type',
        expertises: [
          {
            index: 'terrain-3',
            name: 'forest'
          }
        ],
        name: 'Natural Explorer (1 terrain type)'
      }
    ]
  },
  {
    skills: [
      {
        type: 'class',
        index: 'skill-stealth',
        name: 'Skill: Stealth'
      },
      {
        type: 'class',
        index: 'skill-sleight-of-hand',
        name: 'Skill: Sleight of Hand'
      },
      {
        name: 'Skill: Acrobatics',
        index: 'skill-acrobatics',
        type: 'class'
      },
      {
        type: 'class',
        name: 'Skill: Deception',
        index: 'skill-deception'
      }
    ],
    hit_points: 11,
    hit_die: 8,
    size_description:
      'Halflings average about 3 feet tall and weigh about 40 pounds. Your size is Small.',
    size: 'Small',
    proficiencies: [
      {
        name: 'Light Armor',
        index: 'light-armor',
        type: 'class'
      },
      {
        name: 'Simple Weapons',
        type: 'class',
        index: 'simple-weapons'
      },
      {
        name: 'Longswords',
        index: 'longswords',
        type: 'class'
      },
      {
        name: 'Rapiers',
        index: 'rapiers',
        type: 'class'
      },
      {
        index: 'shortswords',
        name: 'Shortswords',
        type: 'class'
      },
      {
        name: 'Hand crossbows',
        type: 'class',
        index: 'hand-crossbows'
      },
      {
        type: 'class',
        index: 'thieves-tools',
        name: "Thieves' Tools"
      }
    ],
    traits: [
      {
        index: 'brave',
        name: 'Brave'
      },
      {
        name: 'Halfling Nimbleness',
        index: 'halfling-nimbleness'
      },
      {
        index: 'lucky',
        name: 'Lucky'
      },
      {
        index: 'naturally-stealthy',
        name: 'Naturally Stealthy'
      }
    ],
    age: 36,
    languages: [
      {
        name: 'Common',
        index: 'common',
        type: 'race'
      },
      {
        index: 'halfling',
        type: 'race',
        name: 'Halfling'
      }
    ],
    class: {
      name: 'Rogue',
      index: 'rogue'
    },
    proficiencyBonus: 2,
    alignment: {
      desc: 'Chaotic good (CG) creatures act as their conscience directs, with little regard for what others expect. Copper dragons, many elves, and unicorns are chaotic good.',
      index: 'chaotic-good',
      name: 'Chaotic Good',
      abbreviation: 'CG'
    },
    background: {
      name: 'Custom',
      index: 'custom'
    },
    saving_throws: [
      {
        name: 'DEX',
        index: 'dex'
      },
      {
        name: 'INT',
        index: 'int'
      }
    ],
    subrace: {
      index: 'lightfoot-halfling',
      name: 'Lightfoot Halfling'
    },
    sex: {
      index: 'M',
      name: 'Male'
    },
    race: {
      index: 'halfling',
      name: 'Halfling'
    },
    subclass: {
      index: 'thief',
      name: 'Thief'
    },
    equipments: [
      {
        type: 'class',
        name: 'Rapier',
        count: 1,
        index: 'rapier'
      },
      {
        index: 'shortbow',
        name: 'Shortbow',
        count: 1,
        type: 'class'
      },
      {
        name: 'Arrow',
        count: 20,
        index: 'arrow',
        type: 'class'
      },
      {
        count: 1,
        type: 'class',
        name: "Burglar's Pack",
        index: 'burglars-pack'
      },
      {
        name: 'Leather Armor',
        index: 'leather-armor',
        type: 'class'
      },
      {
        type: 'class',
        name: 'Dagger',
        index: 'dagger'
      },
      {
        type: 'class',
        index: 'thieves-tools',
        name: "Thieves' Tools"
      }
    ],
    armorClass: 12,
    features: [
      {
        name: 'Expertise',
        index: 'rogue-expertise-1',
        expertises: [
          {
            name: 'Skill: Sleight of Hand',
            index: 'skill-sleight-of-hand'
          },
          {
            name: "Thieves' Tools",
            index: 'thieves-tools'
          }
        ]
      },
      {
        name: 'Sneak Attack',
        index: 'sneak-attack'
      },
      {
        index: 'thieves-cant',
        name: "Thieves' Cant"
      }
    ],
    abilityScores: {
      cha: {
        modifier: 1,
        full_name: 'Charisma',
        score: 12,
        name: 'CHA',
        index: 'cha'
      },
      wis: {
        modifier: 1,
        score: 12,
        name: 'WIS',
        index: 'wis',
        full_name: 'Wisdom'
      },
      int: {
        full_name: 'Intelligence',
        index: 'int',
        modifier: 3,
        name: 'INT',
        score: 16
      },
      str: {
        full_name: 'Strength',
        score: 16,
        name: 'STR',
        modifier: 3,
        index: 'str'
      },
      con: {
        name: 'CON',
        modifier: 3,
        full_name: 'Constitution',
        score: 17,
        index: 'con'
      },
      dex: {
        name: 'DEX',
        modifier: 1,
        score: 13,
        index: 'dex',
        full_name: 'Dexterity'
      }
    },
    abilities: [
      {
        ability_score: {
          name: 'DEX',
          index: 'dex'
        },
        bonus: 2
      },
      {
        ability_score: {
          index: 'cha',
          name: 'CHA'
        },
        bonus: 1
      }
    ],
    speed: 25,
    name: 'Ronald',
    id: 'vtE1NXYMHd7u8F9MxOci'
  },
  {
    id: 'yaLImoP0qkSQ0bTYfOa6',
    saving_throws: [
      {
        name: 'CON',
        index: 'con'
      },
      {
        index: 'cha',
        name: 'CHA'
      }
    ],
    skills: [
      {
        index: 'skill-arcana',
        type: 'class',
        name: 'Skill: Arcana'
      },
      {
        type: 'class',
        index: 'skill-deception',
        name: 'Skill: Deception'
      }
    ],
    proficiencyBonus: 2,
    subclass: {
      index: 'draconic',
      name: 'Draconic'
    },
    abilityScores: {
      wis: {
        score: 17,
        name: 'WIS',
        full_name: 'Wisdom',
        index: 'wis',
        modifier: 3
      },
      con: {
        name: 'CON',
        score: 16,
        index: 'con',
        modifier: 3,
        full_name: 'Constitution'
      },
      int: {
        index: 'int',
        full_name: 'Intelligence',
        score: 12,
        modifier: 1,
        name: 'INT'
      },
      cha: {
        score: 17,
        name: 'CHA',
        modifier: 3,
        index: 'cha',
        full_name: 'Charisma'
      },
      str: {
        index: 'str',
        score: 10,
        name: 'STR',
        modifier: 0,
        full_name: 'Strength'
      },
      dex: {
        name: 'DEX',
        score: 17,
        modifier: 3,
        index: 'dex',
        full_name: 'Dexterity'
      }
    },
    name: 'Sarah',
    age: 48,
    class: {
      index: 'sorcerer',
      name: 'Sorcerer'
    },
    features: [
      {
        index: 'spellcasting-sorcerer',
        name: 'Spellcasting: Sorcerer'
      },
      {
        name: 'Sorcerous Origin',
        index: 'sorcerous-origin'
      },
      {
        index: 'dragon-ancestor',
        subfeatures: [
          {
            index: 'dragon-ancestor-red---fire-damage',
            name: 'Dragon Ancestor: Red - Fire Damage'
          }
        ],
        name: 'Dragon Ancestor'
      },
      {
        name: 'Draconic Resilience',
        index: 'draconic-resilience'
      }
    ],
    abilities: [
      {
        bonus: 2,
        ability_score: {
          index: 'dex',
          name: 'DEX'
        }
      },
      {
        ability_score: {
          index: 'con',
          name: 'CON'
        },
        bonus: 1
      }
    ],
    race: {
      name: 'Halfling',
      index: 'halfling'
    },
    subrace: {
      index: 'stout-halfling',
      name: 'Stout Halfling'
    },
    languages: [
      {
        name: 'Common',
        type: 'race',
        index: 'common'
      },
      {
        index: 'halfling',
        name: 'Halfling',
        type: 'race'
      }
    ],
    traits: [
      {
        name: 'Brave',
        index: 'brave'
      },
      {
        name: 'Halfling Nimbleness',
        index: 'halfling-nimbleness'
      },
      {
        name: 'Lucky',
        index: 'lucky'
      },
      {
        name: 'Naturally Stealthy',
        index: 'naturally-stealthy'
      }
    ],
    hit_die: 6,
    sex: {
      index: 'F',
      name: 'Female'
    },
    armorClass: 16,
    background: {
      index: 'custom',
      name: 'Custom'
    },
    size_description:
      'Halflings average about 3 feet tall and weigh about 40 pounds. Your size is Small.',
    speed: 25,
    size: 'Small',
    hit_points: 10,
    equipments: [
      {
        index: 'sickle',
        name: 'Sickle',
        type: 'class'
      },
      {
        type: 'class',
        index: 'component-pouch',
        name: 'Component pouch',
        count: 1
      },
      {
        index: 'explorers-pack',
        type: 'class',
        count: 1,
        name: "Explorer's Pack"
      },
      {
        type: 'class',
        index: 'dagger',
        name: 'Dagger'
      }
    ],
    alignment: {
      desc: 'Neutral evil (NE) is the alignment of those who do whatever they can get away with, without compassion or qualms. Many drow, some cloud giants, and goblins are neutral evil.',
      name: 'Neutral Evil',
      index: 'neutral-evil',
      abbreviation: 'NE'
    },
    proficiencies: [
      {
        index: 'daggers',
        name: 'Daggers',
        type: 'class'
      },
      {
        type: 'class',
        name: 'Darts',
        index: 'darts'
      },
      {
        type: 'class',
        name: 'Slings',
        index: 'slings'
      },
      {
        index: 'quarterstaffs',
        name: 'Quarterstaffs',
        type: 'class'
      },
      {
        type: 'class',
        index: 'crossbows-light',
        name: 'Crossbows, light'
      },
      {
        name: 'Stout Resilience',
        index: 'stout-resilience',
        type: 'race'
      }
    ]
  }
] as unknown[] as Character[];
