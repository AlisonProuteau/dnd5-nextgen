import { getAllRaces, getRaceInfo, getSubraceInfo, getTrait } from '@api/ressources';
import { Close, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
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
import { BestForSection, ProConList, RaceGuide } from './utils';

interface CharacterRaceFormProps {
  onNext: (raceInfo: Partial<CharacterFormData>) => void;
  proficiencies?: ChoiceSelection[];
  languages?: ChoiceSelection[];
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
          <InputLabel htmlFor="subRace">subraces-Race</InputLabel>
          <Select
            fullWidth
            id="subRace"
            label="subraces-Race"
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
