import { getUserCharacters } from '@api/users';
import {
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { ControledInput } from '@shared/ControledInput';
import { useQuery } from '@tanstack/react-query';
import { omit } from 'lodash';
import { Fragment, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from 'src/providers/AuthProvider';

enum ContactType {
  FEEDBACK = 'Feedback',
  BUG = 'Bug',
  REQUEST = 'Request'
}

enum BugSeverity {
  CRITICAL = 'Critical',
  MAJOR = 'Major',
  MEDIUM = 'Medium',
  MINOR = 'Minor',
  TRIVIAL = 'Trivial'
}

enum AppArea {
  NAV = 'Navigation',
  AUTH = 'Authentification',
  CREATION = 'Character Creation',
  POINTS = 'Character Points',
  SHEET = 'Character Sheet',
  SPELLS = 'Spells',
  OTHER = 'Other'
}

interface FormData {
  type: ContactType;
  canContact: boolean;
  severity?: BugSeverity;
  area?: AppArea | string;
  summary?: string;
  reproSteps?: string;
  character?: string;
  corrupted?: boolean;
  message?: string;
}

export function ContactForm() {
  const { user, version } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormDataState] = useState<FormData>({
    type: ContactType.FEEDBACK,
    canContact: false
  });
  const [formError, setFormErrorState] = useState<{
    message?: boolean;
    area?: boolean;
    summary?: boolean;
    reproSteps?: boolean;
  }>({});

  const setFormData = (values: Partial<FormData>) => {
    const formatedObject = { ...formData, ...values };

    if (formatedObject) {
      Object.keys(formatedObject).forEach((key) => {
        if (values[key as keyof FormData] === undefined || values[key as keyof FormData] === '')
          omit(formatedObject, key);
      });

      setFormDataState(formatedObject);
    }
  };

  const setFormError = (values: Partial<typeof formError>) => {
    setFormErrorState({ ...formError, ...values });
  };

  const isFormValid = () => {
    return formData.type && !Object.values(formError).some((v) => v);
  };

  const validateInput = ({ target }: { target: EventTarget & HTMLFormElement }) => {
    const currentData = formData[target.id as keyof FormData]?.toString();
    if (!target.checkValidity || !target.checkValidity() || !currentData) return;

    if (target.id === 'area') {
      setFormError({ [target.id]: currentData === AppArea.OTHER });
    }
  };

  const { data: characters, isLoading: isCharactersLoading } = useQuery({
    queryKey: ['fetchCharacters', user?.uid, version],
    queryFn: async () => (user && version ? await getUserCharacters(user.uid, version) : null),
    enabled: !!(user?.uid && version)
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    if (isFormValid() && user?.uid) {
      // TODO: save or send?
      console.log(formData);
    }
    setIsSaving(false);
  };

  const resetForm = () => {
    setFormDataState({ type: ContactType.FEEDBACK, canContact: formData.canContact ?? false });
    setFormErrorState({});
  };

  const isAppArea = useMemo(
    () => Object.values(AppArea).includes(formData.area as AppArea),
    [formData.area]
  );

  return (
    <Container maxWidth="xs">
      <form
        onSubmit={handleSubmit}
        onBlur={validateInput}
        onFocus={({ target }) => setFormError({ [target.id]: false })}
        onInvalid={({ target }) => setFormError({ [(target as HTMLFormElement).id]: true })}
        onReset={resetForm}
      >
        {!isSaving ? (
          <Fragment>
            <FormControl margin="dense" fullWidth required>
              <InputLabel htmlFor="type">Contact Type</InputLabel>
              <Select
                id="type"
                label="Contact Type"
                value={formData.type}
                onChange={({ target }) => {
                  const type = target.value as ContactType;

                  setFormDataState({
                    type,
                    canContact: formData.canContact || false,
                    message:
                      type === ContactType.BUG || formData.type === ContactType.BUG
                        ? undefined
                        : formData.message
                  });
                }}
              >
                {Object.values(ContactType).map((contactType) => (
                  <MenuItem key={contactType} value={contactType}>
                    {contactType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.type === ContactType.BUG && (
              <Fragment>
                <FormControl margin="dense" fullWidth required>
                  <InputLabel htmlFor="severity">Severity</InputLabel>
                  <Select
                    id={`severity`}
                    label="Severity"
                    value={formData.severity || BugSeverity.MEDIUM}
                    onChange={({ target }) =>
                      setFormData({ severity: target.value as BugSeverity })
                    }
                  >
                    {Object.values(BugSeverity).map((bugSeverity) => (
                      <MenuItem key={bugSeverity} value={bugSeverity}>
                        {bugSeverity}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl margin="dense" fullWidth required>
                  <InputLabel htmlFor="area">Area</InputLabel>
                  <Select
                    id="area"
                    label="Area"
                    value={formData.area ? (!isAppArea ? AppArea.OTHER : formData.area) : ''}
                    onChange={({ target }) => setFormData({ area: target.value as AppArea })}
                  >
                    {Object.values(AppArea).map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                  {formData.area && (formData.area === 'Other' || !isAppArea) && (
                    <ControledInput
                      required
                      id="area"
                      label="Area"
                      onChange={(value) =>
                        setFormData({ area: value ? value.toString() : AppArea.OTHER })
                      }
                      hasError={formError.area}
                      errorMessage={['Required']}
                    />
                  )}
                </FormControl>
                <ControledInput
                  fullWidth
                  required
                  id="summary"
                  label="Summary"
                  onChange={(value) => setFormData({ summary: value?.toString() })}
                  hasError={formError.summary}
                  errorMessage={['Required']}
                />
                <ControledInput
                  fullWidth
                  multiline
                  required
                  id="reproSteps"
                  label="Reproduction Steps"
                  onChange={(value) => setFormData({ reproSteps: value?.toString() })}
                  hasError={formError.reproSteps}
                  errorMessage={['Required']}
                />
                {!isCharactersLoading &&
                  characters?.length &&
                  formData.area &&
                  ![AppArea.NAV, AppArea.AUTH].includes(formData.area as AppArea) && (
                    <FormControl margin="dense" fullWidth>
                      <InputLabel htmlFor="Character">Character</InputLabel>
                      <Select
                        id="character"
                        label="Character"
                        value={formData.character || ''}
                        onChange={({ target }) =>
                          setFormData({ character: target.value.toString() })
                        }
                      >
                        {characters.map((character) => (
                          <MenuItem key={`character-${character.id}`} value={character.id}>
                            {character.name} - {character.race.name} {character.class.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                <FormControlLabel
                  sx={{ marginX: 0 }}
                  control={
                    <Checkbox
                      id="corrupted"
                      defaultValue="false"
                      onChange={(_, checked) => setFormData({ corrupted: checked })}
                    />
                  }
                  label="Data is corrupted"
                />
              </Fragment>
            )}

            {/* TODO: Type (Content - race, class, language etc, Feature, Improvement, Other) */}
            {formData.type === ContactType.REQUEST && <Fragment></Fragment>}

            {/* TODO: Anonymous */}
            {formData.type === ContactType.FEEDBACK && <Fragment></Fragment>}

            {formData.type !== ContactType.BUG && (
              <ControledInput
                fullWidth
                multiline
                required
                id="message"
                label="Message"
                onChange={(value) => setFormData({ message: value?.toString() })}
                hasError={formError.message}
                errorMessage={['Required']}
              />
            )}

            <FormControlLabel
              sx={{ marginX: 0 }}
              control={
                <Checkbox
                  id="canContact"
                  defaultValue="false"
                  onChange={(_, checked) => setFormData({ canContact: checked })}
                />
              }
              label="Accept to be contacted about this"
            />
          </Fragment>
        ) : (
          <CircularProgress size={24} />
        )}

        <Button
          disabled={!isFormValid() || isSaving}
          sx={{ marginTop: '1rem' }}
          fullWidth
          type="submit"
          variant="contained"
        >
          Submit
        </Button>
      </form>
    </Container>
  );
}
