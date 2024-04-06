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
import type { CharacterFormData } from './CharacterCreation';
import { Choices } from './Choices';
import { mapDataForForm, type ChoiceObjectType, type ChoiceSelection } from './utils';

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
  const [selectedProficiencies, setSelectedProficiencies] = useState<ChoiceObjectType[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<ChoiceObjectType[]>([]);

  const { data: classes } = useQuery('fetchClasses', async () => (await getAllClasses()).results);
  const { data: classInfo } = useQuery(
    ['fetchClassInfo', selectedClass?.index],
    async () => {
      if (!selectedClass?.index) return;

      return await getClassInfo(selectedClass.index);
    },
    { enabled: !!selectedClass?.index }
  );

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
          (selectedProficiencies.filter(({ type }) => type === i).length || 0) >= choose
      ) &&
      classInfo?.starting_equipment_options?.every(
        ({ choose }, i) =>
          (selectedEquipments.filter(({ type }) => type === i).length || 0) >= choose
      )
    );
  };

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
      )
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

      {selectedClass && classInfo?.starting_equipment_options && (
        <Fragment>
          <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
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

      <Button sx={{ float: 'left' }} onClick={() => handleSubmit(onPrev)}>
        Back
      </Button>
      <Button sx={{ float: 'right' }} disabled={!isValid()} onClick={() => handleSubmit(onNext)}>
        Next
      </Button>
    </Box>
  );
}
