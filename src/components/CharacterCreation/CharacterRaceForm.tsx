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

  const onProficiencySelect = (checked: boolean, item: DefaultRepresentation, i: number) => {
    if (checked) {
      setSelectedProficiencies([...(selectedProficiencies || []), { ...item, type: i }]);
    } else if (selectedProficiencies.length) {
      const proficiencyIndex = selectedProficiencies.findIndex(({ index }) => index === item.index);

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

  const generateChoices = (
    i: number,
    choose: number,
    options: Option[],
    desc: string,
    type: 'proficiency' | 'language'
  ) => {
    if (options[0].option_type === 'reference') {
      return (
        <FormGroup key={`${type}-${i}-${desc})}`}>
          {options.map(
            ({ item }) =>
              item && (
                <FormControlLabel
                  key={`${type}-${i}-${item.index}`}
                  control={
                    <Checkbox
                      id={`${type}-${i}-${item.index}`}
                      checked={
                        type === 'proficiency'
                          ? proficiencies.some(({ index }) => index === item.index) ||
                            selectedProficiencies.some(({ index }) => index === item.index) ||
                            false
                          : languages.some(({ index }) => index === item.index) ||
                            selectedLanguages.some(({ index }) => index === item.index) ||
                            false
                      }
                      disabled={
                        type === 'proficiency'
                          ? proficiencies.some(({ index }) => index === item.index) ||
                            (!selectedProficiencies.find(({ index }) => index === item.index) &&
                              (selectedProficiencies.filter(({ type }) => type === i).length ||
                                0) >= choose)
                          : languages.some(({ index }) => index === item.index) ||
                            (!selectedLanguages.find(({ index }) => index === item.index) &&
                              (selectedLanguages.length || 0) >= choose)
                      }
                      onChange={(_, checked) => {
                        type === 'proficiency'
                          ? onProficiencySelect(checked, item, i)
                          : onLanguageSelect(checked, item);
                      }}
                    />
                  }
                  label={item?.name}
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
      (raceInfo?.starting_proficiency_options?.choose || 0) === selectedProficiencies.length
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
            onChange={({ target }) =>
              setselectedSubrace(raceInfo.subraces?.find((e) => e.index === target.value))
            }
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
              .concat(subraceInfo?.languages || [])
          };

          selectedSubrace?.index ? onNext({ ...data, subrace: selectedSubrace }) : onNext(data);
        }}
      >
        Next
      </Button>
    </Box>
  );
}
