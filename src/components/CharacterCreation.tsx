import {
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { omit } from 'lodash';
import { useState, type FormEvent } from 'react';
import { useQuery } from 'react-query';
import { getAllClasses, getClasseInfo } from '../api/classes';
import type { DefaultInstance } from '../representations/default.representation';
import { ControledInput } from './ControledInput';

interface FormData {
  name: string;
  class: DefaultInstance;
  proficiencies: DefaultInstance[];
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

  const { data: classes } = useQuery('fetchClasses', async () => {
    return (await getAllClasses()).results;
  });

  const { data: classInfo } = useQuery(
    ['fetchClassInfo', formData.class?.index],
    async () => {
      if (!formData.class?.index) return;

      return await getClasseInfo(formData.class?.index);
    },
    { enabled: !!formData.class?.index }
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

        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="class">Class</InputLabel>
          <Select
            fullWidth
            id="class"
            label="Class"
            disabled={!classes}
            onChange={({ target }) =>
              setFormData({ class: classes?.find((e) => e.index === target.value) })
            }
          >
            {classes?.map((currentClass) => (
              <MenuItem key={currentClass.index} value={currentClass.index}>
                {currentClass.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {classInfo && (
          <FormControl fullWidth margin="dense" component="fieldset">
            <FormLabel component="legend">Proficiencies</FormLabel>
            {classInfo.proficiency_choices?.map((choice, i) => (
              <FormGroup key={i} id="proficiencies">
                {choice.from.options.map(({ item }) => (
                  <FormControlLabel
                    key={`proficiency-${i}-${item.index}`}
                    control={
                      <Checkbox
                        disabled={(formData.proficiencies?.length || 0) >= choice.choose}
                        onChange={(_, checked) => {
                          // TODO: Fix the disabled to be able to deselect
                          // Fix: Cleanup function

                          let prof = [...(formData.proficiencies || [])];
                          if (!checked) {
                            prof.splice(prof.findIndex((current) => current.index === item.index));
                          } else {
                            prof = prof.concat(item);
                          }
                          setFormDataState({
                            ...formData,
                            proficiencies: prof.length ? prof : undefined
                          });
                          console.log(prof);
                        }}
                      />
                    }
                    label={item.name}
                  />
                ))}
              </FormGroup>
            ))}
          </FormControl>
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
