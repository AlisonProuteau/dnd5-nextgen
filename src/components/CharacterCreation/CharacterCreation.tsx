import type { FormEvent } from 'react';
import { Box, Button, CircularProgress, Container, Step, StepLabel, Stepper } from '@mui/material';
import { pickBy, uniqBy } from 'lodash';
import { useFirebaseCrud, useForm } from '@hooks/index';
import type { ChoiceSelection } from '@utils/character';
import type { Character, CharacterFormData } from '@representations/user.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { CharacterBackgroundForm } from './CharacterBackgroundForm';
import { CharacterClassForm } from './CharacterClassForm';
import { CharacterDescription, GenderIndexes } from './CharacterDescription';
import { CharacterRaceForm } from './CharacterRaceForm';

const steps = [
  { id: 'race', label: 'Race' },
  { id: 'class', label: 'Class' },
  { id: 'background', label: 'Background' },
  { id: 'info', label: 'Character Info' }
];

export function CharacterCreation() {
  const { version } = useAuth();
  const form = useForm<CharacterFormData>({
    steps,
    initialData: {
      sex: { index: GenderIndexes.other, name: 'Other' }
    },
    autoScroll: true
  });

  const firebaseActions = useFirebaseCrud<CharacterFormData>({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacters'],
    successMessages: {
      create: 'Character created successfully'
    },
    redirect: {
      create: { path: '/character', state: { characterId: '{id}' } }
    }
  });

  const isFormValid = () =>
    form.formData.name &&
    form.formData.age &&
    form.formData.sex &&
    form.formData.background?.index &&
    form.formData.alignment?.index &&
    form.formData.race?.index &&
    form.formData.class?.index;

  const transformFormData = (data: Partial<CharacterFormData>): Partial<Character> => {
    const skills = data.proficiencies?.filter((p) => p.index.startsWith('skill-'));
    const formattedProficiencies = data.proficiencies?.filter(
      (p) => !p.index.startsWith('saving-throw-') && !p.index.startsWith('skill-')
    );

    return pickBy(
      {
        ...data,
        class: { index: data.class?.name, name: data.class?.name },
        race: { index: data.race?.name, name: data.race?.name },
        languages: uniqBy(data.languages, 'index'),
        proficiencies: uniqBy(formattedProficiencies, 'index'),
        skills: uniqBy(skills, 'index'),
        equipments: data.equipments?.reduce((acc: ChoiceSelection[], curr) => {
          const existingIndex = acc.findIndex(({ index }) => index === curr.index);
          if (existingIndex >= 0) {
            return acc.with(existingIndex, {
              ...curr,
              count: (acc[existingIndex].count || 1) + (curr.count || 1)
            });
          }
          return [...acc, curr];
        }, []),
        level: 1
      },
      (d) => !!(Array.isArray(d) ? d?.length : d)
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid()) return;

    await firebaseActions.create({ ...transformFormData(form.formData), version });
  };

  return (
    <Container sx={{ overflowX: 'clip' }}>
      <Stepper
        activeStep={form.activeStep}
        sx={{ marginBottom: '15px' }}
        alternativeLabel
        data-testid="character-stepper"
        role="tablist"
      >
        {form.steps.map(({ id, label }) => (
          <Step key={id} active={form.steps[form.activeStep].id === id}>
            <StepLabel
              data-testid="step-label"
              className={steps[form.activeStep].id === id ? 'active' : ''}
              aria-selected={steps[form.activeStep].id === id}
              role="tab"
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {!firebaseActions.isLoading ? (
        <form
          onSubmit={handleSubmit}
          onFocus={({ target }) => form.clearFieldError(target.id as keyof CharacterFormData)}
          onInvalid={({ target }) =>
            form.setErrors({ [(target as HTMLFormElement).id]: ['Invalid'] })
          }
          onReset={() => {
            form.resetForm();
          }}
        >
          <Box display={form.steps[form.activeStep].id === 'race' ? 'revert' : 'none'}>
            <CharacterRaceForm
              onNext={(input) => {
                form.setFormData(input);
                form.nextStep();
              }}
              proficiencies={form.formData.proficiencies}
            />
          </Box>

          <Box display={form.steps[form.activeStep].id === 'class' ? 'revert' : 'none'}>
            <CharacterClassForm
              onNext={(input) => {
                form.setFormData(input);
                form.nextStep();
              }}
              onPrev={(input) => {
                form.setFormData(input);
                form.prevStep();
              }}
              proficiencies={form.formData.proficiencies}
            />
          </Box>

          <Box display={form.steps[form.activeStep].id === 'background' ? 'revert' : 'none'}>
            <CharacterBackgroundForm
              onNext={(input) => {
                form.setFormData(input);
                form.nextStep();
              }}
              onPrev={(input) => {
                form.setFormData(input);
                form.prevStep();
              }}
              proficiencies={form.formData.proficiencies}
              languages={form.formData.languages}
              equipment={form.formData.equipments}
            />
          </Box>

          <Box display={form.steps[form.activeStep].id === 'info' ? 'revert' : 'none'}>
            <CharacterDescription setFormData={form.setFormData} onPrev={() => form.prevStep()} />
          </Box>

          {form.isLastStep && (
            <Button
              sx={{ float: 'right' }}
              variant="contained"
              type="submit"
              disabled={!form.isValid || !isFormValid()}
            >
              Create
            </Button>
          )}
        </form>
      ) : (
        <CircularProgress size={24} />
      )}
    </Container>
  );
}
