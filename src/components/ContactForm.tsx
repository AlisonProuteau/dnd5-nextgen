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
import type { Version } from '@utils/versions.constants';
import { collection, doc, setDoc } from 'firebase/firestore';
import { omit, omitBy } from 'lodash';
import { Fragment, useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { database } from 'src/firebase';
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

enum RequestArea {
  CONTENT = 'Content',
  FEATURE = 'Feature',
  IMPROVEMENT = 'Improvement',
  OTHER = 'Other'
}

enum TicketStatus {
  OPEN = 'open',
  TRIAGED = 'triaged',
  INPROGRESS = 'inProgress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

interface FormData {
  type: ContactType;
  canContact: boolean;
  severity?: BugSeverity;
  area?: AppArea | string;
  requestArea?: RequestArea | string;
  reproSteps?: string;
  character?: string;
  corrupted?: boolean;
  requestContent?: string;
  message?: string;
  status: TicketStatus;
}

const DEFAULT_FORM = {
  type: ContactType.FEEDBACK,
  canContact: false,
  status: TicketStatus.OPEN
};

export function ContactForm() {
  const { user, version } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [formData, setFormDataState] = useState<FormData>({ ...DEFAULT_FORM });
  const [formError, setFormErrorState] = useState<{
    message?: boolean;
    area?: boolean;
    requestContent?: boolean;
    requestArea?: boolean;
    reproSteps?: boolean;
  }>({});

  const { data: characters, isLoading: isCharactersLoading } = useQuery({
    queryKey: ['fetchCharacters', user?.uid, version],
    queryFn: async () => (user && version ? await getUserCharacters(user.uid, version) : null),
    enabled: !!(user?.uid && version)
  });

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

    if (target.id === 'requestArea') {
      setFormError({ [target.id]: currentData === RequestArea.OTHER });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    if (isFormValid() && user?.uid) {
      let formattedForm: Partial<FormData> & {
        userId?: string;
        userEmail?: string;
        version: Version | string;
      } = { ...formData, version: version ?? 'unknown' };
      if (!isAnonymous || formData.type === ContactType.BUG)
        formattedForm = { ...formattedForm, userId: user.uid };
      if (formData.canContact) formattedForm = { ...formattedForm, userEmail: user.email ?? '' };
      else formattedForm = omit(formattedForm, 'canContact');

      try {
        const newTicketRef = doc(collection(database, 'tickets'));
        await setDoc(
          newTicketRef,
          omitBy(formattedForm, (v) => v === undefined)
        );

        toast.success('Ticket created');
        resetForm();
      } catch (error) {
        toast.error(`Something went wrong\n${(error as Error).message || 'Error'}`);
      }
    }

    setIsSaving(false);
  };

  const resetForm = () => {
    setFormDataState({ ...DEFAULT_FORM });
    setFormErrorState({});
  };

  const isAppArea = useMemo(
    () => Object.values(AppArea).includes(formData.area as AppArea),
    [formData.area]
  );
  const isRequestArea = useMemo(
    () => Object.values(RequestArea).includes(formData.requestArea as RequestArea),
    [formData.requestArea]
  );

  return (
    <Container maxWidth="xs">
      <form
        onSubmit={handleSubmit}
        onBlur={validateInput}
        onFocus={({ target }) =>
          target.id &&
          formError[target.id as keyof typeof formError] &&
          setFormError({ [target.id]: false })
        }
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
                    ...DEFAULT_FORM,
                    type,
                    message:
                      type === ContactType.BUG || formData.type === ContactType.BUG
                        ? undefined
                        : formData.message
                  });
                  setFormErrorState({});
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
                  {formData.area && (formData.area === AppArea.OTHER || !isAppArea) && (
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
                  id="message"
                  label="Summary"
                  onChange={(value) => setFormData({ message: value?.toString() })}
                  hasError={formError.message}
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

            {formData.type === ContactType.REQUEST && (
              <Fragment>
                <FormControl margin="dense" fullWidth required>
                  <InputLabel htmlFor="requestArea">Area</InputLabel>
                  <Select
                    id="requestArea"
                    label="Improvement Area"
                    value={
                      formData.requestArea
                        ? !isRequestArea
                          ? RequestArea.OTHER
                          : formData.requestArea
                        : ''
                    }
                    onChange={({ target }) =>
                      setFormData({
                        requestArea: target.value as RequestArea,
                        requestContent: undefined
                      })
                    }
                  >
                    {Object.values(RequestArea).map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                  {formData.requestArea &&
                    (formData.requestArea === RequestArea.OTHER || !isRequestArea) && (
                      <ControledInput
                        required
                        id="requestArea"
                        label="Area"
                        onChange={(value) =>
                          setFormData({ requestArea: value ? value.toString() : RequestArea.OTHER })
                        }
                        hasError={formError.requestArea}
                        errorMessage={['Required']}
                      />
                    )}
                  {formData.requestArea === RequestArea.CONTENT && (
                    <ControledInput
                      required
                      id="requestContent"
                      label="Type of content"
                      placeholder="Race, class, language, background, spell..."
                      onChange={(value) => setFormData({ requestContent: value?.toString() })}
                      hasError={formError.requestContent}
                      errorMessage={['Required']}
                    />
                  )}
                </FormControl>
                <ControledInput
                  fullWidth
                  multiline
                  required
                  id="message"
                  label="Message"
                  value={formData.message || ''}
                  onChange={(value) => setFormData({ message: value?.toString() })}
                  hasError={formError.message}
                  errorMessage={['Required']}
                />
                <FormControlLabel
                  sx={{ marginX: 0 }}
                  control={
                    <Checkbox
                      id="canContact"
                      defaultValue="false"
                      onChange={(_, checked) => setFormData({ canContact: checked })}
                    />
                  }
                  label="Accept to be contacted"
                />
              </Fragment>
            )}

            {formData.type === ContactType.FEEDBACK && (
              <Fragment>
                <ControledInput
                  fullWidth
                  multiline
                  required
                  id="message"
                  label="Message"
                  value={formData.message || ''}
                  onChange={(value) => setFormData({ message: value?.toString() })}
                  hasError={formError.message}
                  errorMessage={['Required']}
                />
                <FormControlLabel
                  sx={{ marginX: 0 }}
                  control={
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(_, checked) => setIsAnonymous(checked)}
                    />
                  }
                  label="Anonymous"
                />
              </Fragment>
            )}
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
