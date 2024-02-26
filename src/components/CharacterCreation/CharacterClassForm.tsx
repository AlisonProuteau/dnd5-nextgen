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
import { useState } from 'react';
import { useQuery } from 'react-query';
import { getAllClasses, getClassInfo } from '../../api/characters';
import type { DefaultInstance, OptionFrom } from '../../representations/default.representation';
import type { CharacterFormData } from './CharacterCreation';

export function CharacterClassForm({
  setFormData
}: {
  setFormData: (raceInfo: Partial<CharacterFormData>) => void;
}) {
  const [selectedClass, setselectedClass] = useState<DefaultInstance>();
  const [selectedProficiencies, setSelectedProficiencies] =
    useState<(DefaultInstance & { type: number })[]>();

  const { data: classes } = useQuery('fetchClasses', async () => {
    return (await getAllClasses()).results;
  });

  const { data: classInfo } = useQuery(
    ['fetchClassInfo', selectedClass?.index],
    async () => {
      if (!selectedClass?.index) return;

      return await getClassInfo(selectedClass?.index);
    },
    { enabled: !!selectedClass?.index }
  );

  const onProficiencySelect = (checked: boolean, item: DefaultInstance, i: number) => {
    if (checked) {
      setSelectedProficiencies([...(selectedProficiencies || []), { ...item, type: i }]);
    } else if (selectedProficiencies?.length) {
      const proficiencyIndex = selectedProficiencies.findIndex(({ index }) => index === item.index);

      setSelectedProficiencies(selectedProficiencies.toSpliced(proficiencyIndex, 1));
    }
  };

  const generateProficiencyChoices = (i: number, choose: number, options: [OptionFrom]) =>
    options[0].item ? (
      <FormGroup id={`proficiencies-${i}`}>
        {options.map(
          ({ item }) =>
            item && (
              <FormControlLabel
                key={`proficiency-${i}-${item.index}`}
                control={
                  <Checkbox
                    id={`proficiency-${i}-${item.index}`}
                    disabled={
                      !selectedProficiencies?.find(({ index }) => index === item.index) &&
                      (selectedProficiencies?.filter(({ type }) => type === i).length || 0) >=
                        choose
                    }
                    onChange={(_, checked) => {
                      onProficiencySelect(checked, item, i);
                    }}
                  />
                }
                label={item?.name}
              />
            )
        )}
      </FormGroup>
    ) : (
      <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
        {options.map(
          ({ choice }) =>
            choice && generateProficiencyChoices(i, choice.choose, choice.from.options)
        )}
      </Box>
    );

  const isValid = () => {
    return (
      selectedClass?.index &&
      classInfo?.proficiency_choices?.every(
        ({ choose }, i) =>
          (selectedProficiencies?.filter(({ type }) => type === i).length || 0) === choose
      )
    );
  };

  return (
    <Box>
      <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
        <Typography>Class Selection</Typography>
      </Divider>
      {classes && (
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="class">Class</InputLabel>
          <Select
            fullWidth
            id="class"
            label="Class"
            disabled={!classes}
            value={selectedClass?.index || ''}
            onChange={({ target }) => {
              setSelectedProficiencies(undefined);
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
      {classInfo?.proficiency_choices && (
        <Box marginY="8px">
          <Typography>Proficiencies</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
            {classInfo.proficiency_choices.map(({ desc, choose, from: { options } }, i) => (
              <FormControl key={`proficiencies-${i}`} fullWidth margin="dense" component="fieldset">
                <FormLabel component="legend">{desc}</FormLabel>
                {generateProficiencyChoices(i, choose, options)}
              </FormControl>
            ))}
          </Box>
        </Box>
      )}

      <Button
        disabled={!isValid()}
        sx={{ marginTop: '1rem' }}
        fullWidth
        type="button"
        variant="contained"
        onClick={() => setFormData({ class: selectedClass, proficiencies: selectedProficiencies })}
      >
        Next
      </Button>
    </Box>
  );
}
