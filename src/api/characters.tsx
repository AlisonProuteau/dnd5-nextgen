import type { Subrace } from '../representations/character/race.representation';

export const subraces: { index: string; data: Subrace[] }[] = [
  {
    index: 'dwarf',
    data: [
      {
        race: { index: 'dwarf', name: 'Dwarf' },
        index: 'hill-dwarf',
        name: 'Hill Dwarf',
        desc: 'As a hill dwarf, you have keen senses, deep intuition, and remarkable resilience.',
        ability_bonuses: [{ ability_score: { index: 'wis', name: 'WIS' }, bonus: 1 }],
        racial_traits: [
          {
            index: 'dwarven-toughness',
            name: 'Dwarven Toughness'
          }
        ]
      },
      {
        race: { index: 'dwarf', name: 'Dwarf' },
        index: 'mountain-dwarf',
        name: 'Mountain Dwarf',
        desc: 'As a mountain dwarf, you’re strong and hardy, accustomed to a difficult life in rugged terrain. ',
        ability_bonuses: [{ ability_score: { index: 'str', name: 'STR' }, bonus: 2 }],
        racial_traits: []
      }
    ]
  },
  {
    index: 'elf',
    data: [
      {
        race: { index: 'elf', name: 'Elf' },
        index: 'high-elf',
        name: 'High Elf',
        desc: 'As a high elf, you have a keen mind and a mastery of at least the basics of magic. In many fantasy gaming worlds, there are two kinds of high elves. One type is haughty and reclusive, believing themselves to be superior to non-elves and even other elves. The other type is more common and more friendly, and often encountered among humans and other races.',
        ability_bonuses: [
          {
            ability_score: {
              index: 'int',
              name: 'INT'
            },
            bonus: 1
          }
        ],
        starting_proficiencies: [
          {
            index: 'longswords',
            name: 'Longswords'
          },
          {
            index: 'shortswords',
            name: 'Shortswords'
          },
          {
            index: 'shortbows',
            name: 'Shortbows'
          },
          {
            index: 'longbows',
            name: 'Longbows'
          }
        ],
        language_options: {
          choose: 1,
          desc: '',
          from: {
            option_set_type: 'options_array',
            options: [
              {
                option_type: 'reference',
                item: {
                  index: 'dwarvish',
                  name: 'Dwarvish'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'giant',
                  name: 'Giant'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'gnomish',
                  name: 'Gnomish'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'goblin',
                  name: 'Goblin'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'halfling',
                  name: 'Halfling'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'orc',
                  name: 'Orc'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'abyssal',
                  name: 'Abyssal'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'celestial',
                  name: 'Celestial'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'draconic',
                  name: 'Draconic'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'deep-speech',
                  name: 'Deep Speech'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'infernal',
                  name: 'Infernal'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'primordial',
                  name: 'Primordial'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'sylvan',
                  name: 'Sylvan'
                }
              },
              {
                option_type: 'reference',
                item: {
                  index: 'undercommon',
                  name: 'Undercommon'
                }
              }
            ]
          },
          type: 'language'
        },
        racial_traits: [
          {
            index: 'elf-weapon-training',
            name: 'Elf Weapon Training'
          },
          {
            index: 'high-elf-cantrip',
            name: 'High Elf Cantrip'
          },
          {
            index: 'extra-language',
            name: 'Extra Language'
          }
        ]
      },
      {
        race: { index: 'elf', name: 'Elf' },
        index: 'wood-elf',
        name: 'Wood Elf',
        desc: 'As a wood elf, you have keen senses and intuition, and your fleet feet carry you quickly and stealthily through your native forests. ',
        ability_bonuses: [{ ability_score: { index: 'wis', name: 'WIS' }, bonus: 1 }],
        speed: 35,
        starting_proficiencies: [
          { index: 'longsword', name: 'Longsword' },
          { index: 'shortsword', name: 'Shortsword' },
          { index: 'shortbow', name: 'Shortbow' },
          { index: 'longbow', name: 'Longbow' }
        ],
        racial_traits: [{ index: 'mask-of-the-wild', name: 'Mask of the Wild' }]
      }
    ]
  },
  {
    index: 'gnome',
    data: [
      {
        race: { index: 'gnome', name: 'gnome' },
        index: 'rock-gnome',
        name: 'Rock Gnome',
        desc: 'As a rock gnome, you have a natural inventiveness and hardiness beyond that of other gnomes.',
        ability_bonuses: [
          {
            ability_score: {
              index: 'con',
              name: 'CON'
            },
            bonus: 1
          }
        ],
        starting_proficiencies: [
          {
            index: 'tinkers-tools',
            name: "Tinker's Tools"
          }
        ],
        racial_traits: [
          {
            index: 'artificers-lore',
            name: "Artificer's Lore"
          },
          {
            index: 'tinker',
            name: 'Tinker'
          }
        ]
      }
    ]
  },
  {
    index: 'halfling',
    data: [
      {
        race: { index: 'halfling', name: 'Halfling' },
        index: 'lightfoot-halfling',
        name: 'Lightfoot Halfling',

        desc: "As a lightfoot halfling, you can easily hide from notice, even using other people as cover. You're inclined to be affable and get along well with others. Lightfoots are more prone to wanderlust than other halflings, and often dwell alongside other races or take up a nomadic life.",
        ability_bonuses: [
          {
            ability_score: {
              index: 'cha',
              name: 'CHA'
            },
            bonus: 1
          }
        ],
        starting_proficiencies: [],
        racial_traits: [
          {
            index: 'naturally-stealthy',
            name: 'Naturally Stealthy'
          }
        ]
      },
      {
        race: { index: 'halfling', name: 'Halfling' },
        index: 'stout-halfling',
        name: 'Stout Halfling',

        desc: 'As a stout halfling, you’re hardier than average and have some resistance to poison. Some say that stouts have dwarven blood. In the Forgotten Realms, these halflings are called stronghearts, and they’re most common in the south.',
        ability_bonuses: [
          {
            ability_score: {
              index: 'con',
              name: 'CON'
            },
            bonus: 1
          }
        ],
        starting_proficiencies: [{ index: 'stout-resilience', name: 'Stout Resilience' }],
        racial_traits: [
          {
            index: 'naturally-stealthy',
            name: 'Naturally Stealthy'
          }
        ]
      }
    ]
  }
  // TODO: Add Tiefling Variants later
  // {
  //   index: 'tiefling',
  //   data: [
  //     { index: 'infernal-legacy', name: 'Infernal Legacy' },
  //     { index: 'variant-winged', name: 'Variant: Winged' }
  //   ]
  // }
];
