import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getAllRaces, getRaceInfo, getSubraceInfo } from '../../api/ressources';
import type { RaceAbilityBonus } from '../../representations/character/race.representation';
import type { DefaultRepresentation, Option } from '../../representations/common.representation';
import type { CharacterFormData } from './CharacterCreation';

interface CharacterRaceFormProps {
  onNext: (raceInfo: Partial<CharacterFormData>) => void;
  proficiencies?: DefaultRepresentation[];
  languages?: DefaultRepresentation[];
}

export function CharacterRaceForm({
  onNext,
  proficiencies = [],
  languages = []
}: CharacterRaceFormProps) {
  const [selectedRace, setselectedRace] = useState<DefaultRepresentation>();
  const [selectedSubrace, setselectedSubrace] = useState<DefaultRepresentation>();
  const [selectedProficiencies, setSelectedProficiencies] = useState<
    (DefaultRepresentation & { type: number })[]
  >([]);
  const [selectedLanguages, setSelectedLanguages] = useState<DefaultRepresentation[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<RaceAbilityBonus[]>([]);

  const { data: races } = useQuery('fetchRaces', async () => (await getAllRaces()).results);
  const { data: raceInfo } = useQuery(
    ['fetchRaceInfo', selectedRace?.index],
    async () => {
      if (!selectedRace?.index) return;

      return await getRaceInfo(selectedRace.index);
    },
    { enabled: !!selectedRace?.index }
  );
  const { data: subraceInfo } = useQuery(
    ['fetchSubraceInfo', selectedRace?.index, selectedSubrace?.index],
    async () => {
      if (!selectedRace?.index || !selectedSubrace?.index) return;

      return await getSubraceInfo(selectedRace.index, selectedSubrace.index);
    },
    { enabled: !!selectedRace?.index }
  );

  useEffect(() => {
    if (raceInfo?.subraces?.length && !selectedSubrace) setselectedSubrace(raceInfo.subraces[0]);
  }, [raceInfo?.subraces?.map((r) => r.index).join(' ')]);

  const isChecked = (type: 'proficiency' | 'language' | 'ability', item: DefaultRepresentation) => {
    if (type === 'proficiency')
      return (
        proficiencies.some(({ index }) => index === item.index) ||
        selectedProficiencies.some(({ index }) => index === item.index) ||
        false
      );
    else if (type === 'language')
      return (
        languages.some(({ index }) => index === item.index) ||
        selectedLanguages.some(({ index }) => index === item.index) ||
        false
      );
    else if (type === 'ability')
      return (
        selectedAbilities.some(({ ability_score }) => ability_score.index === item.index) || false
      );

    return false;
  };

  const isDisabled = (
    itemType: 'proficiency' | 'language' | 'ability',
    item: DefaultRepresentation,
    choose: number,
    i?: number
  ) => {
    if (itemType === 'proficiency')
      return (
        !isChecked(itemType, item) &&
        (selectedProficiencies.filter(({ type }) => type === i).length || 0) >= choose
      );
    else if (itemType === 'language')
      return !isChecked(itemType, item) && (selectedLanguages.length || 0) >= choose;
    else if (itemType === 'ability')
      return !isChecked(itemType, item) && (selectedAbilities.length || 0) >= choose;
    return false;
  };

  const onChange = (
    type: 'proficiency' | 'language' | 'ability',
    checked: boolean,
    item: DefaultRepresentation | RaceAbilityBonus,
    i?: number
  ) => {
    const onProficiencySelect = (checked: boolean, item: DefaultRepresentation, i: number) => {
      if (checked) {
        setSelectedProficiencies([...(selectedProficiencies || []), { ...item, type: i }]);
      } else if (selectedProficiencies.length) {
        const proficiencyIndex = selectedProficiencies.findIndex(
          ({ index }) => index === item.index
        );

        setSelectedProficiencies(selectedProficiencies.toSpliced(proficiencyIndex, 1));
      }
    };
    const onLanguageSelect = (checked: boolean, item: DefaultRepresentation) => {
      if (checked) {
        setSelectedLanguages([...(selectedLanguages || []), item]);
      } else if (selectedLanguages.length) {
        const languageIndex = selectedLanguages.findIndex(({ index }) => index === item.index);
        setSelectedLanguages(selectedLanguages.toSpliced(languageIndex, 1));
      }
    };
    const onAbilitySelect = (checked: boolean, item: RaceAbilityBonus) => {
      if (checked) {
        setSelectedAbilities([...(selectedAbilities || []), item]);
      } else if (selectedAbilities.length) {
        const abilityIndex = selectedAbilities.findIndex(
          ({ ability_score }) => ability_score.index === item.ability_score.index
        );
        setSelectedAbilities(selectedAbilities.toSpliced(abilityIndex, 1));
      }
    };

    if (type === 'proficiency') onProficiencySelect(checked, item as DefaultRepresentation, i || 0);
    else if (type === 'language') onLanguageSelect(checked, item as DefaultRepresentation);
    else if (type === 'ability') onAbilitySelect(checked, item as RaceAbilityBonus);
  };

  const generateChoices = (
    i: number,
    choose: number,
    options: Option[],
    desc: string,
    type: 'proficiency' | 'language' | 'ability'
  ) => {
    if (options[0].option_type === 'reference') {
      return (
        <FormGroup key={`${type}-${i}-${desc})}`}>
          {options.map(
            ({ item }) =>
              item && (
                <FormControlLabel
                  key={`${type}-${i}-${item.index || item}`}
                  control={
                    <Checkbox
                      id={`${type}-${i}-${item.index}`}
                      checked={isChecked(type, item)}
                      disabled={isDisabled(type, item, choose, i)}
                      onChange={(_, checked) => onChange(type, checked, item, i)}
                    />
                  }
                  label={item?.name}
                />
              )
          )}
        </FormGroup>
      );
    } else if (options[0].option_type === 'ability_bonus') {
      return (
        <FormGroup key={`${type}-${i}-${desc})}`}>
          {options.map(
            ({ ability_score, bonus }) =>
              ability_score &&
              bonus && (
                <FormControlLabel
                  key={`${type}-${i}-${ability_score.index}`}
                  control={
                    <Checkbox
                      id={`${type}-${i}-${ability_score.index}`}
                      checked={isChecked(type, ability_score)}
                      disabled={isDisabled(type, ability_score, choose, i)}
                      onChange={(_, checked) =>
                        onChange(type, checked, { ability_score, bonus }, i)
                      }
                    />
                  }
                  label={ability_score?.name}
                />
              )
          )}
        </FormGroup>
      );
    } else if (options[0]?.option_type === 'choice') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
          {options.map(
            ({ choice }, index) =>
              choice &&
              choice.from.option_set_type === 'options_array' &&
              generateChoices(
                i,
                choice.choose,
                choice.from.options,
                choice.desc || index.toString(),
                type
              )
          )}
        </Box>
      );
    } else {
      throw new Error('Option type not handled');
    }
  };

  const isValid = () => {
    return (
      selectedRace?.index &&
      (raceInfo?.starting_proficiency_options?.choose || 0) +
        (subraceInfo?.starting_proficiency_options?.choose || 0) ===
        selectedProficiencies.length &&
      (raceInfo?.language_options?.choose || 0) + (subraceInfo?.language_options?.choose || 0) ===
        selectedLanguages.length &&
      (raceInfo?.ability_bonus_options?.choose || 0) +
        (subraceInfo?.ability_bonus_options?.choose || 0) ===
        selectedAbilities.length
    );
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

      {selectedRace &&
        (raceInfo?.starting_proficiency_options || subraceInfo?.starting_proficiency_options) && (
          <Fragment>
            <Divider
              component="div"
              role="presentation"
              sx={{ paddingTop: '15px' }}
              variant="middle"
            >
              <Typography>
                Choose proficiencies (
                {(raceInfo?.starting_proficiency_options?.choose || 0) +
                  (subraceInfo?.starting_proficiency_options?.choose || 0)}
                )
              </Typography>
            </Divider>
            <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
              {raceInfo?.starting_proficiency_options && (
                <FormControl fullWidth margin="dense" component="fieldset">
                  <FormLabel component="legend">
                    {raceInfo.starting_proficiency_options.desc}
                  </FormLabel>
                  {raceInfo.starting_proficiency_options.from?.option_set_type ===
                    'options_array' &&
                    generateChoices(
                      0,
                      raceInfo.starting_proficiency_options.choose,
                      raceInfo.starting_proficiency_options.from.options,
                      raceInfo.starting_proficiency_options.desc || '0',
                      'proficiency'
                    )}
                </FormControl>
              )}
              {subraceInfo?.starting_proficiency_options && (
                <FormControl fullWidth margin="dense" component="fieldset">
                  <FormLabel component="legend">
                    {subraceInfo.starting_proficiency_options.desc}
                  </FormLabel>
                  {subraceInfo.starting_proficiency_options.from?.option_set_type ===
                    'options_array' &&
                    generateChoices(
                      1,
                      subraceInfo.starting_proficiency_options.choose,
                      subraceInfo.starting_proficiency_options.from.options,
                      subraceInfo.starting_proficiency_options.desc || '0',
                      'proficiency'
                    )}
                </FormControl>
              )}
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
            {raceInfo?.language_options && (
              <FormControl fullWidth margin="dense" component="fieldset">
                <FormLabel component="legend">{raceInfo.language_options.desc}</FormLabel>
                {raceInfo.language_options.from?.option_set_type === 'options_array' &&
                  generateChoices(
                    0,
                    raceInfo.language_options.choose,
                    raceInfo.language_options.from.options,
                    raceInfo.language_options.desc || '0',
                    'language'
                  )}
              </FormControl>
            )}
            {subraceInfo?.language_options && (
              <FormControl fullWidth margin="dense" component="fieldset">
                <FormLabel component="legend">{subraceInfo.language_options.desc}</FormLabel>
                {subraceInfo.language_options.from?.option_set_type === 'options_array' &&
                  generateChoices(
                    1,
                    subraceInfo.language_options.choose,
                    subraceInfo.language_options.from.options,
                    subraceInfo.language_options.desc || '0',
                    'language'
                  )}
              </FormControl>
            )}
          </Box>
        </Fragment>
      )}

      {selectedRace && (raceInfo?.ability_bonus_options || subraceInfo?.ability_bonus_options) && (
        <Fragment>
          <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
            <Typography>
              Choose Bonus Abilities (
              {(raceInfo?.ability_bonus_options?.choose || 0) +
                (subraceInfo?.ability_bonus_options?.choose || 0)}
              )
            </Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
            {raceInfo?.ability_bonus_options && (
              <FormControl fullWidth margin="dense" component="fieldset">
                <FormLabel component="legend">{raceInfo.ability_bonus_options.desc}</FormLabel>
                {raceInfo.ability_bonus_options.from?.option_set_type === 'options_array' &&
                  generateChoices(
                    0,
                    raceInfo.ability_bonus_options.choose,
                    raceInfo.ability_bonus_options.from.options,
                    raceInfo.ability_bonus_options.desc || '0',
                    'ability'
                  )}
              </FormControl>
            )}
            {subraceInfo?.ability_bonus_options && (
              <FormControl fullWidth margin="dense" component="fieldset">
                <FormLabel component="legend">{subraceInfo.ability_bonus_options.desc}</FormLabel>
                {subraceInfo.ability_bonus_options.from?.option_set_type === 'options_array' &&
                  generateChoices(
                    1,
                    subraceInfo.ability_bonus_options.choose,
                    subraceInfo.ability_bonus_options.from.options,
                    subraceInfo.ability_bonus_options.desc || '0',
                    'ability'
                  )}
              </FormControl>
            )}
          </Box>
        </Fragment>
      )}

      <Button
        sx={{ float: 'right' }}
        disabled={!isValid()}
        onClick={() => {
          const data = {
            race: selectedRace,
            proficiencies: selectedProficiencies
              .map((proficiency) => ({
                index: proficiency.index,
                name: proficiency.name
              }))
              .concat(raceInfo?.starting_proficiencies || [])
              .concat(subraceInfo?.starting_proficiencies || []),
            languages: selectedLanguages
              .concat(raceInfo?.languages || [])
              .concat(subraceInfo?.languages || []),
            abilities: selectedAbilities
              .concat(raceInfo?.ability_bonuses || [])
              .concat(subraceInfo?.ability_bonuses || [])
          };

          selectedSubrace?.index ? onNext({ ...data, subrace: selectedSubrace }) : onNext(data);
        }}
      >
        Next
      </Button>
    </Box>
  );
}
