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
import { getAllClasses, getClassInfo } from '../../api/ressources';
import type { DefaultRepresentation, Option } from '../../representations/common.representation';
import type { CharacterFormData } from './CharacterCreation';

interface CharacterClassFormProps {
  onNext: (raceInfo: Partial<CharacterFormData>) => void;
  proficiencies?: DefaultRepresentation[];
}

export function CharacterClassForm({ onNext, proficiencies = [] }: CharacterClassFormProps) {
  const [selectedClass, setselectedClass] = useState<DefaultRepresentation>();
  const [selectedSubclass, setselectedSubclass] = useState<DefaultRepresentation>();
  const [selectedProficiencies, setSelectedProficiencies] =
    useState<(DefaultRepresentation & { type: number })[]>();

  const { data: classes } = useQuery('fetchClasses', async () => (await getAllClasses()).results);
  const { data: classInfo } = useQuery(
    ['fetchClassInfo', selectedClass?.index],
    async () => {
      if (!selectedClass?.index) return;

      return await getClassInfo(selectedClass.index);
    },
    { enabled: !!selectedClass?.index }
  );

  // TODO features

  useEffect(() => {
    if (classInfo?.subclasses?.length && !selectedSubclass)
      setselectedSubclass(classInfo.subclasses[0]);
  }, [classInfo?.subclasses?.map((r) => r.index).join(' ')]);

  const onProficiencySelect = (checked: boolean, item: DefaultRepresentation, i: number) => {
    if (checked) {
      setSelectedProficiencies([...(selectedProficiencies || []), { ...item, type: i }]);
    } else if (selectedProficiencies?.length) {
      const proficiencyIndex = selectedProficiencies.findIndex(({ index }) => index === item.index);

      setSelectedProficiencies(selectedProficiencies.toSpliced(proficiencyIndex, 1));
    }
  };

  const generateProficiencyChoices = (
    i: number,
    choose: number,
    options: Option[],
    desc: string
  ) => {
    if (options[0].option_type === 'reference') {
      return (
        <FormGroup key={`proficiencies-${i}-${desc})}`}>
          {options.map(
            ({ item }) =>
              item && (
                <FormControlLabel
                  key={`proficiency-${i}-${item.index}`}
                  control={
                    <Checkbox
                      id={`proficiency-${i}-${item.index}`}
                      checked={
                        proficiencies.some(({ index }) => index === item.index) ||
                        selectedProficiencies?.some(({ index }) => index === item.index) ||
                        false
                      }
                      disabled={
                        proficiencies.some(({ index }) => index === item.index) ||
                        (!selectedProficiencies?.find(({ index }) => index === item.index) &&
                          (selectedProficiencies?.filter(({ type }) => type === i).length || 0) >=
                            choose)
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
      );
    } else if (options[0]?.option_type === 'choice') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
          {options.map(
            ({ choice }, index) =>
              choice &&
              choice.from.option_set_type === 'options_array' &&
              generateProficiencyChoices(
                i,
                choice.choose,
                choice.from.options,
                choice.desc || index.toString()
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
      selectedClass?.index &&
      classInfo?.proficiency_choices?.every(
        ({ choose }, i) =>
          (selectedProficiencies?.filter(({ type }) => type === i).length || 0) === choose
      )
    );
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
              setSelectedProficiencies(undefined);
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
            onChange={({ target }) =>
              setselectedSubclass(classInfo.subclasses?.find((e) => e.index === target.value))
            }
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

      {selectedClass && classInfo?.proficiency_choices && (
        <Fragment>
          <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
            <Typography>Choose proficiencies</Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
            {classInfo.proficiency_choices.map(({ desc, choose, from }, i) => (
              <FormControl key={`proficiencies-${i}`} fullWidth margin="dense" component="fieldset">
                <FormLabel component="legend">{desc}</FormLabel>
                {from?.option_set_type === 'options_array' &&
                  generateProficiencyChoices(i, choose, from.options, desc || i.toString())}
              </FormControl>
            ))}
          </Box>
        </Fragment>
      )}

      <Button
        sx={{ float: 'right' }}
        disabled={!isValid()}
        onClick={() => {
          if (selectedSubclass?.index)
            onNext({
              class: selectedClass,
              subclass: selectedSubclass,
              proficiencies: selectedProficiencies?.map((proficiency) => ({
                index: proficiency.index,
                name: proficiency.name
              }))
            });
          else onNext({ class: selectedClass, proficiencies: selectedProficiencies });
        }}
      >
        Next
      </Button>
    </Box>
  );
}
