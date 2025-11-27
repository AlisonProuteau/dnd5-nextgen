import { getAllAligmenents, getAllBackgrounds } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import type { Alignment, Background } from '@representations/character/background.representation';
import type { Choice, DefaultRepresentation } from '@representations/common.representation';
import type { CharacterFormData } from '@representations/user.representation';
import { ControledInput } from '@shared/ControledInput';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { useAuth } from 'src/providers/AuthProvider';
import { Choices } from './Choices';
import {
  mapDataForForm,
  type ChoiceObjectType,
  type ChoiceSelection
} from './characterCreation.utils';

interface CharacterBackgroundFormProps {
  onNext: (raceInfo: Partial<CharacterFormData>) => void;
  onPrev: (raceInfo: Partial<CharacterFormData>) => void;
  proficiencies?: ChoiceSelection[];
  languages?: ChoiceSelection[];
  equipment?: ChoiceSelection[];
}

export function CharacterBackgroundForm({
  onNext,
  onPrev,
  proficiencies = [],
  languages = [],
  equipment = []
}: CharacterBackgroundFormProps) {
  const { version } = useAuth();
  const [selectedBackground, setSelectedBackground] = useState<Background>();
  const [selectedAlignment, setSelectedAlignment] = useState<Alignment>();
  const [selectedBonds, setSelectedBonds] = useState<ChoiceObjectType[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<ChoiceObjectType[]>([]);
  const [selectedIdeals, setSelectedIdeals] = useState<ChoiceObjectType[]>([]);
  const [selectedFlaws, setSelectedFlaws] = useState<ChoiceObjectType[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<ChoiceObjectType[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<ChoiceObjectType[]>([]);

  const emptyChoice: Choice = {
    choose: -1,
    type: '',
    from: { option_set_type: 'resource_list', resource_list_path: '/' }
  };

  const customBackground: Background = {
    index: 'custom',
    name: 'Custom',
    feature: { name: 'Blank slate', desc: ['Build your own character'] },
    starting_proficiencies: [],
    starting_equipment: [],
    starting_equipment_options: [],
    language_options: emptyChoice,
    personality_traits: emptyChoice,
    ideals: emptyChoice,
    bonds: emptyChoice,
    flaws: emptyChoice
  };

  const { data: backgrounds } = useQuery({
    queryKey: ['fetchBackgrounds', version],
    queryFn: async () => (version ? (await getAllBackgrounds(version)).results : []),
    select: (data) => [...data, customBackground],
    enabled: !!version
  });

  const { data: alignments } = useQuery({
    queryKey: ['fetchAlignments'],
    queryFn: async () => (version ? (await getAllAligmenents(version)).results : []),
    enabled: !!version
  });

  const isValid = () => {
    return (
      selectedBackground?.index &&
      selectedAlignment?.index &&
      selectedLanguages.length >= selectedBackground.language_options.choose &&
      selectedBackground.starting_equipment_options?.every(
        ({ choose }, i) =>
          (selectedEquipments.filter(({ type }) => type === i).length || 0) >= choose
      )
    );
  };

  const handleSubmit = (fn: (classInfo: Partial<CharacterFormData>) => void) => {
    const data: Partial<CharacterFormData> = {
      background: selectedBackground && {
        index: selectedBackground.index,
        name: selectedBackground.name
      },
      alignment: selectedAlignment,
      bonds: selectedBonds.length ? selectedBonds.map(({ name }) => name) : undefined,
      personality: selectedPersonality.length
        ? selectedPersonality.map(({ name }) => name)
        : undefined,
      ideals: selectedIdeals.length ? selectedIdeals.map(({ name }) => name) : undefined,
      flaws: selectedFlaws.length ? selectedFlaws.map(({ name }) => name) : undefined,
      languages: mapDataForForm(selectedLanguages, 'background').concat(
        languages.filter(({ type }) => type !== 'background')
      ),
      equipments: mapDataForForm(selectedEquipments, 'background').concat(
        mapDataForForm(
          selectedBackground?.starting_equipment?.map((equipment) => equipment.equipment) || [],
          'background'
        ).concat(equipment.filter(({ type }) => type !== 'background'))
      ),
      proficiencies: mapDataForForm(
        selectedBackground?.starting_proficiencies || [],
        'background'
      ).concat(proficiencies.filter(({ type }) => type !== 'background'))
    };

    fn(data);
  };

  return (
    <Box data-testid="background-selection">
      {backgrounds && (
        <Box display="flex" gap="15px">
          <FormControl margin="dense" fullWidth required>
            <InputLabel htmlFor="background">Background</InputLabel>
            <Select
              fullWidth
              id="background"
              name="background"
              label="Backgrounds"
              disabled={!backgrounds}
              value={selectedBackground?.index || ''}
              onChange={({ target }) => {
                setSelectedAlignment(undefined);
                setSelectedBonds([]);
                setSelectedPersonality([]);
                setSelectedIdeals([]);
                setSelectedFlaws([]);
                setSelectedLanguages([]);
                setSelectedEquipments([]);
                setSelectedBackground(backgrounds.find((e) => e.index === target.value));
              }}
            >
              {backgrounds.map((currentBackground) => (
                <MenuItem
                  key={`backgrounds-${currentBackground.index}`}
                  id={currentBackground.index}
                  value={currentBackground.index}
                >
                  {currentBackground.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl margin="dense" sx={{ flexBasis: '30%', minWidth: 160 }} required>
            <InputLabel htmlFor="alignment">Alignment</InputLabel>
            <Select
              fullWidth
              id="alignment"
              name="alignment"
              label="Alignment"
              value={selectedAlignment?.index || ''}
              onChange={({ target }) =>
                setSelectedAlignment(alignments?.find(({ index }) => index === target.value))
              }
            >
              <MenuItem value=""> </MenuItem>
              {alignments?.map((currentAlignment: DefaultRepresentation) => (
                <MenuItem
                  key={`alignments-${currentAlignment.index}`}
                  id={currentAlignment.index}
                  value={currentAlignment.index}
                  disabled={
                    !!selectedIdeals.length &&
                    selectedIdeals.some((ideal) => {
                      const availableAlignments = selectedBackground?.ideals?.from?.options?.find(
                        (option) => option.desc === ideal.name
                      )?.alignments;

                      return !availableAlignments?.find(
                        ({ index }) => index === currentAlignment.index
                      );
                    })
                  }
                >
                  {currentAlignment.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {selectedBackground && (
        <Fragment>
          <Accordion>
            <Divider component="div" role="presentation" variant="middle">
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{selectedBackground.feature.name}</Typography>
              </AccordionSummary>
            </Divider>
            <AccordionDetails>
              <Typography align="center">{selectedBackground.feature.desc}</Typography>
            </AccordionDetails>
          </Accordion>

          {selectedBackground.index === 'custom' ? (
            <Fragment>
              <ControledInput
                fullWidth
                multiline
                id="bonds"
                label="Bonds"
                onChange={(value) =>
                  setSelectedBonds(
                    value ? [{ index: 'bond', name: value.toString(), type: 0 }] : []
                  )
                }
              />
              <ControledInput
                fullWidth
                multiline
                id="personality"
                label="Personality traits"
                onChange={(value) =>
                  setSelectedPersonality(
                    value ? [{ index: 'personality', name: value.toString(), type: 0 }] : []
                  )
                }
              />
              <ControledInput
                fullWidth
                multiline
                id="ideals"
                label="Ideals"
                onChange={(value) =>
                  setSelectedIdeals(
                    value ? [{ index: 'ideals', name: value.toString(), type: 0 }] : []
                  )
                }
              />
              <ControledInput
                fullWidth
                multiline
                id="flaws"
                label="Flaws"
                onChange={(value) =>
                  setSelectedFlaws(
                    value ? [{ index: 'flaws', name: value.toString(), type: 0 }] : []
                  )
                }
              />
            </Fragment>
          ) : (
            <Fragment>
              <Fragment>
                <Divider
                  component="div"
                  role="presentation"
                  sx={{ paddingTop: '15px' }}
                  variant="middle"
                >
                  <Typography>Choose Bonds</Typography>
                </Divider>
                <Choices
                  choices={[selectedBackground.bonds]}
                  selected={selectedBonds}
                  setSelected={setSelectedBonds}
                />
              </Fragment>

              <Fragment>
                <Divider
                  component="div"
                  role="presentation"
                  sx={{ paddingTop: '15px' }}
                  variant="middle"
                >
                  <Typography>
                    Choose Personality Traits ({selectedBackground.personality_traits.choose || 0})
                  </Typography>
                </Divider>
                <Choices
                  choices={[selectedBackground.personality_traits]}
                  selected={selectedPersonality}
                  setSelected={setSelectedPersonality}
                />
              </Fragment>

              <Fragment>
                <Divider
                  component="div"
                  role="presentation"
                  sx={{ paddingTop: '15px' }}
                  variant="middle"
                >
                  <Typography>Choose Ideals ({selectedBackground.ideals.choose || 0})</Typography>
                </Divider>
                <Typography align="center" color="secondary">
                  {selectedAlignment && !selectedIdeals.length && (
                    <Typography variant="caption">
                      Deselect your aligment to access all ideals
                    </Typography>
                  )}

                  {!!selectedIdeals.length && (
                    <Typography variant="caption" display="block">
                      Deselect your ideal to access all aligments
                    </Typography>
                  )}
                </Typography>
                <Choices
                  choices={[selectedBackground.ideals]}
                  selected={selectedIdeals}
                  setSelected={setSelectedIdeals}
                  alignment={selectedAlignment}
                />
              </Fragment>

              <Fragment>
                <Divider
                  component="div"
                  role="presentation"
                  sx={{ paddingTop: '15px' }}
                  variant="middle"
                >
                  <Typography>Choose Flaws ({selectedBackground.flaws.choose || 0})</Typography>
                </Divider>
                <Choices
                  choices={[selectedBackground.flaws]}
                  selected={selectedFlaws}
                  setSelected={setSelectedFlaws}
                />
              </Fragment>

              <Fragment>
                <Divider
                  component="div"
                  role="presentation"
                  sx={{ paddingTop: '15px' }}
                  variant="middle"
                >
                  <Typography>
                    Choose Languages ({selectedBackground.language_options.choose || 0})
                    <Typography display="inline" sx={{ verticalAlign: 'top' }} variant="subtitle2">
                      *
                    </Typography>
                  </Typography>
                </Divider>
                <Choices
                  choices={[{ ...selectedBackground.language_options }]}
                  inherited={languages.filter(({ type }) => type !== 'background')}
                  selected={selectedLanguages}
                  setSelected={setSelectedLanguages}
                />
              </Fragment>

              <Fragment>
                <Divider
                  component="div"
                  role="presentation"
                  sx={{ paddingTop: '15px' }}
                  variant="middle"
                >
                  <Typography>
                    Choose equipments
                    <Typography display="inline" sx={{ verticalAlign: 'top' }} variant="subtitle2">
                      *
                    </Typography>
                  </Typography>
                </Divider>
                <Choices
                  choices={selectedBackground.starting_equipment_options}
                  inherited={equipment}
                  proficiencies={proficiencies}
                  selected={selectedEquipments}
                  setSelected={setSelectedEquipments}
                />
              </Fragment>
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
