import { getAllRaces, getRaceInfo, getSubraceInfo, getTrait } from '@api/ressources';
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
import type { Trait } from '@representations/abilities/trait.representation';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { Fragment, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { CharacterFormData } from './CharacterCreation';
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

export function CharacterRaceForm({
  onNext,
  proficiencies = [],
  languages = []
}: CharacterRaceFormProps) {
  const [selectedRace, setselectedRace] = useState<DefaultRepresentation>();
  const [selectedSubrace, setselectedSubrace] = useState<DefaultRepresentation>();
  const [selectedProficiencies, setSelectedProficiencies] = useState<ChoiceObjectType[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<ChoiceObjectType[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<RaceAbilityBonus[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<ChoiceObjectType[]>([]);
  const [selectedSpells, setSelectedSpells] = useState<ChoiceObjectType[]>([]);

  const { data: races } = useQuery({
    queryKey: ['fetchRaces'],
    queryFn: async () => (await getAllRaces()).results
  });

  const { data: raceInfo } = useQuery({
    queryKey: ['fetchRaceInfo', selectedRace?.index],
    queryFn: async () => (selectedRace?.index ? await getRaceInfo(selectedRace.index) : null),
    enabled: !!selectedRace?.index
  });

  const { data: subraceInfo } = useQuery({
    queryKey: ['fetchSubraceInfo', selectedRace?.index, selectedSubrace?.index],
    queryFn: async () =>
      selectedRace?.index && selectedSubrace?.index
        ? await getSubraceInfo(selectedRace.index, selectedSubrace.index)
        : null,
    enabled: !!selectedRace?.index
  });

  const { data: raceTraits } = useQueries({
    queries:
      (raceInfo?.traits || []).concat(subraceInfo?.racial_traits || [])?.map(({ index }) => ({
        queryKey: ['fetchTrait', index],
        queryFn: async () => await getTrait(index),
        enabled: !!index
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

  // OK: Language and proficiencies already in race/subrace
  const isValid = () => {
    return (
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
      (raceInfo?.starting_proficiency_options?.choose || 0) >= selectedProficiencies.length &&
      (raceInfo?.language_options?.choose || 0) + (subraceInfo?.language_options?.choose || 0) >=
        selectedLanguages.length &&
      (raceInfo?.ability_bonus_options?.choose || 0) >= selectedAbilities.length
    );
  };

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
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="race">Races</InputLabel>
          <Select
            fullWidth
            id="race"
            label="Races"
            disabled={!races}
            value={selectedRace?.index || ''}
            onChange={({ target }) => {
              setSelectedProficiencies([]);
              setSelectedLanguages([]);
              setSelectedAbilities([]);
              setselectedSubrace(undefined);
              setselectedRace(races.find((e) => e.index === target.value));
            }}
          >
            {races.map((currentRace) => (
              <MenuItem key={currentRace.index} id={currentRace.index} value={currentRace.index}>
                {currentRace.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

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
