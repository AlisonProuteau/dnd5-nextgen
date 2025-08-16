import { getAllClasses, getClassInfo, getFeature, getSubclassInfo } from '@api/ressources';
import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import type { Feature } from '@representations/abilities/feature.representation';
import type { Level } from '@representations/campaign/level.representation';
import type { Classes } from '@representations/character/class.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { CharacterFormData } from '@representations/user.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Fragment, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from 'src/providers/AuthProvider';
import {
  mapDataForForm,
  mapFeatures,
  type ChoiceObjectType,
  type ChoiceSelection
} from './characterCreation.utils';
import type { GuideType } from './CharacterRaceForm';
import { Choices } from './Choices';

interface CharacterClassFormProps {
  onNext: (classInfo: Partial<CharacterFormData>) => void;
  onPrev: (classInfo: Partial<CharacterFormData>) => void;
  proficiencies?: ChoiceSelection[];
}

// TODO: Check and implement (check rac form)
const ClassGuide: (GuideType & {
  evolution: string;
  subclasses: (Omit<GuideType, 'cons'> & { evolution: string })[];
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
        index: 'path-of-the-berserker',
        name: 'Path of the Berserker',
        playstyle:
          'A pure damage dealer that throws caution to the wind in their pursuit of ultimate power, often at a physical cost.',
        pros: [],
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
      },
      {
        index: 'path-of-the-totem-warrior',
        name: 'Path of the Totem Warrior',
        playstyle:
          'A spiritually-guided warrior who gains unique defensive and utility traits by communing with an animal spirit.',
        pros: [],
        bestFor: [
          {
            instances: [
              {
                name: 'Half-Orc',
                index: 'half-orc'
              },
              {
                name: 'Stout Halfling',
                index: 'stout-halfling'
              }
            ],
            reason:
              "These races provide crucial bonuses to Constitution and durability, enhancing the Totem Warrior's defensive capabilities."
          }
        ],
        evolution:
          'This path adds versatility and defense to the Barbarian. It starts with a choice of a spirit animal that grants a unique benefit while raging. It evolves into a spiritual guide and protector, gaining the ability to resist different damage types and gain utility features for exploration and interacting with the natural world, becoming a guardian of nature.'
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
        index: 'college-of-lore',
        name: 'College of Lore',
        playstyle:
          'A knowledge-focused spellcaster who learns a wide variety of spells from other classes to fill any magical need.',
        pros: [],
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
      },
      {
        index: 'college-of-valor',
        name: 'College of Valor',
        playstyle:
          "A front-line inspiring leader who uses their magic to enhance their combat prowess and their allies' martial abilities.",
        pros: [],
        bestFor: [
          {
            instances: [
              {
                name: 'Mountain Dwarf',
                index: 'mountain-dwarf'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              "Both races provide crucial bonuses to Strength and Constitution, enhancing the Valor Bard's front-line role."
          }
        ],
        evolution:
          'This path adds martial prowess to the Bard. It starts by granting the Bard proficiency with medium armor, shields, and martial weapons, and allows them to inspire attacks. As it evolves, it becomes a battlefield leader who can make attacks and cast spells in the same turn, blurring the line between a warrior and a spellcaster.'
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
        index: 'life-domain',
        name: 'Life Domain',
        playstyle:
          'A dedicated healer who focuses on providing powerful, life-saving healing to their allies.',
        pros: [],
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
      },
      {
        index: 'war-domain',
        name: 'War Domain',
        playstyle:
          'A martial leader who uses their divine power to enhance their weapon attacks and lead the charge into battle.',
        pros: [],
        bestFor: [
          {
            instances: [
              {
                name: 'Mountain Dwarf',
                index: 'mountain-dwarf'
              },
              {
                name: 'Half-Orc',
                index: 'half-orc'
              }
            ],
            reason:
              'Both races offer bonuses to Strength and Constitution, which are crucial for this front-line role.'
          }
        ],
        evolution:
          'This path is a more martial-focused cleric. It starts with the ability to make extra attacks and use divine power to grant themselves or an ally a massive bonus to a single attack. As they evolve, they become a front-line force who is hard to take down and can lead the charge into battle, becoming a true avatar of their deity.'
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
        index: 'circle-of-the-moon',
        name: 'Circle of the Moon',
        playstyle:
          'A shape-shifting specialist who focuses on using Wild Shape to become a durable front-line combatant.',
        pros: [],
        bestFor: [
          {
            instances: [
              {
                name: 'Mountain Dwarf',
                index: 'mountain-dwarf'
              },
              {
                name: 'Stout Halfling',
                index: 'stout-halfling'
              }
            ],
            reason:
              'These races provide a crucial bonus to Constitution and durability, enhancing their Wild Shape form.'
          }
        ],
        evolution:
          'This path is a Wild Shape specialist from the start. They gain the ability to transform into more powerful beasts and can use their magic to heal in that form. They evolve to become a powerful elemental transformer who can use their Wild Shape an unlimited number of times, becoming a true force of nature on the battlefield.'
      },
      {
        index: 'circle-of-the-land',
        name: 'Circle of the Land',
        playstyle:
          'A versatile spellcaster who draws power from a specific type of terrain to gain new spells and abilities.',
        pros: [],
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
        index: 'battle-master',
        name: 'Battle Master',
        playstyle:
          'A tactical genius who uses special maneuvers to outmaneuver and control their enemies.',
        pros: [],
        bestFor: [
          {
            instances: [
              {
                name: 'Human',
                index: 'human'
              },
              {
                name: 'High Elf',
                index: 'high-elf'
              }
            ],
            reason:
              "Both races offer bonuses to key stats, and the High Elf's intelligence and cantrip can be a great addition to their tactical prowess."
          }
        ],
        evolution:
          "This path adds a layer of tactical depth to the Fighter. They begin with a pool of 'superiority dice' to perform special maneuvers. As they evolve, their dice become more effective and they gain more of them, becoming a battlefield tactician who can control enemies, aid allies, and turn the tide of battle with a single well-placed strike."
      },
      {
        index: 'champion',
        name: 'Champion',
        playstyle:
          'A straightforward and powerful warrior who is a master of simple, yet effective, combat techniques.',
        pros: [],
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
        index: 'way-of-the-open-hand',
        name: 'Way of the Open Hand',
        playstyle:
          'A master of close-quarters combat who can use their abilities to push, trip, or stop enemies from taking reactions.',
        pros: [],
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
      },
      {
        index: 'way-of-the-four-elements',
        name: 'Way of the Four Elements',
        playstyle:
          'A monk who infuses their ki with the elements of fire, earth, air, and water to unleash powerful magical effects.',
        pros: [],
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
              "Both races offer bonuses to key stats, and the High Elf's intelligence can be a great addition to their magical abilities."
          }
        ],
        evolution:
          "This path adds elemental magic to the Monk's repertoire. They gain the ability to cast spells using Ki points. As they evolve, they learn more elemental spells and can perform more powerful magical effects in combat, becoming a versatile and magical martial artist."
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
        index: 'oath-of-devotion',
        name: 'Oath of Devotion',
        playstyle:
          'A righteous hero who protects the innocent and upholds the highest moral standards.',
        pros: [],
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
      },
      {
        index: 'oath-of-vengeance',
        name: 'Oath of Vengeance',
        playstyle:
          'A relentless hunter who seeks to punish the wicked and destroy those who have wronged them.',
        pros: [],
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
              "The Half-Orc's Strength bonus and the Human's versatility are crucial for this front-line, damage-focused role."
          }
        ],
        evolution:
          'This oath is a damage-focused path. It starts with the ability to grant themselves advantage against a foe and frighten them. As they evolve, they become a relentless hunter who can pursue their enemies across the battlefield and get an extra attack as a reaction when a target of their vow makes an attack, becoming an unstoppable force of vengeance.'
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
        pros: [],
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
      },
      {
        index: 'beast-master',
        name: 'Beast Master',
        playstyle:
          'A master of the wild who fights alongside an animal companion, using their bond to overcome enemies.',
        pros: [],
        bestFor: [
          {
            instances: [
              {
                name: 'Forest Gnome',
                index: 'forest-gnome'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              "The Forest Gnome's ability to communicate with small animals and the Human's versatility are great for this subclass."
          }
        ],
        evolution:
          'This path starts with a beast companion that fights alongside them. They evolve to have a stronger connection with their companion, allowing it to perform more actions and gain extra attacks. At high levels, they can even share their spells with their companion, becoming a truly unique and powerful duo.'
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
        pros: [],
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
      },
      {
        index: 'assassin',
        name: 'Assassin',
        playstyle:
          'A master of stealth and surprise who specializes in killing their targets with a single, devastating blow.',
        pros: [],
        bestFor: [
          {
            instances: [
              {
                name: 'Drow Elf',
                index: 'drow-elf'
              },
              {
                name: 'Wood Elf',
                index: 'wood-elf'
              }
            ],
            reason:
              "The Drow's innate abilities and the Wood Elf's stealth are perfect for this role."
          }
        ],
        evolution:
          'This is a combat-focused path. They gain the ability to deal massive damage to a surprised target early on. As they evolve, they become a master of disguise and deception, able to assume the identity of others and deal a massive amount of damage to a creature they have surprised, becoming the ultimate killer.'
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
        index: 'draconic-bloodline',
        name: 'Draconic Bloodline',
        playstyle:
          'A sorcerer who draws their power from a powerful dragon, gaining unique abilities and a natural resistance to a damage type.',
        pros: [],
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
      },
      {
        index: 'wild-magic',
        name: 'Wild Magic',
        playstyle:
          'A chaotic spellcaster who has a chance to unleash a random magical effect every time they cast a spell.',
        pros: [],
        bestFor: [
          {
            instances: [
              {
                name: 'Half-Elf',
                index: 'half-elf'
              },
              {
                name: 'Human',
                index: 'human'
              }
            ],
            reason:
              "The Half-Elf's versatility and the Human's ability to choose a feat are great for this unpredictable subclass."
          }
        ],
        evolution:
          'This path is a chaotic and unpredictable spellcaster. They gain the ability to unleash a random magical effect every time they cast a spell. They evolve into a master of chaos, able to manipulate luck and control their wild magic surges to a degree, making them an incredibly fun and unpredictable character to play.'
      }
    ]
  }
];

// TODO: Update with new design
export function CharacterClassForm({
  onNext,
  onPrev,
  proficiencies = []
}: CharacterClassFormProps) {
  const { version } = useAuth();
  const [selectedClass, setselectedClass] = useState<DefaultRepresentation>();
  const [selectedSubclass, setselectedSubclass] = useState<DefaultRepresentation>();
  const [selectedProficiencies, setSelectedProficiencies] = useState<ChoiceObjectType[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<ChoiceObjectType[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<ChoiceObjectType[]>([]);
  const [selectedExpertises, setSelectedExpertises] = useState<ChoiceObjectType[]>([]);

  const { data: classes } = useQuery({
    queryKey: ['fetchClasses', version],
    queryFn: async () => (version ? (await getAllClasses(version)).results : []),
    enabled: !!version
  });

  const { data: classInfo } = useQuery({
    queryKey: ['fetchClassInfo', version, selectedClass?.index],
    queryFn: async () =>
      selectedClass?.index && version
        ? ((await getClassInfo(version, selectedClass.index)) as Classes | null)
        : null,
    enabled: !!selectedClass?.index && !!version
  });

  const { data: levelInfo } = useQuery({
    queryKey: ['fetchClassInfoLevel', version, selectedClass?.index, selectedSubclass?.index, 1],
    queryFn: async () => {
      if (!selectedClass?.index || !version) return null;
      let levelRes: Partial<Level> = {};

      const classRes = (await getClassInfo(version, selectedClass.index, 1)) as Level | null;
      if (classRes) levelRes = { ...classRes };

      if (selectedSubclass?.index) {
        const subclassRes = (await getSubclassInfo(
          version,
          selectedClass.index,
          selectedSubclass.index,
          1
        )) as Level | null;

        if (subclassRes)
          levelRes = {
            ...levelRes,
            features: [...(levelRes.features || []), ...(subclassRes.features || [])]
          };
      }

      return Object.keys(levelRes).length ? (levelRes as Level) : null;
    },
    enabled: !!selectedClass && !!version
  });

  const { data: classFeatures } = useQueries({
    queries:
      levelInfo?.features?.map(({ index }) => ({
        queryKey: ['fetchFeature', version, index],
        queryFn: async () => (version ? await getFeature(version, index) : null),
        enabled: !!index && !!version
      })) || [],
    combine: useCallback(
      (results: UseQueryResult<Feature | null, Error>[]) => ({
        data: results.map(({ data }) => data).filter((data) => data) as Feature[],
        isFetching: results.some((result) => result.isFetching)
      }),
      []
    )
  });

  useEffect(() => {
    if (classInfo?.subclasses?.length && !selectedSubclass)
      setselectedSubclass(classInfo.subclasses[0]);
  }, [classInfo?.subclasses?.map((r) => r.index).join(' ')]);

  useEffect(() => {
    const newProficiencies = selectedProficiencies.filter(
      (item) => !proficiencies.includes({ index: item.index, name: item.name, type: 'class' })
    );

    if (newProficiencies.length !== selectedProficiencies.length) {
      setSelectedProficiencies(newProficiencies);
      toast('Something changed in your class');
    }
  }, [proficiencies.map(({ index }) => index).join(', ')]);

  const isValid = () =>
    selectedClass?.index &&
    (levelInfo?.features?.length || 0) === classFeatures.length &&
    classFeatures
      ?.filter(({ feature_specific }) => feature_specific?.subfeature_options)
      .every(
        ({ feature_specific }, i) =>
          (selectedFeatures.filter(({ type }) => type === i).length || 0) >=
          (feature_specific?.subfeature_options?.choose || 0)
      ) &&
    classFeatures
      ?.filter(({ feature_specific }) => feature_specific?.expertise_options)
      .every(
        ({ feature_specific }, i) =>
          (selectedExpertises.filter(({ type }) => type === i).length || 0) >=
          (feature_specific?.expertise_options?.choose || 0)
      ) &&
    classInfo?.proficiency_choices?.every(
      ({ choose }, i) =>
        (selectedProficiencies.filter(({ type }) => type === i).length || 0) >= choose
    ) &&
    classInfo?.starting_equipment_options?.every(
      ({ choose }, i) => (selectedEquipments.filter(({ type }) => type === i).length || 0) >= choose
    );

  const handleSubmit = (fn: (classInfo: Partial<CharacterFormData>) => void) => {
    const data: Partial<CharacterFormData> = {
      class: selectedClass,
      proficiencies: mapDataForForm(selectedProficiencies, 'class')
        .concat(mapDataForForm(classInfo?.proficiencies || [], 'class'))
        .concat(proficiencies.filter(({ type }) => type !== 'class')),
      equipments: mapDataForForm(selectedEquipments, 'class').concat(
        mapDataForForm(
          classInfo?.starting_equipment?.map((equipment) => equipment.equipment) || [],
          'class'
        )
      ),
      features: mapFeatures(classFeatures, selectedFeatures, selectedExpertises),
      proficiencyBonus: levelInfo?.prof_bonus || 2
    };

    if (selectedSubclass?.index) fn({ ...data, subclass: selectedSubclass });
    else fn(data);
  };

  return (
    <Box>
      {classes && (
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="class">Classes</InputLabel>
          <Select
            fullWidth
            id="class"
            label="Classes"
            disabled={!classes}
            value={selectedClass?.index || ''}
            onChange={({ target }) => {
              setSelectedProficiencies([]);
              setSelectedEquipments([]);
              setSelectedFeatures([]);
              setSelectedExpertises([]);
              setselectedSubclass(undefined);
              setselectedClass(classes.find((e) => e.index === target.value));
            }}
          >
            {classes.map((currentClass) => (
              <MenuItem key={currentClass.index} id={currentClass.index} value={currentClass.index}>
                {currentClass.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {!!classInfo?.subclasses?.length && (
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="subRace">Sub-Race</InputLabel>
          <Select
            fullWidth
            id="subRace"
            label="Sub-Race"
            value={selectedSubclass?.index || classInfo.subclasses[0].index}
            onChange={({ target }) => {
              setSelectedProficiencies([]);
              setSelectedEquipments([]);
              setSelectedFeatures([]);
              setSelectedExpertises([]);
              setselectedSubclass(classInfo.subclasses?.find((e) => e.index === target.value));
            }}
          >
            {classInfo.subclasses.map((currentSubclass) => (
              <MenuItem
                key={currentSubclass.index}
                id={currentSubclass.index}
                value={currentSubclass.index}
              >
                {currentSubclass.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedClass && (
        <Fragment>
          {classInfo?.proficiency_choices && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>Choose proficiencies</Typography>
              </Divider>
              <Choices
                choices={classInfo.proficiency_choices}
                inherited={proficiencies.filter(({ type }) => type !== 'class')}
                selected={selectedProficiencies}
                setSelected={setSelectedProficiencies}
              />
            </Fragment>
          )}

          {classInfo?.starting_equipment_options && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>Choose equipments</Typography>
              </Divider>
              <Choices
                choices={classInfo.starting_equipment_options}
                proficiencies={[...proficiencies, ...selectedProficiencies].map(
                  ({ index, name }) => ({ index, name } as DefaultRepresentation)
                )}
                selected={selectedEquipments}
                setSelected={setSelectedEquipments}
              />
            </Fragment>
          )}

          {classFeatures.some((feature) => feature.feature_specific?.subfeature_options) && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>Choose features</Typography>
              </Divider>
              <Choices
                choices={classFeatures.map((feature) =>
                  feature.feature_specific?.subfeature_options
                    ? {
                        ...feature.feature_specific?.subfeature_options,
                        desc: feature.desc.find((d) => d.includes('1st'))
                      }
                    : undefined
                )}
                selected={selectedFeatures}
                setSelected={setSelectedFeatures}
              />
            </Fragment>
          )}

          {classFeatures.some((feature) => feature.feature_specific?.expertise_options) && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>Choose expertises</Typography>
              </Divider>
              <Choices
                choices={classFeatures.map((feature) =>
                  feature.feature_specific?.expertise_options
                    ? {
                        ...feature.feature_specific?.expertise_options,
                        desc: feature.desc.find((d) => d.includes('1st')) || feature.desc[0]
                      }
                    : undefined
                )}
                selected={selectedExpertises}
                setSelected={setSelectedExpertises}
              />
            </Fragment>
          )}
        </Fragment>
      )}

      <Button sx={{ float: 'left', paddingBottom: '15px' }} onClick={() => handleSubmit(onPrev)}>
        Back
      </Button>
      <Button sx={{ float: 'right' }} disabled={!isValid()} onClick={() => handleSubmit(onNext)}>
        Next
      </Button>
    </Box>
  );
}
