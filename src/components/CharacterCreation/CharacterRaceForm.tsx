import { getAllRaces, getRaceInfo, getSubraceInfo, getTrait } from '@api/ressources';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  RotateLeft,
  RotateRight
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  MobileStepper,
  Select,
  Typography
} from '@mui/material';
import type { Trait } from '@representations/abilities/trait.representation';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { CharacterFormData } from '@representations/user.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { Fragment, useCallback, useEffect, useState, type ReactElement } from 'react';
import ReactCardFlip from 'react-card-flip';
import toast from 'react-hot-toast';
import { useSwipeable } from 'react-swipeable';
import { useAuth } from 'src/providers/AuthProvider';
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

function DesignFlipCard({
  title,
  img,
  height = 430,
  onClick,
  children
}: {
  title: string;
  img: string;
  height?: number;
  onClick?: () => any;
  children?: ReactElement;
}) {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const borderCSS = `
              justify-self: center;
              position: relative;

                border-radius:15px;
                background:
                  /*corners*/
                  radial-gradient(farthest-side at bottom right,rgba(61, 39, 65, 0) 20%, rgba(206, 147, 216, 0.3)) top    left /10px 10px,
                  radial-gradient(farthest-side at top    right,rgba(61, 39, 65, 0) 20%, rgba(206, 147, 216, 0.3)) bottom left /10px 10px,
                  radial-gradient(farthest-side at bottom left ,rgba(61, 39, 65, 0) 20%, rgba(206, 147, 216, 0.3)) top    right/10px 10px,
                  radial-gradient(farthest-side at top    left ,rgba(61, 39, 65, 0) 20%, rgba(206, 147, 216, 0.3)) bottom right/10px 10px,

                  /*borders*/
                  linear-gradient(to top   ,rgba(61, 39, 65, 0) 20%, rgba(206, 147, 216, 0.3)) top   /calc(100% - 2*10px) 10px,
                  linear-gradient(to bottom,rgba(61, 39, 65, 0) 20%, rgba(206, 147, 216, 0.3)) bottom/calc(100% - 2*10px) 10px,
                  linear-gradient(to right ,rgba(61, 39, 65, 0) 20%, rgba(206, 147, 216, 0.3)) right /10px calc(100% - 2*10px),
                  linear-gradient(to left  ,rgba(61, 39, 65, 0) 20%, rgba(206, 147, 216, 0.3)) left  /10px calc(100% - 2*10px);
                background-repeat:no-repeat;`;

  return (
    // @ts-ignore
    <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal" key={`flip-card-${title}`}>
      {...[true, false].map((recto) => (
        <Card
          key={`flip-card-${title}-${recto ? 'recto' : 'verso'}`}
          style={{
            width: `${0.65 * height}px`,
            height: `${height}px`
          }}
          // @ts-ignore
          sx={borderCSS}
        >
          <CardActionArea
            onClick={() => {
              if (children) setIsFlipped((prevState) => !prevState);
              if (onClick) onClick();
            }}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <>
              {recto ? (
                <CardMedia
                  sx={{
                    objectFit: 'scale-down',
                    height: '100%',
                    overflow: 'hidden',
                    zIndex: -1,
                    paddingTop: '15px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }}
                  component="img"
                  image={img}
                  alt={`Race visual ${title}`}
                />
              ) : (
                children
              )}
              <Typography position="absolute" bottom={20}>
                {title}
              </Typography>
              <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
                {recto ? <RotateRight /> : <RotateLeft />}
              </Box>
            </>
          </CardActionArea>
        </Card>
      ))}
    </ReactCardFlip>
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
        <Fragment>
          <MobileStepper
            variant="dots"
            steps={races.length}
            position="static"
            activeStep={activeStep}
            sx={{ paddingTop: 0 }}
            nextButton={
              <Button size="small" onClick={handleNext}>
                <KeyboardArrowRight />
              </Button>
            }
            backButton={
              <Button size="small" onClick={handleBack}>
                <KeyboardArrowLeft />
              </Button>
            }
          />

          <Box
            display="flex"
            gap="15px"
            width="100%"
            justifyContent="center"
            alignItems="center"
            {...swipeHandlers}
          >
            <DesignFlipCard
              title={races[activeStep > 0 ? activeStep - 1 : races.length - 1].name}
              img={races[activeStep > 0 ? activeStep - 1 : races.length - 1].img || ''}
              height={300}
              onClick={handleBack}
            />

            <DesignFlipCard title={races[activeStep].name} img={races[activeStep].img || ''}>
              <CardContent
                sx={{ flex: 1, alignContent: 'center', maxHeight: '80%', overflow: 'scroll' }}
              >
                <Typography
                  typography="justifySelf"
                  sx={{ color: 'text.secondary' }}
                  variant="body2"
                >
                  {races[activeStep].desc}
                </Typography>
              </CardContent>
            </DesignFlipCard>

            <DesignFlipCard
              title={races[activeStep < races.length - 1 ? activeStep + 1 : 0].name}
              img={races[activeStep < races.length - 1 ? activeStep + 1 : 0].img || ''}
              height={300}
              onClick={handleNext}
            />
          </Box>
        </Fragment>
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
