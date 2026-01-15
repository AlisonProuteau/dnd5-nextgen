import { Fragment, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { SwipeableCallbacks } from 'react-swipeable/es/types';
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
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { getAllRaces, getRaceGuide, getRaceInfo, getSubraceInfo, getTrait } from '@api/ressources';
import { IconText } from '@shared/IconText';
import {
  type ChoiceObjectType,
  type ChoiceSelection,
  mapDataForForm,
  mapTraits
} from '@utils/character';
import { getAbilityIcon } from '@utils/character/characteristics.utils';
import type { Trait } from '@representations/abilities/trait.representation';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { RaceGuide } from '@representations/guide.representation';
import type { CharacterFormData } from '@representations/user.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { CardCarousel } from './CardCarousel';
import { Choices } from './Choices';
import { HowToPlaySection } from './HowToPlaySection';
import { SelectionDetails } from './SelectionDetails';

const flexRowGap50 = { display: 'flex', flexDirection: 'row', columnGap: '50px' };

interface CharacterRaceFormProps {
  onNext: (raceInfo: Partial<CharacterFormData>) => void;
  proficiencies?: ChoiceSelection[];
  languages?: ChoiceSelection[];
  isActive?: boolean;
}

export function CharacterRaceForm({
  onNext,
  proficiencies = [],
  languages = [],
  isActive = false
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

  const { data: races } = useQuery({
    queryKey: ['fetchRaces', version],
    queryFn: async () => (version ? (await getAllRaces(version)).results : []),
    enabled: !!version && isActive
  });

  const { data: raceInfo } = useQuery({
    queryKey: ['fetchRaceInfo', version, selectedRace?.index],
    queryFn: async () =>
      selectedRace?.index && version ? await getRaceInfo(version, selectedRace.index) : null,
    enabled: !!selectedRace?.index && !!version && isActive
  });

  const { data: subraceInfo } = useQuery({
    queryKey: ['fetchSubraceInfo', version, selectedRace?.index, selectedSubrace?.index],
    queryFn: async () =>
      selectedRace?.index && selectedSubrace?.index && version
        ? await getSubraceInfo(version, selectedRace.index, selectedSubrace.index)
        : null,
    enabled: !!selectedRace?.index && !!version && isActive
  });

  const { data: raceGuide } = useQuery({
    queryKey: ['fetchRaceGuide', version, selectedRace?.index],
    queryFn: async () =>
      !selectedRace?.index || !version
        ? null
        : ((await getRaceGuide(version, selectedRace.index)) as RaceGuide | null) || null,
    enabled: !!selectedRace && !!version && isActive
  });

  const { data: raceTraits } = useQueries({
    queries:
      uniqBy((raceInfo?.traits || []).concat(subraceInfo?.racial_traits || []), 'index')?.map(
        ({ index }) => ({
          queryKey: ['fetchTrait', version, index],
          queryFn: async () => (version ? await getTrait(version, index) : null),
          enabled: !!index && !!version && isActive
        })
      ) || [],
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

  return (
    <Box>
      {races && (
        <CardCarousel
          data={races}
          activeStep={activeStep}
          cardActions={raceCardActions}
          carouselType="race"
        >
          {raceGuide && <HowToPlaySection playstyle={raceGuide} />}
        </CardCarousel>
      )}

      <Box display="flex" flexDirection="row" justifyContent="center" width="100%" marginTop={2}>
        {raceInfo?.ability_bonuses.map((ability) => {
          return (
            <IconText
              key={ability.ability_score.index}
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
              key={ability.ability_score.index}
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
          <InputLabel htmlFor="subraces">Sub-Race</InputLabel>
          <Select
            fullWidth
            id="subraces"
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
                key={`subraces-${currentSubrace.index}`}
                id={currentSubrace.index}
                value={currentSubrace.index}
              >
                {currentSubrace.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedRace && raceInfo && (
        <SelectionDetails
          selected={selectedRace}
          subSelected={subraceInfo || undefined}
          info={{
            ...raceInfo,
            speed: subraceInfo?.speed || raceInfo?.speed || 0,
            starting_proficiencies: (raceInfo?.starting_proficiencies || []).concat(
              subraceInfo?.starting_proficiencies || []
            )
          }}
          traits={(raceInfo?.traits || []).concat(subraceInfo?.racial_traits || [])}
          detailsType="race"
        />
      )}

      {selectedRace && raceInfo?.starting_proficiency_options && (
        <Box data-testid="race-choices-proficiency">
          <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
            <Typography>Choose proficiencies</Typography>
          </Divider>
          <Box sx={flexRowGap50}>
            <Choices
              choices={[
                {
                  ...raceInfo.starting_proficiency_options,
                  desc:
                    raceInfo.starting_proficiency_options.desc ||
                    `Select ${raceInfo?.starting_proficiency_options?.choose || 0} proficienc${
                      raceInfo?.starting_proficiency_options?.choose === 1 ? 'y' : 'ies'
                    }`
                }
              ]}
              inherited={proficiencies.filter(({ type }) => type !== 'race')}
              selected={selectedProficiencies}
              setSelected={setSelectedProficiencies}
            />
          </Box>
        </Box>
      )}
      {selectedRace && (raceInfo?.language_options || subraceInfo?.language_options) && (
        <Box data-testid="race-choices-language">
          <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
            <Typography>Choose Languages</Typography>
          </Divider>
          <Box sx={flexRowGap50}>
            <Choices
              choices={[
                raceInfo?.language_options
                  ? {
                      ...raceInfo.language_options,
                      desc:
                        raceInfo.language_options.desc ||
                        `Select ${raceInfo.language_options.choose || 0} language${
                          raceInfo.language_options.choose === 1 ? '' : 's'
                        }`
                    }
                  : undefined,
                subraceInfo?.language_options
                  ? {
                      ...subraceInfo.language_options,
                      desc:
                        subraceInfo.language_options.desc ||
                        `Select ${subraceInfo.language_options.choose || 0} language${
                          subraceInfo.language_options.choose === 1 ? '' : 's'
                        }`
                    }
                  : undefined
              ]}
              inherited={languages.filter(({ type }) => type !== 'race')}
              selected={selectedLanguages}
              setSelected={setSelectedLanguages}
            />
          </Box>
        </Box>
      )}
      {selectedRace && (
        <Fragment>
          {raceInfo?.ability_bonus_options && (
            <Box data-testid="race-choices-bonus-ability">
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>Choose Bonus Abilities</Typography>
              </Divider>
              <Box sx={flexRowGap50}>
                <Choices
                  choices={[
                    {
                      ...raceInfo.ability_bonus_options,
                      desc:
                        raceInfo.ability_bonus_options.desc ||
                        `Select ${raceInfo.ability_bonus_options.choose || 0} ability bonus${
                          raceInfo.ability_bonus_options.choose === 1 ? '' : 'es'
                        }`
                    }
                  ]}
                  selected={selectedAbilities}
                  setSelected={setSelectedAbilities}
                />
              </Box>
            </Box>
          )}

          {raceTraits.some((trait) => trait.trait_specific?.subtrait_options) && (
            <Box data-testid="race-choices-trait">
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
                        ...trait.trait_specific.subtrait_options,
                        desc:
                          trait.desc.find((d) => d.includes('1st')) ||
                          trait.desc[0] ||
                          `Select ${trait.trait_specific.subtrait_options.choose} trait ${
                            trait.trait_specific.subtrait_options.choose === 1 ? '' : 's'
                          }`
                      }
                    : undefined
                )}
                selected={selectedTraits}
                setSelected={setSelectedTraits}
              />
            </Box>
          )}

          {raceTraits.some((trait) => trait.trait_specific?.spell_options) && (
            <Box data-testid="race-choices-spell">
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
                        ...trait.trait_specific.spell_options,
                        desc:
                          trait.desc.find((d) => d.includes('1st')) ||
                          trait.desc[0] ||
                          `Select ${trait.trait_specific.spell_options.choose} trait ${
                            trait.trait_specific.spell_options.choose === 1 ? '' : 's'
                          }`
                      }
                    : undefined
                )}
                selected={selectedSpells}
                setSelected={setSelectedSpells}
              />
            </Box>
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
