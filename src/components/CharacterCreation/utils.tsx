import { CancelOutlined, CheckCircleOutline } from '@mui/icons-material';
import { Box, Chip, List, ListItem, ListItemIcon, Typography } from '@mui/material';
import { DefaultRepresentation } from '@representations/common.representation';

export interface GuideType {
  index: string;
  name: string;
  playstyle: string;
  pros: string[];
  cons: string[];
  bestFor: { instances: DefaultRepresentation[]; reason: string }[];
}

// TODO: Move somewhere either file or firestore
export const RaceGuide: (GuideType & { subraces?: Omit<GuideType, 'cons'>[] })[] = [
  {
    index: 'dragonborn',
    name: 'Dragonborn',
    playstyle:
      "A good choice for characters who are the 'bruiser' of the party. The Dragonborn is a tough and honorable race, with a deep connection to their draconic heritage. They are often feared or misunderstood by others.",
    pros: [
      'A powerful Breath Weapon that can hit multiple enemies.',
      'Natural resistance to a specific type of damage (acid, cold, fire, lightning, or poison).'
    ],
    cons: [
      'Limited in features outside of combat. Heavily reliant on class abilities for versatility.'
    ],
    bestFor: [
      {
        instances: [
          {
            name: 'Barbarian',
            index: 'barbarian'
          },
          {
            name: 'Fighter',
            index: 'fighter'
          }
        ],
        reason:
          'Their natural strength bonus and resistance to a damage type make them ideal frontline combatants.'
      },
      {
        instances: [
          {
            name: 'Paladin',
            index: 'paladin'
          }
        ],
        reason:
          "Their strength bonus pairs well with the class, and their honorable nature fits the Paladin's code."
      },
      {
        instances: [
          {
            name: 'Sorcerer',
            index: 'sorcerer'
          }
        ],
        reason:
          'Their charisma bonus makes them natural spellcasters, and the draconic heritage theme fits perfectly with the Draconic Bloodline subclass.'
      }
    ]
  },
  {
    index: 'dwarf',
    name: 'Dwarf',
    playstyle:
      "A stalwart and resilient race, known for their skill in smithing and their love of gold. Ideal for characters who can act as a 'tank' or absorb a lot of damage.",
    pros: [
      'Natural resistance to poison.',
      'Proficient with certain weapons and armor.',
      'Bonuses to Constitution.'
    ],
    cons: ['Slower than other races, with a base speed of 25 feet.'],
    bestFor: [
      {
        instances: [
          {
            name: 'Cleric',
            index: 'cleric'
          },
          {
            name: 'Fighter',
            index: 'fighter'
          },
          {
            name: 'Barbarian',
            index: 'barbarian'
          },
          {
            name: 'Paladin',
            index: 'paladin'
          }
        ],
        reason:
          'Their natural toughness and resilience make them great front-line combatants, and their subraces offer specific boosts to make them even better.'
      }
    ],
    subraces: [
      {
        index: 'hill-dwarf',
        name: 'Hill Dwarf',
        playstyle:
          'A sturdy and defensive character who excels at outlasting their foes and shrugging off damage.',
        pros: ['Bonus to Wisdom and an extra hit point per level.'],
        bestFor: [
          {
            instances: [
              {
                name: 'Cleric',
                index: 'cleric'
              }
            ],
            reason: 'Wisdom bonus is essential.'
          },
          {
            instances: [
              {
                name: 'Fighter',
                index: 'fighter'
              }
            ],
            reason: 'Extra hit points make them even tougher.'
          }
        ]
      },
      {
        index: 'mountain-dwarf',
        name: 'Mountain Dwarf',
        playstyle: 'A heavily armed and armored warrior, born for the front lines of combat.',
        pros: ['Bonus to Strength and proficiency in light and medium armor.'],
        bestFor: [
          {
            instances: [
              {
                name: 'Barbarian',
                index: 'barbarian'
              },
              {
                name: 'Fighter',
                index: 'fighter'
              },
              {
                name: 'Paladin',
                index: 'paladin'
              }
            ],
            reason: 'Strength bonus and armor proficiency are key for these melee classes.'
          }
        ]
      }
    ]
  },
  {
    index: 'elf',
    name: 'Elf',
    playstyle:
      'An agile and graceful race, known for their long lifespans and connection to nature. A great choice for characters that are quick, intelligent, and perceptive.',
    pros: [
      'Bonus to Dexterity.',
      'Advantage on saving throws against being charmed.',
      'Immune to magical sleep.',
      'Darkvision.'
    ],
    cons: ['Some subraces have vulnerabilities.'],
    bestFor: [
      {
        instances: [
          {
            name: 'Wizard',
            index: 'wizard'
          },
          {
            name: 'Rogue',
            index: 'rogue'
          },
          {
            name: 'Ranger',
            index: 'ranger'
          },
          {
            name: 'Druid',
            index: 'druid'
          }
        ],
        reason: 'Elves are a good fit for these classes due to their natural agility and intellect.'
      }
    ],
    subraces: [
      {
        index: 'high-elf',
        name: 'High Elf',
        playstyle: 'A versatile spellcaster or agile swordsman, combining intellect with grace.',
        pros: ['Bonus to Intelligence.', 'Learns a bonus wizard cantrip.'],
        bestFor: [
          {
            instances: [
              {
                name: 'Wizard',
                index: 'wizard'
              }
            ],
            reason: 'Intelligence is their main spellcasting ability.'
          },
          {
            instances: [
              {
                name: 'Rogue',
                index: 'rogue'
              }
            ],
            reason: 'The cantrip can be a useful tool.'
          }
        ]
      },
      {
        index: 'wood-elf',
        name: 'Wood Elf',
        playstyle: 'A swift and elusive archer, blending seamlessly with the wilderness.',
        pros: [
          'Bonus to Wisdom.',
          'Faster base speed (35 feet).',
          'Can hide in light natural obscurement.'
        ],
        bestFor: [
          {
            instances: [
              {
                name: 'Ranger',
                index: 'ranger'
              },
              {
                name: 'Druid',
                index: 'druid'
              }
            ],
            reason: 'Wisdom bonus is key, and their connection to nature fits the theme.'
          }
        ]
      }
    ]
  },
  {
    index: 'gnome',
    name: 'Gnome',
    playstyle:
      'A curious and inventive race, known for their love of illusions and tinkering. A good choice for characters who are small, quick, and intelligent problem-solvers.',
    pros: [
      'Bonus to Intelligence.',
      'Advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.',
      'Darkvision.'
    ],
    cons: ['Small size, with a base speed of 25 feet.'],
    bestFor: [
      {
        instances: [
          {
            name: 'Druid',
            index: 'druid'
          },
          {
            name: 'Ranger',
            index: 'ranger'
          },
          {
            name: 'Wizard',
            index: 'wizard'
          }
        ],
        reason:
          'Gnomes are a good fit for these classes due to their Intelligence bonus and other useful features.'
      }
    ],
    subraces: [
      {
        index: 'forest-gnome',
        name: 'Forest Gnome',
        playstyle:
          'A mischievous and secretive character who uses illusions to trick their enemies.',
        pros: ['Bonus to Dexterity.', 'Can speak with small animals and cast a minor illusion.'],
        bestFor: [
          {
            instances: [
              {
                name: 'Druid',
                index: 'druid'
              }
            ],
            reason: 'Dexterity and talking to animals are great features.'
          },
          {
            instances: [
              {
                name: 'Ranger',
                index: 'ranger'
              }
            ],
            reason: 'Dexterity bonus is key for ranged weapons.'
          }
        ]
      },
      {
        index: 'rock-gnome',
        name: 'Rock Gnome',
        playstyle:
          'A creative inventor and builder, finding solutions through mechanical ingenuity.',
        pros: ['Bonus to Constitution.', 'Can tinker with small mechanical devices.'],
        bestFor: [
          {
            instances: [
              {
                name: 'Wizard',
                index: 'wizard'
              }
            ],
            reason: 'Intelligence is their main ability score, and their tinkering fits the theme.'
          }
        ]
      }
    ]
  },
  {
    index: 'half-elf',
    name: 'Half-Elf',
    playstyle:
      'A versatile and adaptable race, torn between the worlds of Elves and Humans. A great choice for characters that can fit into any party and excel in many different roles.',
    pros: [
      'Bonus to Charisma.',
      'Can increase two other ability scores of choice.',
      'Darkvision.',
      'Proficiency in two skills of choice.'
    ],
    cons: ["Lacks a specific racial 'niche' compared to other races."],
    bestFor: [
      {
        instances: [
          {
            name: 'Bard',
            index: 'bard'
          },
          {
            name: 'Sorcerer',
            index: 'sorcerer'
          },
          {
            name: 'Warlock',
            index: 'warlock'
          }
        ],
        reason: 'Their Charisma bonus is essential for these classes.'
      },
      {
        instances: [
          {
            name: 'Rogue',
            index: 'rogue'
          }
        ],
        reason:
          'The bonus to Dexterity and a second ability score, along with two free skill proficiencies, makes them incredibly versatile.'
      }
    ]
  },
  {
    index: 'halfling',
    name: 'Halfling',
    playstyle:
      'A cheerful and lucky race, known for their love of good food and comfortable homes. A good choice for characters that are small, quick, and can avoid danger.',
    pros: [
      'Bonus to Dexterity.',
      'Advantage on saving throws against being frightened.',
      'Can re-roll a 1 on an attack, ability check, or saving throw.',
      'Can move through the space of larger creatures.'
    ],
    cons: ['Small size, with a base speed of 25 feet.'],
    bestFor: [
      {
        instances: [
          {
            name: 'Rogue',
            index: 'rogue'
          },
          {
            name: 'Bard',
            index: 'bard'
          },
          {
            name: 'Fighter',
            index: 'fighter'
          },
          {
            name: 'Barbarian',
            index: 'barbarian'
          }
        ],
        reason:
          'Halflings are a good fit for these classes due to their Dexterity bonus and their natural luck and agility.'
      }
    ],
    subraces: [
      {
        index: 'lightfoot-halfling',
        name: 'Lightfoot Halfling',
        playstyle: 'A charismatic and lucky scoundrel who can easily blend into the background.',
        pros: ['Bonus to Charisma.', 'Can hide behind larger creatures.'],
        bestFor: [
          {
            instances: [
              {
                name: 'Rogue',
                index: 'rogue'
              }
            ],
            reason: 'Dexterity bonus and the ability to hide are key for stealth.'
          },
          {
            instances: [
              {
                name: 'Bard',
                index: 'bard'
              }
            ],
            reason: 'Dexterity and Charisma bonuses are great for these classes.'
          }
        ]
      },
      {
        index: 'stout-halfling',
        name: 'Stout Halfling',
        playstyle: 'An incredibly durable adventurer who can absorb punishment and resist poison.',
        pros: ['Bonus to Constitution.', 'Natural resistance to poison.'],
        bestFor: [
          {
            instances: [
              {
                name: 'Fighter',
                index: 'fighter'
              },
              {
                name: 'Barbarian',
                index: 'barbarian'
              }
            ],
            reason:
              'The Constitution bonus makes them surprisingly durable, compensating for their small size.'
          }
        ]
      }
    ]
  },
  {
    index: 'half-orc',
    name: 'Half-Orc',
    playstyle:
      'A formidable and passionate race, often feared and misunderstood by others. A good choice for characters that are powerhouses in combat and can take a lot of punishment.',
    pros: [
      'Bonus to Strength and Constitution.',
      'Proficient in Intimidation.',
      "'Savage Attacks' feature adds extra damage on a critical hit.",
      'Relentless Endurance allows them to drop to 1 hit point instead of 0 once per long rest.'
    ],
    cons: ['Fewer features that assist with roleplaying or utility outside of combat.'],
    bestFor: [
      {
        instances: [
          {
            name: 'Barbarian',
            index: 'barbarian'
          },
          {
            name: 'Fighter',
            index: 'fighter'
          },
          {
            name: 'Paladin',
            index: 'paladin'
          }
        ],
        reason:
          'All of these classes benefit greatly from the Strength and Constitution bonuses and features that increase durability and damage.'
      }
    ]
  },
  {
    index: 'human',
    name: 'Human',
    playstyle:
      'The most versatile and adaptable race, known for their ambition and ability to succeed in any field. A great choice for characters that can be a jack-of-all-trades and can fit into any party.',
    pros: [
      'Bonus to every single ability score.',
      'The variant human option offers a bonus to two ability scores, a skill proficiency, and a feat at level 1, allowing for powerful character builds.'
    ],
    cons: ['Lacks special senses like Darkvision and does not have any natural resistances.'],
    bestFor: [
      {
        instances: [
          {
            name: 'Any class',
            index: 'any'
          }
        ],
        reason:
          'The variant human is a fantastic choice for any class that relies on a specific feat to be effective early in the game.'
      }
    ]
  },
  {
    index: 'tiefling',
    name: 'Tiefling',
    playstyle:
      'A charismatic and often misunderstood race, with a deep connection to their infernal heritage. A good choice for characters that are both powerful and mysterious.',
    pros: [
      'Bonus to Charisma and Intelligence.',
      'Natural resistance to fire damage.',
      'Learns a few spells as they level up.'
    ],
    cons: ['Often viewed with suspicion and fear, which can complicate social interactions.'],
    bestFor: [
      {
        instances: [
          {
            name: 'Bard',
            index: 'bard'
          },
          {
            name: 'Sorcerer',
            index: 'sorcerer'
          },
          {
            name: 'Warlock',
            index: 'warlock'
          }
        ],
        reason:
          "These classes rely heavily on Charisma, and the Tiefling's racial spells and resistance provide a great starting point."
      }
    ]
  }
];

export const ClassGuide: (GuideType & {
  evolution: string;
  subclasses: (Omit<GuideType, 'pros' | 'cons'> & { evolution: string })[];
})[] = [
  {
    index: 'barbarian',
    name: 'Barbarian',
    playstyle:
      'A brutal and unarmored warrior who can fly into a frenzied Rage to deal massive damage and withstand punishment.',
    pros: [
      'Extraordinarily durable due to high hit points and damage resistance while Raging.',
      'Excellent at dealing consistent melee damage.'
    ],
    cons: [
      'Relies heavily on Strength and Constitution, making them a one-dimensional character.',
      'Limited utility outside of combat, as their features are almost entirely combat-focused.'
    ],
    evolution:
      'The Barbarian starts as a simple, rage-fueled melee attacker. Their evolution is a story of growing in physical might and resilience. They become a hard-to-kill tank who can absorb incredible amounts of damage. By high levels, they are a literal champion of primal fury, able to turn every blow into a devastating critical hit and gaining a boost to their core physical stats, making them a true force of nature on the battlefield.',
    bestFor: [
      {
        instances: [
          {
            name: 'Half-Orc',
            index: 'half-orc'
          },
          {
            name: 'Dwarf',
            index: 'dwarf'
          }
        ],
        reason:
          "These races provide crucial bonuses to Strength and Constitution, enhancing the Barbarian's core abilities."
      },
      {
        instances: [
          {
            name: 'Dragonborn',
            index: 'dragonborn'
          },
          {
            name: 'Human',
            index: 'human'
          }
        ],
        reason:
          "The Dragonborn's resistance to a damage type and the Human's versatility both pair well with the Barbarian's front-line role."
      }
    ],
    subclasses: [
      {
        index: 'berserker',
        name: 'Path of the Berserker',
        playstyle:
          'A pure damage dealer that throws caution to the wind in their pursuit of ultimate power, often at a physical cost.',

        bestFor: [
          {
            instances: [
              {
                name: 'Half-Orc',
                index: 'half-orc'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              "Both races offer Strength bonuses, and the Human's versatility allows for a specific feat to maximize damage."
          }
        ],
        evolution:
          'This path is a relentless pursuit of pure damage. It begins with the ability to enter a risky frenzy for an extra attack. As they evolve, they become more resistant to mental effects and can use their terrifying presence to frighten enemies. At their peak, they can retaliate against any foe that dares to strike them, making them a living engine of combat.'
      }
    ]
  },
  {
    index: 'bard',
    name: 'Bard',
    playstyle:
      'A jack-of-all-trades who weaves magic and music to inspire allies and confuse enemies, excelling in almost any situation.',
    pros: [
      'Incredibly versatile with access to healing, support, damage, and control spells.',
      "Gains 'Jack of All Trades', allowing them to add half their proficiency bonus to any skill check they are not proficient in."
    ],
    cons: ["Not the best at any single role; their abilities are a 'mile wide and an inch deep'."],
    evolution:
      "The Bard starts as a charismatic support caster, using their inspiration to boost allies' rolls. They quickly evolve into a master of skills and a musical utility caster, able to contribute in any situation. By high levels, they become a magical powerhouse, able to learn spells from any class, making them one of the most versatile and powerful casters in the game.",
    bestFor: [
      {
        instances: [
          {
            name: 'Half-Elf',
            index: 'half-elf'
          },
          {
            name: 'Tiefling',
            index: 'tiefling'
          }
        ],
        reason: 'Their bonuses to Charisma make them natural leaders and spellcasters.'
      },
      {
        instances: [
          {
            name: 'Human',
            index: 'human'
          },
          {
            name: 'Lightfoot Halfling',
            index: 'lightfoot-halfling'
          }
        ],
        reason:
          "The Human's versatility and the Halfling's natural luck and Dexterity provide a strong foundation for any Bard build."
      }
    ],
    subclasses: [
      {
        index: 'lore',
        name: 'College of Lore',
        playstyle:
          'A knowledge-focused spellcaster who learns a wide variety of spells from other classes to fill any magical need.',

        bestFor: [
          {
            instances: [
              {
                name: 'High Elf',
                index: 'high-elf'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              'Both races offer boosts to key stats for spellcasting and provide useful feats or cantrips.'
          }
        ],
        evolution:
          "This path doubles down on the Bard's support and spellcasting. It begins by granting the Bard more skill proficiencies and the ability to verbally hinder enemies. As it evolves, it becomes a powerful magic-user who can learn spells from any class, making them an incredibly versatile and powerful support character who can fill any magical need in the party."
      }
    ]
  },
  {
    index: 'cleric',
    name: 'Cleric',
    playstyle:
      'A holy warrior and divine spellcaster who serves a deity, wielding divine magic to protect allies and smite foes.',
    pros: [
      'Unparalleled healing abilities with a large pool of healing spells.',
      'Can wear heavy armor and shields, making them very durable.'
    ],
    cons: [
      'Not as proficient with weapons as martial classes, relying on magic for most of their damage.'
    ],
    evolution:
      "The Cleric starts as a devoted servant, wielding healing and light combat. Their core identity is defined early on by their chosen divine domain. As they progress, they become a versatile divine agent, able to channel their god's power to turn or destroy undead, and eventually, they can call on their deity for a direct, powerful intervention, becoming a true force of divine power.",
    bestFor: [
      {
        instances: [
          {
            name: 'Hill Dwarf',
            index: 'hill-dwarf'
          },
          {
            name: 'Human',
            index: 'human'
          }
        ],
        reason: 'Their bonus to Wisdom and durability make them excellent divine spellcasters.'
      },
      {
        instances: [
          {
            name: 'Dwarf',
            index: 'dwarf'
          },
          {
            name: 'Gnome',
            index: 'gnome'
          }
        ],
        reason:
          'Their bonuses to Constitution and Intelligence make them a durable and wise choice.'
      }
    ],
    subclasses: [
      {
        index: 'life',
        name: 'Life Domain',
        playstyle:
          'A dedicated healer who focuses on providing powerful, life-saving healing to their allies.',

        bestFor: [
          {
            instances: [
              {
                name: 'Hill Dwarf',
                index: 'hill-dwarf'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              "The Dwarf's extra hit points and the Human's versatility are great for a life-saving role."
          }
        ],
        evolution:
          'This path is a dedicated healer from the start, getting a bonus to all their healing spells. As they evolve, they become a powerful support character who can heal themselves while healing others and use their divine power to restore large pools of health to their allies, becoming an unstoppable force of life.'
      }
    ]
  },
  {
    index: 'druid',
    name: 'Druid',
    playstyle:
      'A protector of nature who draws power from the wild, communing with animals and shifting their shape to fight.',
    pros: [
      'Extremely versatile with access to healing, damage, and summoning spells.',
      "Can transform into a variety of animals using the 'Wild Shape' feature."
    ],
    cons: [
      'Can only wear non-metal armor, which limits their AC.',
      'Wild Shape can be weak at higher levels unless you choose the right subclass.'
    ],
    evolution:
      "The Druid starts with a strong connection to nature and a basic Wild Shape ability. Their evolution is defined by their chosen circle, which dictates their primary focus. They progress to become powerful nature casters who can control the battlefield with spells and, at the highest levels, master the art of Wild Shape to take on the forms of elementals and even cast spells while transformed, becoming a literal embodiment of nature's power.",
    bestFor: [
      {
        instances: [
          {
            name: 'Wood Elf',
            index: 'wood-elf'
          },
          {
            name: 'Human',
            index: 'human'
          }
        ],
        reason:
          'Their bonuses to Wisdom and dexterity make them natural spellcasters and survivors.'
      },
      {
        instances: [
          {
            name: 'Gnome',
            index: 'gnome'
          },
          {
            name: 'Elf',
            index: 'elf'
          }
        ],
        reason: 'Their connection to nature and innate senses make them a great fit.'
      }
    ],
    subclasses: [
      {
        index: 'land',
        name: 'Circle of the Land',
        playstyle:
          'A versatile spellcaster who draws power from a specific type of terrain to gain new spells and abilities.',

        bestFor: [
          {
            instances: [
              {
                name: 'High Elf',
                index: 'high-elf'
              },
              {
                name: 'Wood Elf',
                index: 'wood-elf'
              }
            ],
            reason:
              'These races provide bonuses to Wisdom and Intelligence, which are crucial for a spellcaster.'
          }
        ],
        evolution:
          "This path enhances the Druid's spellcasting. It starts with an extra cantrip and the ability to regain spell slots on a short rest. As they evolve, they become a versatile spellcaster who is hard to pin down and gains a broad range of powerful spells from their chosen terrain, making them a master of magical control."
      }
    ]
  },
  {
    index: 'fighter',
    name: 'Fighter',
    playstyle:
      'A master of martial combat who is proficient with all weapons and armor, and can use their skills to overcome any foe.',
    pros: [
      'Incredibly versatile with access to any weapon and armor type.',
      'Gains more Ability Score Improvements (ASIs) than any other class.'
    ],
    cons: ['Can be one-dimensional without a specific subclass.'],
    evolution:
      'The Fighter starts as a master of weapons and armor, defined by their fighting style. Their evolution is one of repetition and mastery, gaining more and more attacks in a single turn. They become a martial powerhouse with incredible durability and adaptability. By high levels, they can make an unprecedented number of attacks in a single turn, becoming a legendary combatant.',
    bestFor: [
      {
        instances: [
          {
            name: 'Human',
            index: 'human'
          },
          {
            name: 'Half-Orc',
            index: 'half-orc'
          },
          {
            name: 'Dwarf',
            index: 'dwarf'
          }
        ],
        reason:
          'Their natural bonuses to Strength, Dexterity, and Constitution make them a perfect fit.'
      }
    ],
    subclasses: [
      {
        index: 'champion',
        name: 'Champion',
        playstyle:
          'A straightforward and powerful warrior who is a master of simple, yet effective, combat techniques.',

        bestFor: [
          {
            instances: [
              {
                name: 'Half-Orc',
                index: 'half-orc'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              'Both races provide crucial bonuses to Strength and Constitution, which are crucial for this front-line role.'
          }
        ],
        evolution:
          'This path is a simple, effective evolution of the Fighter. It starts by improving their critical hit range, and they continue to improve it further as they level up. They become a durable, simple damage dealer who can shrug off damage and score a critical hit more often than any other class, making them a reliable and powerful force on the battlefield.'
      }
    ]
  },
  {
    index: 'monk',
    name: 'Monk',
    playstyle:
      'A nimble martial artist who forgoes weapons and armor to become a master of unarmored combat.',
    pros: [
      'Incredibly mobile and can move through the battlefield with ease.',
      "The 'Stunning Strike' feature allows them to stun enemies with a single hit."
    ],
    cons: [
      'Relies on a very specific set of stats (Dexterity, Wisdom, and Constitution), which can be difficult to manage.'
    ],
    evolution:
      'The Monk starts as a nimble, unarmored combatant. They quickly gain a pool of Ki points to perform special abilities. The class evolves into a master of stunning enemies and deflecting attacks, becoming an incredibly mobile and hard-to-hit martial artist. By high levels, they are a nearly untouchable force of speed and skill, able to become invisible and deal incredible damage.',
    bestFor: [
      {
        instances: [
          {
            name: 'Wood Elf',
            index: 'wood-elf'
          },
          {
            name: 'Human',
            index: 'human'
          }
        ],
        reason:
          'Their bonuses to Dexterity and Wisdom make them natural masters of the art of unarmored combat.'
      }
    ],
    subclasses: [
      {
        index: 'open-hand',
        name: 'Way of the Open Hand',
        playstyle:
          'A master of close-quarters combat who can use their abilities to push, trip, or stop enemies from taking reactions.',

        bestFor: [
          {
            instances: [
              {
                name: 'Wood Elf',
                index: 'wood-elf'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              'These races provide bonuses to Dexterity and Wisdom, which are crucial for this subclass.'
          }
        ],
        evolution:
          "This path enhances the core Monk's abilities. They gain special effects for their Flurry of Blows and the ability to heal themselves. They evolve into a Zen master who can instantly kill a foe with a single touch and are difficult to pin down, becoming an unstoppable force of martial arts."
      }
    ]
  },
  {
    index: 'paladin',
    name: 'Paladin',
    playstyle:
      "A holy warrior who fights for their deity's cause, using divine magic and a strong sense of justice to protect their allies and smite evil.",
    pros: [
      "Can deal massive amounts of damage with the 'Divine Smite' feature.",
      'Has access to powerful auras that protect their allies from harm.'
    ],
    cons: ['Requires a high Charisma and Strength score to be effective.'],
    evolution:
      'The Paladin starts as a holy warrior with healing and powerful smite abilities. Their evolution is defined by their sacred oath, gaining new features at key levels. They become a powerful aura-wielder who protects their allies and, at high levels, can manifest a powerful transformation to destroy their foes, becoming a true champion of their cause.',
    bestFor: [
      {
        instances: [
          {
            name: 'Dragonborn',
            index: 'dragonborn'
          },
          {
            name: 'Human',
            index: 'human'
          }
        ],
        reason: 'Their natural bonuses to Strength and Charisma make them ideal Paladins.'
      }
    ],
    subclasses: [
      {
        index: 'devotion',
        name: 'Oath of Devotion',
        playstyle:
          'A righteous hero who protects the innocent and upholds the highest moral standards.',

        bestFor: [
          {
            instances: [
              {
                name: 'Human',
                index: 'human'
              },
              {
                name: 'Dragonborn',
                index: 'dragonborn'
              }
            ],
            reason:
              "The Dragonborn's resistance to a damage type and the Human's versatility both pair well with this oath's defensive nature."
          }
        ],
        evolution:
          'This oath is a defensive and supportive path. It begins with the ability to turn undead and make their weapon holy. As they evolve, they become a protective leader whose presence charms and frightens foes, and they become immune to many mind-altering effects, becoming a true beacon of hope and a powerful protector.'
      }
    ]
  },
  {
    index: 'ranger',
    name: 'Ranger',
    playstyle:
      'A master of the wilderness who can track enemies and use their knowledge of the natural world to survive in any environment.',
    pros: [
      'Can be a versatile damage dealer, excelling at both ranged and melee combat.',
      'Gains a variety of utility spells that can be used to track and control the battlefield.'
    ],
    cons: [
      'Often seen as underpowered compared to other martial classes, as many of their core abilities are situational.'
    ],
    evolution:
      'The Ranger starts as a wilderness expert with a favored enemy and terrain. They gain spellcasting early on, adding magical utility to their martial skills. Their evolution is a mix of improving their martial prowess and their ability to track and hunt their foes. By high levels, they are a master of their craft, able to see through magical darkness and gain a bonus to attack rolls against their favored enemies.',
    bestFor: [
      {
        instances: [
          {
            name: 'Wood Elf',
            index: 'wood-elf'
          },
          {
            name: 'Human',
            index: 'human'
          }
        ],
        reason: 'Their bonuses to Dexterity and Wisdom make them natural archers and trackers.'
      }
    ],
    subclasses: [
      {
        index: 'hunter',
        name: 'Hunter',
        playstyle:
          'A pure damage dealer who focuses on using their skills to hunt and kill a variety of foes.',

        bestFor: [
          {
            instances: [
              {
                name: 'Wood Elf',
                index: 'wood-elf'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              'Both races offer bonuses to Dexterity and Wisdom, which are crucial for this damage-focused role.'
          }
        ],
        evolution:
          'This is a pure damage path. They get to choose a specialized combat ability early on to take down groups or single targets. They evolve into a combat master with improved defenses and the ability to make multiple attacks in a single turn, becoming a fearsome foe for any creature they hunt.'
      }
    ]
  },
  {
    index: 'rogue',
    name: 'Rogue',
    playstyle:
      'A master of stealth and deception who uses their cunning to outwit enemies and deal massive amounts of damage with Sneak Attack.',
    pros: [
      'Incredibly versatile with access to a variety of skills and abilities.',
      "Can deal massive amounts of damage with the 'Sneak Attack' feature."
    ],
    cons: ['Not as durable as other classes, as they have a low hit point count.'],
    evolution:
      'The Rogue starts as a skill monkey who can deal burst damage with Sneak Attack. Their evolution focuses on improving their abilities outside of combat and enhancing their signature Cunning Action. They become a master of expertise, able to bypass traps, sneak through any environment, and, at high levels, gain a sort of supernatural luck that allows them to succeed where others would fail.',
    bestFor: [
      {
        instances: [
          {
            name: 'Lightfoot Halfling',
            index: 'lightfoot-halfling'
          },
          {
            name: 'Wood Elf',
            index: 'wood-elf'
          },
          {
            name: 'Human',
            index: 'human'
          }
        ],
        reason:
          'Their natural bonuses to Dexterity and their innate abilities make them the perfect fit for stealth and infiltration.'
      }
    ],
    subclasses: [
      {
        index: 'thief',
        name: 'Thief',
        playstyle:
          'A quick and nimble combatant who can use their speed to steal items and use objects in combat.',

        bestFor: [
          {
            instances: [
              {
                name: 'Lightfoot Halfling',
                index: 'lightfoot-halfling'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              "The Halfling's ability to hide and the Human's versatility are crucial for this subclass."
          }
        ],
        evolution:
          'This is a versatile path that focuses on utility and speed. They gain the ability to use objects as a bonus action and climb faster. As they evolve, they become a master of utility, able to use magical items and weapons that would normally be restricted to other classes, making them an incredibly resourceful character.'
      }
    ]
  },
  {
    index: 'sorcerer',
    name: 'Sorcerer',
    playstyle:
      'A spellcaster who was born with innate magical power, allowing them to twist and manipulate their spells.',
    pros: [
      "Can use the 'Metamagic' feature to modify their spells, allowing them to be cast in unique ways.",
      'Can deal massive amounts of damage with a single spell.'
    ],
    cons: [
      'Has a very limited number of spells known, which can make them less versatile than other spellcasters.'
    ],
    evolution:
      'The Sorcerer starts with innate magical power and a limited number of spells. Their evolution is all about manipulating their spells using Metamagic. They are a glass cannon who becomes more and more powerful, able to double their spells, cast them subtly, or empower them. By high levels, they are a force of pure magic, able to unleash devastating magical power with ease.',
    bestFor: [
      {
        instances: [
          {
            name: 'Tiefling',
            index: 'tiefling'
          },
          {
            name: 'Dragonborn',
            index: 'dragonborn'
          },
          {
            name: 'Half-Elf',
            index: 'half-elf'
          }
        ],
        reason: 'Their bonuses to Charisma make them natural spellcasters.'
      }
    ],
    subclasses: [
      {
        index: 'draconic',
        name: 'Draconic Bloodline',
        playstyle:
          'A sorcerer who draws their power from a powerful dragon, gaining unique abilities and a natural resistance to a damage type.',

        bestFor: [
          {
            instances: [
              {
                name: 'Dragonborn',
                index: 'dragonborn'
              },
              {
                name: 'Tiefling',
                index: 'tiefling'
              }
            ],
            reason:
              "Both races have a strong connection to their draconic or infernal heritage, and the Dragonborn's breath weapon is a great addition to their draconic bloodline."
          }
        ],
        evolution:
          'This path is a powerful and durable spellcaster. They get a natural armor bonus and extra hit points early on. They evolve to be a master of a single damage type, gaining resistance and a boost to their damage spells. At high levels, they can grow a pair of wings and fly, becoming a true force of draconic power.'
      }
    ]
  },
  {
    index: 'warlock',
    name: 'Warlock',
    playstyle:
      'A powerful spellcaster who makes a pact with a supernatural being in exchange for a limited, but powerful, set of spells and abilities.',
    pros: [
      "Highly customizable through 'Eldritch Invocations', which alter and enhance their abilities.",
      "The 'Pact Magic' feature allows them to regain all spell slots on a short rest."
    ],
    cons: [
      'Has a very limited number of spell slots, which can be a major disadvantage in long adventuring days.',
      'Relies on a very specific set of stats (Charisma, Constitution, and Dexterity), which can be difficult to manage.'
    ],
    evolution:
      "The Warlock's journey is one of customization and deepening their connection with their patron. They start with a powerful cantrip and a limited number of spell slots. As they evolve, they customize their abilities with 'Eldritch Invocations' and can choose a pact boon to gain a special companion, weapon, or magical tome. By high levels, they become a master of a few powerful abilities, able to replicate spells, summon weapons, and gain a wide variety of passive abilities, and can even restore their power instantly with a short rest.",
    bestFor: [
      {
        instances: [
          {
            name: 'Tiefling',
            index: 'tiefling'
          },
          {
            name: 'Half-Elf',
            index: 'half-elf'
          }
        ],
        reason:
          "Both races offer bonuses to Charisma, which is the Warlock's key spellcasting ability."
      }
    ],
    subclasses: [
      {
        index: 'fiend',
        name: 'The Fiend',
        playstyle:
          'A pact with a powerful fiend, granting the warlock destructive magic and temporary hit points to fuel their combat prowess.',
        bestFor: [
          {
            instances: [
              {
                name: 'Tiefling',
                index: 'tiefling'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              "The Tiefling's innate abilities and the Human's versatility are crucial for this damage-focused role."
          }
        ],
        evolution:
          'This path is a destructive and durable spellcaster. They gain temporary hit points for killing enemies early on. They evolve into a tanky damage dealer who can use their luck to turn the tide of battle and, at high levels, can send their enemies to hell, becoming an unstoppable force of destructive magic.'
      }
    ]
  },
  {
    index: 'wizard',
    name: 'Wizard',
    playstyle:
      'An arcane scholar who studies magic from a spellbook, learning new spells to overcome any challenge.',
    pros: [
      'Has the largest and most versatile spell list in the game.',
      'Can learn new spells from scrolls and other sources, making them a master of all magical knowledge.'
    ],
    cons: [
      'Has a very low hit point count, making them a vulnerable target.',
      'Requires a high Intelligence score to be effective.'
    ],
    evolution:
      "The Wizard's journey is one of ever-expanding knowledge. They begin with a spellbook and a limited number of spells. Their evolution is about gaining more and more spells and mastering their chosen school of magic. They become a versatile caster who can prepare for any situation, and at high levels, they can cast their favorite spells at will without using a spell slot, becoming a true master of the arcane arts.",
    bestFor: [
      {
        instances: [
          {
            name: 'High Elf',
            index: 'high-elf'
          },
          {
            name: 'Gnome',
            index: 'gnome'
          }
        ],
        reason:
          "The High Elf's bonus to Intelligence and the Gnome's magical resistance make them perfect for this scholarly role."
      }
    ],
    subclasses: [
      {
        index: 'evocation',
        name: 'School of Evocation',
        playstyle:
          'A master of raw magical power, specializing in spells that deal massive amounts of damage.',
        bestFor: [
          {
            instances: [
              {
                name: 'High Elf',
                index: 'high-elf'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              "Both races offer bonuses to key stats, and the High Elf's Intelligence bonus and cantrip are great for this damage-focused role."
          }
        ],
        evolution:
          'This is a damage-focused path. They can sculpt their spells around allies early on, allowing them to use area-of-effect spells without harming their friends. They evolve into a master of raw magical power, gaining the ability to add their Intelligence modifier to spell damage and even cast spells at full power without a spell slot, becoming a true force of magical destruction.'
      }
    ]
  }
];

export function ProConList({ items, type }: { items: string[]; type: 'pros' | 'cons' }) {
  const isPros = type === 'pros';

  return (
    <List dense>
      <Typography variant="overline">{isPros ? 'Pros:' : 'Cons:'}</Typography>
      {items.map((item, index) => (
        <ListItem key={`${type}-${index}`}>
          <ListItemIcon sx={{ minWidth: '32px' }}>
            {isPros ? <CheckCircleOutline color="success" /> : <CancelOutlined color="error" />}
          </ListItemIcon>
          <Typography variant="body2">{item}</Typography>
        </ListItem>
      ))}
    </List>
  );
}

export function BestForSection({ bestForArray }: { bestForArray: GuideType['bestFor'] }) {
  return (
    <List>
      <Typography variant="overline">Best For:</Typography>
      {bestForArray.map((bestFor, index) => (
        <ListItem
          key={`bestFor-${index}`}
          sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            {bestFor.instances.map((cls, classIndex) => (
              <Chip key={classIndex} label={cls.name} size="small" variant="outlined" />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {bestFor.reason}
          </Typography>
        </ListItem>
      ))}
    </List>
  );
}
