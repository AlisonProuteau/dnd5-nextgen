import { type FormEvent, Fragment, useEffect, useMemo } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { omit, omitBy } from 'lodash';
import { getUserCharacters } from '@api/users';
import { useFirebaseCrud, useForm, type ValidationRule, validationRules } from '@hooks/index';
import { useToggle } from '@hooks/useToggle';
import { ControledInput } from '@shared/ControledInput';
import type { Version } from '@utils/constants';
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
  const { isOn: isAnonymous, setIsOn: setIsAnonymous } = useToggle(true);

  const form = useForm<FormData>({
    initialData: { ...DEFAULT_FORM },
    validationSchema: {
      type: [validationRules.required()],
      message: [validationRules.required()]
    }
  });

  const firebaseCrud = useFirebaseCrud<FormData>({
    collectionPath: 'tickets',
    successMessages: {
      create: 'Ticket created'
    }
  });

  const { data: characters, isLoading: isCharactersLoading } = useQuery({
    queryKey: ['fetchCharacters', user?.uid, version],
    queryFn: async () => (user && version ? await getUserCharacters(user.uid, version) : null),
    enabled: !!(user?.uid && version)
  });

  useEffect(() => {
    let newSchema: Record<string, ValidationRule<FormData>[]> = {
      type: [validationRules.required()],
      message: [validationRules.required()]
    };

    if (form.formData.type === ContactType.BUG) {
      newSchema = {
        ...newSchema,
        reproSteps: [validationRules.required()],
        severity: [validationRules.required()],
        area: [
          validationRules.required(),
          (value: AppArea) => (value === AppArea.OTHER ? `Required` : undefined)
        ]
      };
    }

    if (form.formData.type === ContactType.REQUEST) {
      newSchema = {
        ...newSchema,
        requestContent:
          form.formData.requestArea === RequestArea.CONTENT ? [validationRules.required()] : [],
        requestArea: [
          validationRules.required(),
          (value: RequestArea) => (value === RequestArea.OTHER ? `Required` : undefined)
        ]
      };
    }

    form.updateValidationSchema(newSchema);
  }, [form.formData.type, form.formData.requestArea]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (user?.uid) {
      let formattedForm: Partial<FormData> & {
        userId?: string;
        userEmail?: string;
        version: Version | string;
      } = { ...form.formData, version: version ?? 'unknown' };

      if (!isAnonymous || form.formData.type === ContactType.BUG)
        formattedForm = { ...formattedForm, userId: user.uid };
      if (form.formData.canContact)
        formattedForm = { ...formattedForm, userEmail: user.email ?? '' };
      else formattedForm = omit(formattedForm, 'canContact');

      const cleanedData = omitBy(formattedForm, (v) => v === undefined) as any;
      await firebaseCrud.create(cleanedData);
      if (!firebaseCrud.isLoading) form.resetForm();
    }
  };

  const isAppArea = useMemo(
    () => Object.values(AppArea).includes(form.formData.area as AppArea),
    [form.formData.area]
  );

  const isRequestArea = useMemo(
    () => Object.values(RequestArea).includes(form.formData.requestArea as RequestArea),
    [form.formData.requestArea]
  );

  return (
    <Container maxWidth="xs">
      <form
        onSubmit={handleSubmit}
        onBlur={({ target }) =>
          (target.id as keyof FormData) && form.validateField(target.id as keyof FormData)
        }
        onFocus={({ target }) =>
          target.id &&
          !form.isFieldValid(target.id as keyof FormData) &&
          form.clearFieldError(target.id as keyof FormData)
        }
        onReset={form.resetForm}
        data-testid="contact-form"
      >
        {!firebaseCrud.isLoading ? (
          <Fragment>
            <FormControl margin="dense" fullWidth required data-testid="type-form">
              <InputLabel htmlFor="type">Contact Type</InputLabel>
              <Select
                id="type"
                name="type"
                label="Contact Type"
                value={form.formData.type}
                onChange={({ target }) => {
                  const type = target.value as ContactType;

                  form.setFormData({
                    ...DEFAULT_FORM,
                    type,
                    message:
                      type === ContactType.BUG || form.formData.type === ContactType.BUG
                        ? undefined
                        : form.formData.message
                  });
                  form.clearErrors();
                }}
              >
                {Object.values(ContactType).map((contactType) => (
                  <MenuItem key={contactType} value={contactType}>
                    {contactType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {form.formData.type === ContactType.BUG && (
              <Fragment>
                <FormControl margin="dense" fullWidth required data-testid="severity-form">
                  <InputLabel htmlFor="severity">Severity</InputLabel>
                  <Select
                    id="severity"
                    label="Severity"
                    value={form.formData.severity || BugSeverity.MEDIUM}
                    onChange={({ target }) =>
                      form.setFormData({ severity: target.value as BugSeverity })
                    }
                  >
                    {Object.values(BugSeverity).map((bugSeverity) => (
                      <MenuItem key={bugSeverity} value={bugSeverity}>
                        {bugSeverity}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl margin="dense" fullWidth required data-testid="area-form">
                  <InputLabel htmlFor="area">Area</InputLabel>
                  <Select
                    id="area"
                    label="Area"
                    value={
                      form.formData.area ? (!isAppArea ? AppArea.OTHER : form.formData.area) : ''
                    }
                    onChange={({ target }) => form.setFormData({ area: target.value as AppArea })}
                    error={!form.isFieldValid('area')}
                  >
                    {Object.values(AppArea).map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                  {form.formData.area && (form.formData.area === AppArea.OTHER || !isAppArea) && (
                    <ControledInput
                      required
                      id="area"
                      label="Area"
                      onChange={(value) =>
                        form.setFormData({ area: value ? value.toString() : AppArea.OTHER })
                      }
                      hasError={!form.isFieldValid('area')}
                      errorMessage={form.getFieldError('area')}
                      data-testid="area-input"
                    />
                  )}
                </FormControl>
                <ControledInput
                  fullWidth
                  required
                  id="message"
                  label="Summary"
                  onChange={(value) => form.setFormData({ message: value?.toString() })}
                  hasError={!form.isFieldValid('message')}
                  errorMessage={form.getFieldError('message')}
                  data-testid="message-input"
                />
                <ControledInput
                  fullWidth
                  multiline
                  required
                  id="reproSteps"
                  label="Reproduction Steps"
                  onChange={(value) => form.setFormData({ reproSteps: value?.toString() })}
                  hasError={!form.isFieldValid('reproSteps')}
                  errorMessage={form.getFieldError('reproSteps')}
                  data-testid="reproSteps-input"
                />
                {!isCharactersLoading &&
                  characters?.length &&
                  form.formData.area &&
                  ![AppArea.NAV, AppArea.AUTH].includes(form.formData.area as AppArea) && (
                    <FormControl margin="dense" fullWidth data-testid="character-form">
                      <InputLabel htmlFor="character">Character</InputLabel>
                      <Select
                        id="character"
                        name="character"
                        label="Character"
                        value={form.formData.character || ''}
                        onChange={({ target }) =>
                          form.setFormData({ character: target.value.toString() })
                        }
                      >
                        {characters.map((character) => (
                          <MenuItem key={`character-${character.id}`} value={character.id}>
                            {character.name} - {character.race?.name} {character.class?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                <FormControlLabel
                  sx={{ marginX: 0 }}
                  data-testid="corrupted-form"
                  control={
                    <Checkbox
                      id="corrupted"
                      defaultValue="false"
                      onChange={(_, checked) => form.setFormData({ corrupted: checked })}
                    />
                  }
                  label="Data is corrupted"
                />
              </Fragment>
            )}

            {form.formData.type === ContactType.REQUEST && (
              <Fragment>
                <FormControl margin="dense" fullWidth required data-testid="request-area-form">
                  <InputLabel htmlFor="requestArea">Area</InputLabel>
                  <Select
                    id="requestArea"
                    label="Improvement Area"
                    value={
                      form.formData.requestArea
                        ? !isRequestArea
                          ? RequestArea.OTHER
                          : form.formData.requestArea
                        : ''
                    }
                    onChange={({ target }) =>
                      form.setFormData({
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
                  {form.formData.requestArea &&
                    (form.formData.requestArea === RequestArea.OTHER || !isRequestArea) && (
                      <ControledInput
                        required
                        id="requestArea"
                        label="Area"
                        onChange={(value) =>
                          form.setFormData({
                            requestArea: value ? value.toString() : RequestArea.OTHER
                          })
                        }
                        hasError={!form.isFieldValid('requestArea')}
                        errorMessage={form.getFieldError('requestArea')}
                        data-testid="requestArea-input"
                      />
                    )}
                  {form.formData.requestArea === RequestArea.CONTENT && (
                    <ControledInput
                      required
                      id="requestContent"
                      label="Type of content"
                      placeholder="Race, class, language, background, spell..."
                      onChange={(value) => form.setFormData({ requestContent: value?.toString() })}
                      hasError={!form.isFieldValid('requestContent')}
                      errorMessage={form.getFieldError('requestContent')}
                      data-testid="requestContent-input"
                    />
                  )}
                </FormControl>
                <ControledInput
                  fullWidth
                  multiline
                  required
                  id="message"
                  label="Message"
                  value={form.formData.message || ''}
                  onChange={(value) => form.setFormData({ message: value?.toString() })}
                  hasError={!form.isFieldValid('message')}
                  errorMessage={form.getFieldError('message')}
                  data-testid="message-input"
                />
                <FormControlLabel
                  sx={{ marginX: 0 }}
                  data-testid="can-contact-form"
                  control={
                    <Checkbox
                      id="canContact"
                      defaultValue="false"
                      onChange={(_, checked) => form.setFormData({ canContact: checked })}
                    />
                  }
                  label="Accept to be contacted"
                />
              </Fragment>
            )}

            {form.formData.type === ContactType.FEEDBACK && (
              <Fragment>
                <ControledInput
                  fullWidth
                  multiline
                  required
                  id="message"
                  name="message"
                  label="Message"
                  value={form.formData.message || ''}
                  onChange={(value) => form.setFormData({ message: value?.toString() })}
                  hasError={!form.isFieldValid('message')}
                  errorMessage={form.getFieldError('message')}
                  data-testid="message-input"
                />
                <FormControlLabel
                  sx={{ marginX: 0 }}
                  data-testid="anonymous-form"
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
          disabled={!form.isValid || firebaseCrud.isLoading}
          sx={{ marginY: 1 }}
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
