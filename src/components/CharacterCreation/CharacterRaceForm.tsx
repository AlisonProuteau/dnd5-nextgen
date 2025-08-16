import { getAllRaces, getRaceInfo, getSubraceInfo, getTrait } from '@api/ressources';
import { CancelOutlined, CheckCircleOutline, Close, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import type { Trait } from '@representations/abilities/trait.representation';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { CharacterFormData } from '@representations/user.representation';
import { AccordionButton } from '@shared/AccordionButton';
import { IconText } from '@shared/IconText';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { SwipeableCallbacks } from 'react-swipeable/es/types';
import { useAuth } from 'src/providers/AuthProvider';
import { TraitsDisplay } from '../CharacterCard/Characteristics/TraitsDisplay';
import { getAbilityIcon } from '../CharacterCard/Characteristics/utils';
import { CardCarousel } from './CardCarousel';
import { Choices } from './Choices';
import {
  mapDataForForm,
  mapTraits,
  type ChoiceObjectType,
  type ChoiceSelection
} from './characterCreation.utils';

interface CharacterRaceFormProps {
  onNext: (raceInfo: Partial<CharacterFormData>) => void;
  proficiencies?: ChoiceSelection[];
  languages?: ChoiceSelection[];
}

// TODO: Move somewhere either file or firestore
const RaceGuide: {
  index: string;
  name: string;
  playstyle: string;
  pros: string[];
  cons: string[];
  bestFor: { classes: DefaultRepresentation[]; reason: string }[];
  subraces?: {
    index: string;
    name: string;
    pros: string[];
    playstyle: string;
    bestFor: { classes: DefaultRepresentation[]; reason: string }[];
  }[];
}[] = [
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
        classes: [
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
        classes: [
          {
            name: 'Paladin',
            index: 'paladin'
          }
        ],
        reason:
          "Their strength bonus pairs well with the class, and their honorable nature fits the Paladin's code."
      },
      {
        classes: [
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
        classes: [
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
            classes: [
              {
                name: 'Cleric',
                index: 'cleric'
              }
            ],
            reason: 'Wisdom bonus is essential.'
          },
          {
            classes: [
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
            classes: [
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
        classes: [
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
            classes: [
              {
                name: 'Wizard',
                index: 'wizard'
              }
            ],
            reason: 'Intelligence is their main spellcasting ability.'
          },
          {
            classes: [
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
            classes: [
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
        classes: [
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
            classes: [
              {
                name: 'Druid',
                index: 'druid'
              }
            ],
            reason: 'Dexterity and talking to animals are great features.'
          },
          {
            classes: [
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
            classes: [
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
        classes: [
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
        classes: [
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
        classes: [
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
            classes: [
              {
                name: 'Rogue',
                index: 'rogue'
              }
            ],
            reason: 'Dexterity bonus and the ability to hide are key for stealth.'
          },
          {
            classes: [
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
            classes: [
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
        classes: [
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
        classes: [
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
        classes: [
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

// TODO: Move sub-components, maybe the playstyle section, to a separate file
function ProConList({ items, type }: { items: string[]; type: 'pros' | 'cons' }) {
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

function BestForSection({ bestForArray }: { bestForArray: any }) {
  return (
    <List>
      <Typography variant="overline">Best For:</Typography>
      {bestForArray.map((bestFor: any, index: any) => (
        <ListItem
          key={`bestFor-${index}`}
          sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            {bestFor.classes.map((cls: any, classIndex: any) => (
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

export function CharacterRaceForm({
  onNext,
  proficiencies = [],
  languages = []
}: CharacterRaceFormProps) {
  const { version } = useAuth();
  const [selectedRace, setselectedRace] = useState<DefaultRepresentation>();
  const [selectedSubrace, setselectedSubrace] = useState<DefaultRepresentation>();
  const [selectedProficiencies, setSelectedProficiencies] = useState<ChoiceObjectType[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<ChoiceObjectType[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<RaceAbilityBonus[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<ChoiceObjectType[]>([]);
  const [selectedSpells, setSelectedSpells] = useState<ChoiceObjectType[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [traitsOpen, setTraitsOpen] = useState(false);

  const { data: races } = useQuery({
    queryKey: ['fetchRaces', version],
    queryFn: async () => (version ? (await getAllRaces(version)).results : []),
    enabled: !!version
  });

  const { data: raceInfo } = useQuery({
    queryKey: ['fetchRaceInfo', version, selectedRace?.index],
    queryFn: async () =>
      selectedRace?.index && version ? await getRaceInfo(version, selectedRace.index) : null,
    enabled: !!selectedRace?.index && !!version
  });

  const { data: subraceInfo } = useQuery({
    queryKey: ['fetchSubraceInfo', version, selectedRace?.index, selectedSubrace?.index],
    queryFn: async () =>
      selectedRace?.index && selectedSubrace?.index && version
        ? await getSubraceInfo(version, selectedRace.index, selectedSubrace.index)
        : null,
    enabled: !!selectedRace?.index && !!version
  });

  const { data: raceTraits } = useQueries({
    queries:
      (raceInfo?.traits || []).concat(subraceInfo?.racial_traits || [])?.map(({ index }) => ({
        queryKey: ['fetchTrait', version, index],
        queryFn: async () => (version ? await getTrait(version, index) : null),
        enabled: !!index && !!version
      })) || [],
    combine: useCallback(
      (results: UseQueryResult<Trait | null, Error>[]) => ({
        data: results.map(({ data }) => data).filter((data) => data) as Trait[],
        isFetching: results.some((result) => result.isFetching)
      }),
      []
    )
  });

  useEffect(() => {
    if (raceInfo?.subraces?.length && !selectedSubrace) setselectedSubrace(raceInfo.subraces[0]);
  }, [raceInfo?.subraces?.map((r) => r.index).join(' ')]);

  useEffect(() => {
    const newProficiencies = selectedProficiencies.filter(
      (item) => !proficiencies.includes({ index: item.index, name: item.name, type: 'class' })
    );

    if (newProficiencies.length !== selectedProficiencies.length) {
      setSelectedProficiencies(newProficiencies);
      toast('Something changed in your race');
    }
  }, [proficiencies.map(({ index }) => index).join(', ')]);

  useEffect(() => {
    const newLanguages = selectedLanguages.filter(
      (item) => !languages.includes({ index: item.index, name: item.name, type: 'class' })
    );

    if (newLanguages.length !== selectedLanguages.length) {
      setSelectedLanguages(newLanguages);
      toast('Something changed in your race');
    }
  }, [languages.map(({ index }) => index).join(', ')]);

  useEffect(() => {
    if (races) {
      setSelectedProficiencies([]);
      setSelectedLanguages([]);
      setSelectedAbilities([]);
      setselectedSubrace(undefined);
      setselectedRace(races.find((e) => e.index === races[activeStep].index));
    }
  }, [races, activeStep]);

  const raceCardActions: Partial<SwipeableCallbacks> = {
    onSwipedLeft: () =>
      setActiveStep((prevActiveStep) =>
        prevActiveStep > 0 ? prevActiveStep - 1 : (races?.length || 0) - 1
      ),
    onSwipedRight: () =>
      setActiveStep((prevActiveStep) =>
        prevActiveStep < (races?.length || 0) - 1 ? prevActiveStep + 1 : 0
      )
  };

  const isValid = () =>
    selectedRace?.index &&
    (raceInfo?.traits?.length || 0) + (subraceInfo?.racial_traits?.length || 0) ===
      raceTraits.length &&
    raceTraits
      ?.filter(({ trait_specific }) => trait_specific?.subtrait_options)
      .every(
        ({ trait_specific }, i) =>
          (selectedTraits.filter(({ type }) => type === i).length || 0) >=
          (trait_specific?.subtrait_options?.choose || 0)
      ) &&
    raceTraits
      ?.filter(({ trait_specific }) => trait_specific?.spell_options)
      .every(
        ({ trait_specific }, i) =>
          (selectedSpells.filter(({ type }) => type === i).length || 0) >=
          (trait_specific?.spell_options?.choose || 0)
      ) &&
    raceTraits
      ?.filter(({ trait_specific }) => trait_specific?.spell_options)
      .every(
        ({ trait_specific }, i) =>
          (selectedSpells.filter(({ type }) => type === i).length || 0) >=
          (trait_specific?.spell_options?.choose || 0)
      ) &&
    (raceInfo?.starting_proficiency_options?.choose || 0) <= selectedProficiencies.length &&
    (raceInfo?.language_options?.choose || 0) + (subraceInfo?.language_options?.choose || 0) <=
      selectedLanguages.length &&
    (raceInfo?.ability_bonus_options?.choose || 0) <= selectedAbilities.length;

  const handleSubmit = () => {
    const data: Partial<CharacterFormData> = {
      race: selectedRace,
      proficiencies: mapDataForForm(selectedProficiencies, 'race')
        .concat(mapDataForForm(raceInfo?.starting_proficiencies || [], 'race'))
        .concat(mapDataForForm(subraceInfo?.starting_proficiencies || [], 'race'))
        .concat(
          mapDataForForm(
            raceTraits.flatMap(({ proficiencies }) => proficiencies || []),
            'race'
          )
        )
        .concat(proficiencies.filter(({ type }) => type !== 'race')),
      languages: mapDataForForm(selectedLanguages, 'race')
        .concat(mapDataForForm(raceInfo?.languages || [], 'race'))
        .concat(languages.filter(({ type }) => type !== 'race')),
      abilities: selectedAbilities
        .map(({ bonus, ability_score }) => ({ bonus, ability_score }))
        .concat(raceInfo?.ability_bonuses || [])
        .concat(subraceInfo?.ability_bonuses || []),
      speed: subraceInfo?.speed || raceInfo?.speed || 30,
      size: raceInfo?.size,
      size_description: raceInfo?.size_description,
      traits: uniqBy(mapTraits(raceTraits, selectedTraits, selectedSpells), 'index')
    };

    selectedSubrace?.index ? onNext({ ...data, subrace: selectedSubrace }) : onNext(data);
  };

  const scrollOnOpen = useCallback(
    ({ currentTarget }: { currentTarget: EventTarget & Element }, expanded: boolean) => {
      expanded && setTimeout(() => currentTarget.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    []
  );

  const selectedRacePlaystyle = useMemo(
    () => RaceGuide.find(({ index }) => index === selectedRace?.index),
    [selectedRace?.index]
  );

  return (
    <Box>
      {races && <CardCarousel data={races} activeStep={activeStep} cardActions={raceCardActions} />}

      <Box display="flex" flexDirection="row" justifyContent="center" width="100%" marginTop={2}>
        {raceInfo?.ability_bonuses.map((ability) => {
          return (
            <IconText
              label={ability.ability_score.name.toLocaleLowerCase()}
              value={`+${ability.bonus}`}
              Icon={getAbilityIcon(ability.ability_score.index)}
              color="grey"
              top="35px"
              size="40px"
            />
          );
        })}
        {subraceInfo?.ability_bonuses.map((ability) => {
          return (
            <IconText
              label={ability.ability_score.name.toLocaleLowerCase()}
              value={`+${ability.bonus}`}
              Icon={getAbilityIcon(ability.ability_score.index)}
              color="grey"
              top="35px"
              size="40px"
            />
          );
        })}
      </Box>

      {!!raceInfo?.subraces?.length && (
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="subRace">Sub-Race</InputLabel>
          <Select
            fullWidth
            id="subRace"
            label="Sub-Race"
            value={selectedSubrace?.index || raceInfo.subraces[0].index}
            onChange={({ target }) => {
              setSelectedProficiencies([]);
              setSelectedLanguages([]);
              setSelectedAbilities([]);
              setselectedSubrace(raceInfo.subraces?.find((e) => e.index === target.value));
            }}
          >
            {raceInfo.subraces.map((currentSubrace) => (
              <MenuItem
                key={currentSubrace.index}
                id={currentSubrace.index}
                value={currentSubrace.index}
              >
                {currentSubrace.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Box marginY={2} display="flex" flexDirection="column" gap={1}>
        {selectedRace && raceInfo && (
          <Fragment>
            {/* TODO: should it be moved to a question mark action button? */}
            {selectedRacePlaystyle && (
              <Accordion key={`${selectedRace.index}-howTo`} disableGutters onChange={scrollOnOpen}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">How to Play</Typography>
                  </Divider>
                </AccordionSummary>
                <AccordionDetails sx={{ textAlign: 'justify' }}>
                  <Typography variant="overline">Playstyle</Typography>
                  <Typography marginBottom={2}>{selectedRacePlaystyle.playstyle}</Typography>

                  <ProConList items={selectedRacePlaystyle.pros} type="pros" />
                  <ProConList items={selectedRacePlaystyle.cons} type="cons" />

                  <BestForSection bestForArray={selectedRacePlaystyle.bestFor} />

                  {selectedRacePlaystyle.subraces?.length && (
                    <Box>
                      <Typography variant="overline">Subraces</Typography>
                      {selectedRacePlaystyle.subraces.map((subrace) => (
                        <Accordion key={subrace.index} disableGutters sx={{ boxShadow: 'none' }}>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="overline" fontWeight="bold">
                              {subrace.name}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Fragment>
                              <Typography variant="overline">Playstyle</Typography>
                              <Typography marginBottom={2}>{subrace.playstyle}</Typography>
                              <ProConList items={subrace.pros} type="pros" />
                              <BestForSection bestForArray={subrace.bestFor} />
                            </Fragment>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            <Accordion
              key={`${selectedRace.index}-description`}
              disableGutters
              onChange={scrollOnOpen}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">Description</Typography>
                </Divider>
              </AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                <Typography variant="overline">{selectedRace.name}</Typography>
                <Typography marginBottom={2}>{selectedRace.desc}</Typography>

                {selectedSubrace && subraceInfo && (
                  <Fragment>
                    <Typography variant="overline">{selectedSubrace.name}</Typography>
                    <Typography marginBottom={2}>{subraceInfo.desc}</Typography>
                  </Fragment>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              key={`${raceInfo.index}-characteristics`}
              disableGutters
              onChange={scrollOnOpen}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">Characteristics</Typography>
                </Divider>
              </AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                <Typography variant="overline">Size</Typography>
                <Typography marginBottom={2}>{raceInfo.size_description}</Typography>

                <Typography variant="overline">Speed</Typography>
                <Typography marginBottom={2}>{subraceInfo?.speed ?? raceInfo.speed}ft</Typography>

                <Typography variant="overline">Age</Typography>
                <Typography marginBottom={2}>{raceInfo.age}</Typography>

                <Typography variant="overline">Alignment</Typography>
                <Typography marginBottom={2}>{raceInfo.alignment}</Typography>

                <Typography variant="overline">Languages</Typography>
                <Typography marginBottom={2}>{raceInfo.language_desc}</Typography>

                {raceInfo.starting_proficiencies?.length ||
                subraceInfo?.starting_proficiencies?.length ? (
                  <Fragment>
                    <Typography variant="overline">Starting Proficiencies:</Typography>
                    <Typography marginBottom={2}>
                      {(raceInfo.starting_proficiencies || [])
                        .concat(subraceInfo?.starting_proficiencies || [])
                        .map((p) => p.name)
                        .join(', ')}
                    </Typography>
                  </Fragment>
                ) : null}
              </AccordionDetails>
            </Accordion>

            {raceInfo.traits?.length || subraceInfo?.racial_traits.length ? (
              <Fragment>
                <AccordionButton
                  fullWidth
                  title={`Traits (${
                    (raceInfo?.traits || []).concat(subraceInfo?.racial_traits || []).length
                  })`}
                  onClick={() => setTraitsOpen(true)}
                />
                <Dialog open={traitsOpen} onClose={() => setTraitsOpen(false)}>
                  <DialogTitle>Traits</DialogTitle>
                  <IconButton
                    aria-label="close"
                    onClick={() => setTraitsOpen(false)}
                    sx={(theme) => ({
                      position: 'absolute',
                      right: 2,
                      top: 2,
                      color: theme.palette.grey[500]
                    })}
                  >
                    <Close />
                  </IconButton>
                  <DialogContent sx={{ paddingTop: 0 }}>
                    <TraitsDisplay
                      character={{
                        traits: (raceInfo?.traits || []).concat(subraceInfo?.racial_traits || []),
                        version: version || 'Legacy'
                      }}
                      useblackList={false}
                    />
                  </DialogContent>
                </Dialog>
              </Fragment>
            ) : null}
          </Fragment>
        )}
      </Box>

      {selectedRace && raceInfo?.starting_proficiency_options && (
        <Fragment>
          <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
            <Typography>
              Choose proficiencies {raceInfo?.starting_proficiency_options?.choose || 0}
            </Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
            <Choices
              choices={[raceInfo?.starting_proficiency_options]}
              inherited={proficiencies.filter(({ type }) => type !== 'race')}
              selected={selectedProficiencies}
              setSelected={setSelectedProficiencies}
            />
          </Box>
        </Fragment>
      )}
      {selectedRace && (raceInfo?.language_options || subraceInfo?.language_options) && (
        <Fragment>
          <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
            <Typography>
              Choose Languages (
              {(raceInfo?.language_options?.choose || 0) +
                (subraceInfo?.language_options?.choose || 0)}
              )
            </Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
            <Choices
              choices={[raceInfo?.language_options, subraceInfo?.language_options]}
              inherited={languages.filter(({ type }) => type !== 'race')}
              selected={selectedLanguages}
              setSelected={setSelectedLanguages}
            />
          </Box>
        </Fragment>
      )}
      {selectedRace && (
        <Fragment>
          {raceInfo?.ability_bonus_options && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>
                  Choose Bonus Abilities {raceInfo?.ability_bonus_options?.choose || 0}
                </Typography>
              </Divider>
              <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
                <Choices
                  choices={[raceInfo?.ability_bonus_options]}
                  selected={selectedAbilities}
                  setSelected={setSelectedAbilities}
                />
              </Box>
            </Fragment>
          )}

          {raceTraits.some((trait) => trait.trait_specific?.subtrait_options) && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>Choose traits</Typography>
              </Divider>
              <Choices
                choices={raceTraits.map((trait) =>
                  trait.trait_specific?.subtrait_options
                    ? {
                        ...trait.trait_specific?.subtrait_options,
                        desc: trait.desc.find((d) => d.includes('1st'))
                      }
                    : undefined
                )}
                selected={selectedTraits}
                setSelected={setSelectedTraits}
              />
            </Fragment>
          )}

          {raceTraits.some((trait) => trait.trait_specific?.spell_options) && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>Choose spells</Typography>
              </Divider>
              <Choices
                choices={raceTraits.map((trait) =>
                  trait.trait_specific?.spell_options
                    ? {
                        ...trait.trait_specific?.spell_options,
                        desc: trait.desc.find((d) => d.includes('1st'))
                      }
                    : undefined
                )}
                selected={selectedSpells}
                setSelected={setSelectedSpells}
              />
            </Fragment>
          )}
        </Fragment>
      )}

      <Button
        sx={{ float: 'right', paddingBottom: '15px' }}
        disabled={!isValid()}
        onClick={handleSubmit}
      >
        Next
      </Button>
    </Box>
  );
}
