import {
  getAllClasses,
  getClassGuide,
  getClassInfo,
  getFeature,
  getSubclassInfo
} from '@api/ressources';
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
import type { Feature } from '@representations/abilities/feature.representation';
import type { Level } from '@representations/campaign/level.representation';
import type { Classes, Subclass } from '@representations/character/class.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { ClassGuide } from '@representations/guide.representation';
import type { CharacterFormData } from '@representations/user.representation';
import { IconText } from '@shared/IconText';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { Fragment, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { SwipeableCallbacks } from 'react-swipeable/es/types';
import { useAuth } from 'src/providers/AuthProvider';
import { getAbilityIcon } from '../CharacterCard/Characteristics/utils';
import { CardCarousel } from './CardCarousel';
import {
  mapDataForForm,
  mapFeatures,
  type ChoiceObjectType,
  type ChoiceSelection
} from './characterCreation.utils';
import { Choices } from './Choices';
import { HowToPlaySection } from './HowToPlaySection';
import { SelectionDetails } from './SelectionDetails';

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
  const { version } = useAuth();
  const [selectedClass, setselectedClass] = useState<DefaultRepresentation>();
  const [selectedSubclass, setselectedSubclass] = useState<DefaultRepresentation>();
  const [selectedProficiencies, setSelectedProficiencies] = useState<ChoiceObjectType[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<ChoiceObjectType[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<ChoiceObjectType[]>([]);
  const [selectedExpertises, setSelectedExpertises] = useState<ChoiceObjectType[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  const { data: classes } = useQuery({
    queryKey: ['fetchClasses', version],
    queryFn: async () => (version ? (await getAllClasses(version)).results : []),
    enabled: !!version
  });

  const { data: classInfo } = useQuery({
    queryKey: ['fetchClassInfo', version, selectedClass?.index],
    queryFn: async () =>
      selectedClass?.index && version
        ? ((await getClassInfo(version, selectedClass.index)) as Classes | null)
        : null,
    enabled: !!selectedClass?.index && !!version
  });

  const { data: subclassInfo } = useQuery({
    queryKey: ['fetchSubClassInfo', version, selectedClass?.index, selectedSubclass?.index],
    queryFn: async () =>
      selectedClass?.index && selectedSubclass?.index && version
        ? ((await getSubclassInfo(
            version,
            selectedClass.index,
            selectedSubclass.index
          )) as Subclass | null)
        : null,
    enabled: !!selectedClass?.index && !!version
  });

  const { data: levelInfo } = useQuery({
    queryKey: ['fetchClassInfoLevel', version, selectedClass?.index, selectedSubclass?.index, 1],
    queryFn: async () => {
      if (!selectedClass?.index || !version) return null;
      let levelRes: Level | undefined = undefined;

      const classRes = (await getClassInfo(version, selectedClass.index, 1)) as Level | null;
      if (classRes) levelRes = { ...classRes };

      if (selectedSubclass?.index) {
        const subclassRes = (await getSubclassInfo(
          version,
          selectedClass.index,
          selectedSubclass.index,
          1
        )) as Level | null;

        // Only features are added from subclass level, other info is on class level as of level 1
        if (subclassRes)
          levelRes = {
            ...(levelRes || subclassRes),
            features: [...(levelRes?.features || []), ...(subclassRes.features || [])]
          };
      }

      return levelRes ? levelRes : null;
    },
    enabled: !!selectedClass && !!version
  });

  const { data: classGuide } = useQuery({
    queryKey: ['fetchClassGuide', version, selectedClass?.index],
    queryFn: async () =>
      !selectedClass?.index || !version
        ? null
        : ((await getClassGuide(version, selectedClass.index)) as ClassGuide | null) || null,
    enabled: !!selectedClass && !!version
  });

  const { data: classFeatures } = useQueries({
    queries:
      uniqBy(levelInfo?.features, 'index')?.map(({ index }) => ({
        queryKey: ['fetchFeature', version, index],
        queryFn: async () => (version ? await getFeature(version, index) : null),
        enabled: !!index && !!version
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
  }, [classInfo?.subclasses?.map((c) => c.index).join(' ')]);

  useEffect(() => {
    const newProficiencies = selectedProficiencies.filter(
      (item) => !proficiencies.includes({ index: item.index, name: item.name, type: 'class' })
    );

    if (newProficiencies.length !== selectedProficiencies.length) {
      setSelectedProficiencies(newProficiencies);
      toast('Something changed in your class');
    }
  }, [proficiencies.map(({ index }) => index).join(', ')]);

  useEffect(() => {
    if (classes) {
      setSelectedProficiencies([]);
      setSelectedEquipments([]);
      setSelectedFeatures([]);
      setSelectedExpertises([]);
      setselectedSubclass(undefined);
      setselectedClass(classes.find((e) => e.index === classes[activeStep].index));
    }
  }, [classes, activeStep]);

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

  const classCardActions: Partial<SwipeableCallbacks> = {
    onSwipedLeft: () =>
      setActiveStep((prevActiveStep) =>
        prevActiveStep > 0 ? prevActiveStep - 1 : (classes?.length || 0) - 1
      ),
    onSwipedRight: () =>
      setActiveStep((prevActiveStep) =>
        prevActiveStep < (classes?.length || 0) - 1 ? prevActiveStep + 1 : 0
      )
  };

  return (
    <Box>
      {classes && (
        <CardCarousel
          data={classes}
          activeStep={activeStep}
          cardActions={classCardActions}
          carouselType="class"
        >
          {classGuide && <HowToPlaySection playstyle={classGuide} />}
        </CardCarousel>
      )}

      {/* {levelInfo?.ability_score_bonuses} */}
      <Box display="flex" flexDirection="row" justifyContent="center" width="100%" marginTop={5}>
        {classInfo?.saving_throws.map((ability) => (
          <IconText
            key={ability.index}
            label={ability.name.toLocaleLowerCase()}
            Icon={getAbilityIcon(ability.index)}
            color="grey"
            top="35px"
            size="40px"
          />
        ))}
      </Box>

      {!!classInfo?.subclasses?.length && (
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="subclass">Sub-Class</InputLabel>
          <Select
            fullWidth
            id="subclass"
            label="Sub-Class"
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
                key={`subclass-${currentSubclass.index}`}
                id={currentSubclass.index}
                value={currentSubclass.index}
              >
                {currentSubclass.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedClass && classInfo && levelInfo && (
        <SelectionDetails
          selected={selectedClass}
          subSelected={subclassInfo || undefined}
          features={levelInfo?.features || []}
          info={{
            spellcasting: classInfo.spellcasting,
            hit_die: classInfo.hit_die,
            proficiencies: classInfo.proficiencies,
            starting_equipment: classInfo.starting_equipment,
            spells: subclassInfo?.spells,
            class_specific: levelInfo.class_specific,
            subclass_specific: levelInfo.subclass_specific,
            prof_bonus: levelInfo.prof_bonus
          }}
          detailsType="class"
        />
      )}

      {selectedClass && (
        <Fragment>
          {classInfo?.proficiency_choices && (
            <Box data-testid="class-choices-proficiency">
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
            </Box>
          )}

          {classInfo?.starting_equipment_options && (
            <Box data-testid="class-choices-equipment">
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
            </Box>
          )}

          {classFeatures.some((feature) => feature.feature_specific?.subfeature_options) && (
            <Box data-testid="class-choices-features">
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
            </Box>
          )}

          {classFeatures.some((feature) => feature.feature_specific?.expertise_options) && (
            <Box data-testid="class-choices-expertise">
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
                        desc: feature.desc.find((d) => d.includes('1st')) || feature.desc[0]
                      }
                    : undefined
                )}
                selected={selectedExpertises}
                setSelected={setSelectedExpertises}
              />
            </Box>
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
