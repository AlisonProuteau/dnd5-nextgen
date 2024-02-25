import {
  Box,
  Button,
  Checkbox,
  Container,
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
import { omit } from 'lodash';
import { useState, type FormEvent } from 'react';
import { useQuery } from 'react-query';
import { getAllClasses, getAllRaces, getClassInfo, getRaceInfo } from '../api/characters';
import type { DefaultInstance, OptionFrom } from '../representations/default.representation';
import { ControledInput } from './ControledInput';

interface FormData {
  name: string;
  race: DefaultInstance;
  subrace?: DefaultInstance;
  class: DefaultInstance;
  proficiencies: (DefaultInstance & { type: number })[];
}

export function CharacterCreation() {
  const [formData, setFormDataState] = useState<Partial<FormData>>({});
  const [formError, setFormErrorState] = useState<{ name?: boolean }>({});

  const setFormData = (values: Partial<FormData>) => {
    const formatedObject = { ...formData, ...values };

    Object.keys(formatedObject).forEach((key) => {
      if (values[key as keyof FormData] === undefined || values[key as keyof FormData] === '')
        omit(formatedObject, key);
    });

    setFormDataState(formatedObject);
  };

  const setFormError = (values: Partial<typeof formError>) => {
    setFormErrorState({ ...formError, ...values });
  };

  const { data: races } = useQuery('fetchRaces', async () => {
    return (await getAllRaces()).results;
  });

  const { data: raceInfo } = useQuery(
    ['fetchRaceInfo', formData.race?.index],
    async () => {
      if (!formData.race?.index) return;

      return await getRaceInfo(formData.race?.index);
    },
    { enabled: !!formData.race?.index }
  );

  const { data: classes } = useQuery('fetchClasses', async () => {
    return (await getAllClasses()).results;
  });

  const { data: classInfo } = useQuery(
    ['fetchClassInfo', formData.class?.index],
    async () => {
      if (!formData.class?.index) return;

      return await getClassInfo(formData.class?.index);
    },
    { enabled: !!formData.class?.index }
  );

  const onProficiencySelect = (checked: boolean, item: DefaultInstance, i: number) => {
    console.log(item);
    if (checked) {
      setFormData({
        proficiencies: [...(formData.proficiencies || []), { ...item, type: i }]
      });
    } else if (formData.proficiencies?.length) {
      const proficiencyIndex = formData.proficiencies.findIndex(
        ({ index }) => index === item.index
      );

      setFormData({ proficiencies: formData.proficiencies.toSpliced(proficiencyIndex, 1) });
    }
  };

  const generateProficiencyChoices = (i: number, choose: number, options: [OptionFrom]) =>
    options[0].item ? (
      <FormGroup id={`proficiencies-${i}`}>
        {options.map(
          //Check why monk is broken
          ({ item }) =>
            item && (
              <FormControlLabel
                key={`proficiency-${i}-${item.index}`}
                control={
                  <Checkbox
                    id={`proficiency-${i}-${item.index}`}
                    disabled={
                      !formData.proficiencies?.find(({ index }) => index === item.index) &&
                      (formData.proficiencies?.filter(({ type }) => type === i).length || 0) >=
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

  const isFormValid = () => {
    return formData.name && !Object.values(formError).some((v) => v);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log(formData);
  };

  return (
    <Container>
      <form
        onSubmit={handleSubmit}
        onFocus={({ target }) => setFormError({ [target.id]: false })}
        onInvalid={({ target }) => setFormError({ [(target as HTMLFormElement).id]: true })}
        onReset={() => {
          setFormDataState({});
          setFormErrorState({});
        }}
      >
        <ControledInput
          id="email"
          label="Name"
          onChange={(value) => setFormData({ name: value as string })}
          errorMessage="Invalid Email"
          hasError={formError.name}
        />

        <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
          <Typography>Race Selection</Typography>
        </Divider>
        {races && (
          <FormControl fullWidth margin="dense">
            <InputLabel htmlFor="race">Race</InputLabel>
            <Select
              fullWidth
              id="race"
              label="Race"
              disabled={!races}
              defaultValue=""
              onChange={({ target }) =>
                setFormData({ race: races.find((e) => e.index === target.value) })
              }
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
              defaultValue={raceInfo.subraces[0].index}
              onChange={({ target }) =>
                setFormData({ subrace: raceInfo.subraces?.find((e) => e.index === target.value) })
              }
            >
              {raceInfo.subraces.map((currentSubRace) => (
                <MenuItem
                  key={currentSubRace.index}
                  id={currentSubRace.index}
                  value={currentSubRace.index}
                >
                  {currentSubRace.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

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
              defaultValue=""
              onChange={({ target }) =>
                setFormData({
                  class: classes.find((e) => e.index === target.value),
                  proficiencies: []
                })
              }
            >
              {classes.map((currentClass) => (
                <MenuItem
                  key={currentClass.index}
                  id={currentClass.index}
                  value={currentClass.index}
                >
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
                <FormControl
                  key={`proficiencies-${i}`}
                  fullWidth
                  margin="dense"
                  component="fieldset"
                >
                  <FormLabel component="legend">{desc}</FormLabel>
                  {generateProficiencyChoices(i, choose, options)}
                </FormControl>
              ))}
            </Box>
          </Box>
        )}

        <Button
          disabled={!isFormValid()}
          sx={{ marginTop: '1rem' }}
          fullWidth
          type="submit"
          variant="contained"
        >
          Create
        </Button>
      </form>
    </Container>
  );
}
