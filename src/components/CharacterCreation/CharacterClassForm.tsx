import { getAllClasses, getClassInfo, getFeature, getSubclassInfo } from '@api/ressources';
import { Close, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import type { Feature } from '@representations/abilities/feature.representation';
import type { Level } from '@representations/campaign/level.representation';
import type { Classes, Subclass } from '@representations/character/class.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { CharacterFormData } from '@representations/user.representation';
import { AccordionButton } from '@shared/AccordionButton';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { SwipeableCallbacks } from 'react-swipeable/es/types';
import { useAuth } from 'src/providers/AuthProvider';
import { FeaturesDisplay } from '../CharacterCard/Characteristics/FeaturesDisplay';
import { CardCarousel } from './CardCarousel';
import {
  mapDataForForm,
  mapFeatures,
  type ChoiceObjectType,
  type ChoiceSelection
} from './characterCreation.utils';
import { Choices } from './Choices';
import { BestForSection, ClassGuide, ProConList } from './utils';

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
  const [featuresOpen, setFeaturesOpen] = useState(false);

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
      let levelRes: Partial<Level> = {};

      const classRes = (await getClassInfo(version, selectedClass.index, 1)) as Level | null;
      if (classRes) levelRes = { ...classRes };

      if (selectedSubclass?.index) {
        const subclassRes = (await getSubclassInfo(
          version,
          selectedClass.index,
          selectedSubclass.index,
          1
        )) as Level | null;

        // TODO: More stuff?
        if (subclassRes)
          levelRes = {
            ...levelRes,
            features: [...(levelRes.features || []), ...(subclassRes.features || [])]
          };
      }

      return Object.keys(levelRes).length ? (levelRes as Level) : null;
    },
    enabled: !!selectedClass && !!version
  });

  const { data: classFeatures } = useQueries({
    queries:
      levelInfo?.features?.map(({ index }) => ({
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

  const scrollOnOpen = useCallback(
    ({ currentTarget }: { currentTarget: EventTarget & Element }, expanded: boolean) => {
      expanded && setTimeout(() => currentTarget.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    []
  );

  const selectedClassPlaystyle = useMemo(
    () => ClassGuide.find(({ index }) => index === selectedClass?.index),
    [selectedClass?.index]
  );

  return (
    <Box>
      {/* TODO: Add image to firestore */}
      {classes && (
        <CardCarousel data={classes} activeStep={activeStep} cardActions={classCardActions} />
      )}

      {!!classInfo?.subclasses?.length && (
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="subRace">Sub-Class</InputLabel>
          <Select
            fullWidth
            id="subRace"
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

      <Box marginY={2} display="flex" flexDirection="column" gap={1}>
        {selectedClass && classInfo && (
          <Fragment>
            {/* TODO: should it be moved to a question mark action button? */}
            {selectedClassPlaystyle && (
              <Accordion
                key={`${selectedClass.index}-howTo`}
                disableGutters
                onChange={scrollOnOpen}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">How to Play</Typography>
                  </Divider>
                </AccordionSummary>
                <AccordionDetails sx={{ textAlign: 'justify' }}>
                  <Typography variant="overline">Playstyle</Typography>
                  <Typography marginBottom={2}>{selectedClassPlaystyle.playstyle}</Typography>

                  <Typography variant="overline">Evolution</Typography>
                  <Typography marginBottom={2}>{selectedClassPlaystyle.evolution}</Typography>

                  <ProConList items={selectedClassPlaystyle.pros} type="pros" />
                  <ProConList items={selectedClassPlaystyle.cons} type="cons" />

                  <BestForSection bestForArray={selectedClassPlaystyle.bestFor} />

                  {selectedClassPlaystyle.subclasses?.length && (
                    <Box>
                      <Typography variant="overline">Subclasses</Typography>
                      {selectedClassPlaystyle.subclasses.map((subclass) => (
                        <Accordion key={subclass.index} disableGutters sx={{ boxShadow: 'none' }}>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="overline" fontWeight="bold">
                              {subclass.name}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Fragment>
                              <Typography variant="overline">Playstyle</Typography>
                              <Typography marginBottom={2}>{subclass.playstyle}</Typography>

                              <Typography variant="overline">Evolution</Typography>
                              <Typography marginBottom={2}>{subclass.evolution}</Typography>

                              <BestForSection bestForArray={subclass.bestFor} />
                            </Fragment>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            <Accordion
              key={`${selectedClass.index}-description`}
              disableGutters
              onChange={scrollOnOpen}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">Description</Typography>
                </Divider>
              </AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                <Typography variant="overline">{selectedClass.name}</Typography>
                <Typography marginBottom={2}>{selectedClass.desc}</Typography>
                {/* TODO: Add to firestore */}

                {selectedSubclass && subclassInfo && (
                  <Fragment>
                    <Typography variant="overline">
                      {selectedSubclass.name} - {subclassInfo.subclass_flavor}
                    </Typography>
                    <Typography marginBottom={2}>{subclassInfo.desc}</Typography>
                  </Fragment>
                )}
              </AccordionDetails>
            </Accordion>

            {/* selectedClass hit_die proficiencies saving_throws starting_equipment_options classInfo
            ability_score_bonuses class_specific features prof_bonus */}
            {/* <Accordion
              key={`${classInfo.index}-characteristics`}
              disableGutters
              onChange={scrollOnOpen}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">Characteristics</Typography>
                </Divider>
              </AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                <Typography variant="overline">Size</Typography>
                <Typography marginBottom={2}>{classInfo.size_description}</Typography>

                <Typography variant="overline">Speed</Typography>
                <Typography marginBottom={2}>{classInfo?.speed ?? raceInfo.speed}ft</Typography>

                <Typography variant="overline">Age</Typography>
                <Typography marginBottom={2}>{classInfo.age}</Typography>

                <Typography variant="overline">Alignment</Typography>
                <Typography marginBottom={2}>{classInfo.alignment}</Typography>

                <Typography variant="overline">Languages</Typography>
                <Typography marginBottom={2}>{classInfo.language_desc}</Typography>

                {classInfo.starting_proficiencies?.length ||
                subraceInfo?.starting_proficiencies?.length ? (
                  <Fragment>
                    <Typography variant="overline">Starting Proficiencies:</Typography>
                    <Typography marginBottom={2}>
                      {(classInfo.starting_proficiencies || [])
                        .concat(subraceInfo?.starting_proficiencies || [])
                        .map((p) => p.name)
                        .join(', ')}
                    </Typography>
                  </Fragment>
                ) : null}
              </AccordionDetails>
            </Accordion> */}

            {levelInfo?.features?.length ? (
              <Fragment>
                <AccordionButton
                  fullWidth
                  title={`Traits (${levelInfo.features.length})`}
                  onClick={() => setFeaturesOpen(true)}
                />
                <Dialog open={featuresOpen} onClose={() => setFeaturesOpen(false)}>
                  <DialogTitle>Features</DialogTitle>
                  <IconButton
                    aria-label="close"
                    onClick={() => setFeaturesOpen(false)}
                    sx={(theme) => ({
                      position: 'absolute',
                      right: 2,
                      top: 2,
                      color: theme.palette.grey[500]
                    })}
                  >
                    <Close />
                  </IconButton>
                  <DialogContent sx={{ paddingTop: 0 }}>
                    <FeaturesDisplay
                      character={{
                        features: levelInfo?.features,
                        version: version || 'Legacy'
                      }}
                      useblackList={false}
                    />
                  </DialogContent>
                </Dialog>
              </Fragment>
            ) : null}
          </Fragment>
        )}
      </Box>

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
                        desc: feature.desc.find((d) => d.includes('1st')) || feature.desc[0]
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
