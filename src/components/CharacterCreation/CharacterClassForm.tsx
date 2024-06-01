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
import { Fragment, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAllClasses, getClassInfo, getFeature, getSubclassInfo } from '../../api/ressources';
import type { Feature } from '../../representations/abilities/feature.representation';
import type { Level } from '../../representations/campaign/level.representation';
import type { Classes } from '../../representations/character/class.representation';
import type { DefaultRepresentation } from '../../representations/common.representation';
import type { CharacterFormData } from './CharacterCreation';
import { Choices } from './Choices';
import { mapDataForForm, mapFeatures, type ChoiceObjectType, type ChoiceSelection } from './utils';

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
  const [selectedFeatures, setSelectedFeatures] = useState<ChoiceObjectType[]>([]);
  const [selectedExpertises, setSelectedExpertises] = useState<ChoiceObjectType[]>([]);

  const { data: classes } = useQuery({
    queryKey: ['fetchClasses'],
    queryFn: async () => (await getAllClasses()).results
  });

  const { data: classInfo } = useQuery({
    queryKey: ['fetchClassInfo', selectedClass?.index],
    queryFn: async () =>
      selectedClass?.index ? ((await getClassInfo(selectedClass.index)) as Classes | null) : null,
    enabled: !!selectedClass?.index
  });

  const { data: levelInfo } = useQuery({
    queryKey: ['fetchClassInfoLevel', selectedClass?.index, selectedSubclass?.index, 1],
    queryFn: async () => {
      if (!selectedClass?.index) return null;
      let levelRes: Partial<Level> = {};

      const classRes = (await getClassInfo(selectedClass.index, 1)) as Level | null;
      if (classRes) levelRes = { ...classRes };

      if (selectedSubclass?.index) {
        const subclassRes = (await getSubclassInfo(
          selectedClass.index,
          selectedSubclass.index,
          1
        )) as Level | null;

        // FIX: Only uses features for subclass
        if (subclassRes)
          levelRes = {
            ...levelRes,
            features: [...(levelRes.features || []), ...(subclassRes.features || [])]
          };
      }

      return Object.keys(levelRes).length ? (levelRes as Level) : null;
    },
    enabled: !!selectedClass
  });

  const { data: classFeatures } = useQueries({
    queries:
      levelInfo?.features?.map(({ index }) => ({
        queryKey: ['fetchFeature', index],
        queryFn: async () => await getFeature(index),
        enabled: !!index
      })) || [],
    combine: useCallback(
      (results: UseQueryResult<Feature | null, Error>[]) => ({
        data: results.map(({ data }) => data).filter((data) => data) as Feature[],
        isFetching: results.some((result) => result.isFetching)
      }),
      []
    )
  });

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

  const isValid = () =>
    selectedClass?.index &&
    (levelInfo?.features?.length || 0) === classFeatures.length &&
    classFeatures
      ?.filter(({ feature_specific }) => feature_specific?.subfeature_options)
      .every(
        ({ feature_specific }, i) =>
          (selectedFeatures.filter(({ type }) => type === i).length || 0) >=
          (feature_specific?.subfeature_options?.choose || 0)
      ) &&
    classFeatures
      ?.filter(({ feature_specific }) => feature_specific?.expertise_options)
      .every(
        ({ feature_specific }, i) =>
          (selectedExpertises.filter(({ type }) => type === i).length || 0) >=
          (feature_specific?.expertise_options?.choose || 0)
      ) &&
    classInfo?.proficiency_choices?.every(
      ({ choose }, i) =>
        (selectedProficiencies.filter(({ type }) => type === i).length || 0) >= choose
    ) &&
    classInfo?.starting_equipment_options?.every(
      ({ choose }, i) => (selectedEquipments.filter(({ type }) => type === i).length || 0) >= choose
    );

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
      ),
      features: mapFeatures(classFeatures, selectedFeatures, selectedExpertises),
      proficiencyBonus: levelInfo?.prof_bonus || 2
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
              setSelectedFeatures([]);
              setSelectedExpertises([]);
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
              setSelectedFeatures([]);
              setSelectedExpertises([]);
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

      {selectedClass && (
        <Fragment>
          {classInfo?.proficiency_choices && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
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

          {classInfo?.starting_equipment_options && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
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

          {classFeatures.some((feature) => feature.feature_specific?.subfeature_options) && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>Choose features</Typography>
              </Divider>
              <Choices
                choices={classFeatures.map((feature) =>
                  feature.feature_specific?.subfeature_options
                    ? {
                        ...feature.feature_specific?.subfeature_options,
                        desc: feature.desc.find((d) => d.includes('1st'))
                      }
                    : undefined
                )}
                selected={selectedFeatures}
                setSelected={setSelectedFeatures}
              />
            </Fragment>
          )}

          {classFeatures.some((feature) => feature.feature_specific?.expertise_options) && (
            <Fragment>
              <Divider
                component="div"
                role="presentation"
                sx={{ paddingTop: '15px' }}
                variant="middle"
              >
                <Typography>Choose expertises</Typography>
              </Divider>
              <Choices
                choices={classFeatures.map((feature) =>
                  feature.feature_specific?.expertise_options
                    ? {
                        ...feature.feature_specific?.expertise_options,
                        desc: feature.desc.find((d) => d.includes('1st'))
                      }
                    : undefined
                )}
                selected={selectedExpertises}
                setSelected={setSelectedExpertises}
              />
            </Fragment>
          )}
        </Fragment>
      )}

      <Button sx={{ float: 'left', paddingBottom: '15px' }} onClick={() => handleSubmit(onPrev)}>
        Back
      </Button>
      <Button sx={{ float: 'right' }} disabled={!isValid()} onClick={() => handleSubmit(onNext)}>
        Next
      </Button>
    </Box>
  );
}
