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
import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import { getAllClasses, getClassInfo } from '../../api/ressources';
import type { DefaultRepresentation } from '../../representations/common.representation';
import type { CharacterFormData, ChoiceSelection } from './CharacterCreation';
import { Choices } from './Choices';

interface CharacterClassFormProps {
  onNext: (classInfo: Partial<CharacterFormData>) => void;
  onPrev: (classInfo: Partial<CharacterFormData>) => void;
  proficiencies?: ChoiceSelection[];
}

export function CharacterClassForm({
  onNext,
  onPrev,
  proficiencies = []
}: CharacterClassFormProps) {
  const [selectedClass, setselectedClass] = useState<DefaultRepresentation>();
  const [selectedSubclass, setselectedSubclass] = useState<DefaultRepresentation>();
  const [selectedProficiencies, setSelectedProficiencies] = useState<
    (DefaultRepresentation & { type: number })[]
  >([]);

  const { data: classes } = useQuery('fetchClasses', async () => (await getAllClasses()).results);
  const { data: classInfo } = useQuery(
    ['fetchClassInfo', selectedClass?.index],
    async () => {
      if (!selectedClass?.index) return;

      return await getClassInfo(selectedClass.index);
    },
    { enabled: !!selectedClass?.index }
  );
  // const { data: subclassInfo } = useQuery(
  //   ['fetchSubclassInfo', selectedClass?.index, selectedSubclass?.index],
  //   async () => {
  //     if (!selectedClass?.index || !selectedSubclass?.index) return;

  //     return await getSubclassInfo(selectedClass.index, selectedSubclass.index);
  //   },
  //   { enabled: !!selectedClass?.index }
  // );

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

  const isValid = () => {
    return (
      selectedClass?.index &&
      classInfo?.proficiency_choices?.every(
        ({ choose }, i) =>
          (selectedProficiencies.filter(({ type }) => type === i).length || 0) === choose
      )
    );
  };

  const handleSubmit = (fn: (classInfo: Partial<CharacterFormData>) => void) => {
    const formattedProficiencies = selectedProficiencies
      .map(
        (proficiency) =>
          ({
            index: proficiency.index,
            name: proficiency.name,
            type: 'class'
          } as ChoiceSelection)
      )
      .concat(proficiencies.filter(({ type }) => type !== 'class'));

    if (selectedSubclass?.index)
      fn({
        class: selectedClass,
        subclass: selectedSubclass,
        proficiencies: formattedProficiencies
      });
    else fn({ class: selectedClass, proficiencies: formattedProficiencies });
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
          <Choices
            choices={classInfo.proficiency_choices}
            inherited={proficiencies.filter(({ type }) => type !== 'class')}
            selected={selectedProficiencies}
            setSelected={setSelectedProficiencies}
          />
        </Fragment>
      )}

      <Button sx={{ float: 'left' }} disabled={!isValid()} onClick={() => handleSubmit(onPrev)}>
        Back
      </Button>
      <Button sx={{ float: 'right' }} disabled={!isValid()} onClick={() => handleSubmit(onNext)}>
        Next
      </Button>
    </Box>
  );
}
