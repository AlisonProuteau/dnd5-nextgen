import { getAllRaces, getRaceInfo, getSubraceInfo, getTrait } from '@api/ressources';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardMedia,
  Divider,
  FormControl,
  Icon,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import type { Trait } from '@representations/abilities/trait.representation';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { CharacterFormData } from '@representations/user.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { Fragment, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSwipeable } from 'react-swipeable';
import { useAuth } from 'src/providers/AuthProvider';
// import type { races } from '../CharacterGenerator/utils/imageUtils';
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

function DesignCard({
  title,
  img,
  height = 400,
  onClick,
  selected = false
}: {
  title: string;
  img: string;
  height?: number;
  onClick?: () => any;
  selected?: boolean;
}) {
  const DesignCardContent = () => {
    const theme = useTheme();
    return (
      <Box height="100%" position="relative">
        <CardMedia
          sx={{
            height: '100%',
            objectFit: 'scale-down',
            overflow: 'hidden'
          }}
          component="img"
          image={img}
          alt={`Race visual ${title}`}
        />
        <Typography
          position="absolute"
          bottom={5}
          width={'100%'}
          textAlign="center"
          color="white"
          sx={{ textShadow: `${theme.palette.primary.main} 0px 0px 1px` }}
        >
          {title}
        </Typography>
      </Box>
    );
  };

  return (
    <Card
      key={`card-${title}`}
      elevation={0}
      style={{
        justifySelf: 'center',
        width: `${0.65 * height}px`,
        height: `${height}px`,
        border: selected ? '2px solid rgb(144, 202, 249)' : '1px solid transparent',
        boxShadow: selected
          ? '0 0 12px rgba(144, 202, 249, 0.4)'
          : '0 0 6px rgba(255, 255, 255, 0.3)',
        borderRadius: 16,
        padding: 5
      }}
    >
      {onClick ? (
        <CardActionArea sx={{ height: '100%' }} onClick={() => onClick?.()}>
          <DesignCardContent />
        </CardActionArea>
      ) : (
        <DesignCardContent />
      )}
    </Card>
  );
}

function CardCarousel({
  data,
  activeStep,
  handleNext,
  handleBack,
  swipeHandlers
}: {
  data: (DefaultRepresentation & { img?: string })[];
  activeStep: number;
  handleNext: () => void;
  handleBack: () => void;
  swipeHandlers: any;
}) {
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('sm'));

  return (
    <Box
      display="flex"
      gap="15px"
      width="100%"
      justifyContent="center"
      alignItems="center"
      {...swipeHandlers}
      margin={2}
    >
      <IconButton onClick={handleBack} size="large">
        <Icon>
          <ArrowBackIos />
        </Icon>
      </IconButton>
      {!isMobile && (
        <DesignCard
          title={data[activeStep > 0 ? activeStep - 1 : data.length - 1].name}
          img={data[activeStep > 0 ? activeStep - 1 : data.length - 1].img || ''}
          height={300}
          onClick={handleBack}
        />
      )}
      <DesignCard title={data[activeStep].name} img={data[activeStep].img || ''} selected={true} />

      {!isMobile && (
        <DesignCard
          title={data[activeStep < data.length - 1 ? activeStep + 1 : 0].name}
          img={data[activeStep < data.length - 1 ? activeStep + 1 : 0].img || ''}
          height={300}
          onClick={handleNext}
        />
      )}
      <IconButton onClick={handleNext} size="large">
        <Icon>
          <ArrowForwardIos />
        </Icon>
      </IconButton>
    </Box>
  );
}

export function CharacterRaceForm({
  onNext,
  proficiencies = [],
  languages = []
}: CharacterRaceFormProps) {
  const { version } = useAuth();
  const [selectedRace, setselectedRace] = useState<DefaultRepresentation>();
  const [selectedSubrace, setselectedSubrace] = useState<DefaultRepresentation>();
  const [selectedProficiencies, setSelectedProficiencies] = useState<ChoiceObjectType[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<ChoiceObjectType[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<RaceAbilityBonus[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<ChoiceObjectType[]>([]);
  const [selectedSpells, setSelectedSpells] = useState<ChoiceObjectType[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  const { data: races } = useQuery({
    queryKey: ['fetchRaces', version],
    queryFn: async () => (version ? (await getAllRaces(version)).results : []),
    enabled: !!version
  });

  const { data: raceInfo } = useQuery({
    queryKey: ['fetchRaceInfo', version, selectedRace?.index],
    queryFn: async () =>
      selectedRace?.index && version ? await getRaceInfo(version, selectedRace.index) : null,
    enabled: !!selectedRace?.index && !!version
  });

  const { data: subraceInfo } = useQuery({
    queryKey: ['fetchSubraceInfo', version, selectedRace?.index, selectedSubrace?.index],
    queryFn: async () =>
      selectedRace?.index && selectedSubrace?.index && version
        ? await getSubraceInfo(version, selectedRace.index, selectedSubrace.index)
        : null,
    enabled: !!selectedRace?.index && !!version
  });

  const { data: raceTraits } = useQueries({
    queries:
      (raceInfo?.traits || []).concat(subraceInfo?.racial_traits || [])?.map(({ index }) => ({
        queryKey: ['fetchTrait', version, index],
        queryFn: async () => (version ? await getTrait(version, index) : null),
        enabled: !!index && !!version
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

  useEffect(() => {
    if (races) {
      setSelectedProficiencies([]);
      setSelectedLanguages([]);
      setSelectedAbilities([]);
      setselectedSubrace(undefined);
      setselectedRace(races.find((e) => e.index === races[activeStep].index));
    }
  }, [races, activeStep]);

  const handleNext = () =>
    setActiveStep((prevActiveStep) =>
      prevActiveStep < (races?.length || 0) - 1 ? prevActiveStep + 1 : 0
    );
  const handleBack = () =>
    setActiveStep((prevActiveStep) =>
      prevActiveStep > 0 ? prevActiveStep - 1 : (races?.length || 0) - 1
    );
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handleBack
  });

  const isValid = () =>
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
    (raceInfo?.starting_proficiency_options?.choose || 0) <= selectedProficiencies.length &&
    (raceInfo?.language_options?.choose || 0) + (subraceInfo?.language_options?.choose || 0) <=
      selectedLanguages.length &&
    (raceInfo?.ability_bonus_options?.choose || 0) <= selectedAbilities.length;

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
        <CardCarousel
          data={races}
          activeStep={activeStep}
          handleNext={handleNext}
          handleBack={handleBack}
          swipeHandlers={swipeHandlers}
        />
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

      {/* TODO: Finish character description display */}
      {/* TODO: Should I add for subraces? */}
      <Box margin={2}>
        {selectedRace && <Typography>{selectedRace.desc}</Typography>}
        {raceInfo && (
          <Box>
            <Typography>{raceInfo.size_description}</Typography>
            <Typography>{raceInfo.speed}ft</Typography>
            <Typography> {raceInfo.age}</Typography>
            <Typography> {raceInfo.alignment}</Typography>
            <Typography> {raceInfo.language_desc}</Typography>
            {raceInfo.starting_proficiencies?.length ? (
              <Typography> {JSON.stringify(raceInfo.starting_proficiencies)}</Typography>
            ) : null}
            {raceInfo.traits?.length ? (
              <Typography>Traits: {raceInfo.traits?.map((d) => d.name).join(' ; ')}</Typography>
            ) : null}
            <Typography>
              Ability Bonuses:{' '}
              {raceInfo.ability_bonuses
                .map((d) => `${d.ability_score.name} +${d.bonus}`)
                .join(' ; ')}
            </Typography>
          </Box>
        )}
      </Box>

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
