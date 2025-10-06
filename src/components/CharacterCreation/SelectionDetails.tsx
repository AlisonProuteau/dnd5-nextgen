import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Typography
} from '@mui/material';
import { MoneyUnits } from '@representations/campaign/equipment.representation';
import type { Level } from '@representations/campaign/level.representation';
import type { Classes, Subclass } from '@representations/character/class.representation';
import type { Race } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { AccordionButtonDialog } from '@shared/AccordionButton';
import { Fragment, useMemo } from 'react';
import { useAuth } from 'src/providers/AuthProvider';
import { FeaturesDisplay } from '../CharacterCard/Characteristics/FeaturesDisplay';
import { TraitsDisplay } from '../CharacterCard/Characteristics/TraitsDisplay';
import { EquipmentList } from '../CharacterCard/Equipment/EquipmentList';
import { SpellList } from '../CharacterCard/Spells/SpellList';
import { scrollOnOpen } from './characterCreation.utils';

interface SelectionDetailsProps {
  selected: DefaultRepresentation;
  subSelected?: { index: string; name: string; desc: string | string[]; subclass_flavor?: string };
  info: Race | Partial<Classes & Subclass & Omit<Level, 'spellcasting'>> | undefined;
  traits?: Character['traits'];
  features?: Character['features'];
}

export function SelectionDetails({
  selected,
  subSelected,
  info,
  traits,
  features
}: SelectionDetailsProps) {
  const { version } = useAuth();

  const characterInfo = useMemo(
    () => ({
      version: version || 'Legacy',
      classIndex: selected.index,
      subclassIndex: subSelected?.index,
      slotLevels: []
    }),
    [version, selected.index, subSelected?.index]
  );

  return (
    <Box marginY={2} display="flex" flexDirection="column" gap={1}>
      <Accordion key={`${selected.index}-description`} disableGutters onChange={scrollOnOpen}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Description</Typography>
          </Divider>
        </AccordionSummary>
        <AccordionDetails sx={{ textAlign: 'justify' }}>
          <Typography variant="overline" color="secondary">
            {selected.name}
          </Typography>
          <Typography marginBottom={2}>{selected.desc}</Typography>

          {subSelected && (
            <Fragment>
              <Typography variant="overline" color="secondary">
                {`${subSelected.name}${
                  subSelected.subclass_flavor ? '- ' + subSelected.subclass_flavor : ''
                }`}
              </Typography>
              <Typography marginBottom={2}>{subSelected.desc}</Typography>
            </Fragment>
          )}
        </AccordionDetails>
      </Accordion>

      {selected && info && 'size_description' in info ? (
        <Fragment>
          <Accordion
            key={`${selected.index}-characteristics`}
            disableGutters
            onChange={scrollOnOpen}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                <Typography variant="subtitle2">Characteristics</Typography>
              </Divider>
            </AccordionSummary>
            <AccordionDetails sx={{ textAlign: 'justify' }}>
              <Typography variant="overline" color="secondary">
                Size
              </Typography>
              <Typography marginBottom={2}>{info.size_description}</Typography>

              <Typography variant="overline" color="secondary">
                Speed
              </Typography>
              <Typography marginBottom={2}>{info.speed}ft</Typography>

              <Typography variant="overline" color="secondary">
                Age
              </Typography>
              <Typography marginBottom={2}>{info.age}</Typography>

              <Typography variant="overline" color="secondary">
                Alignment
              </Typography>
              <Typography marginBottom={2}>{info.alignment}</Typography>

              <Typography variant="overline" color="secondary">
                Languages
              </Typography>
              <Typography marginBottom={2}>{info.language_desc}</Typography>

              {info.starting_proficiencies?.length ? (
                <Fragment>
                  <Typography variant="overline" color="secondary">
                    Starting Proficiencies:
                  </Typography>
                  <Typography marginBottom={2}>
                    {info.starting_proficiencies?.map((p) => p.name).join(', ')}
                  </Typography>
                </Fragment>
              ) : null}
            </AccordionDetails>
          </Accordion>
        </Fragment>
      ) : null}

      {selected && info && 'hit_die' in info ? (
        <Fragment>
          <Accordion
            key={`${selected.index}-characteristics`}
            disableGutters
            onChange={scrollOnOpen}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                <Typography variant="subtitle2">Characteristics</Typography>
              </Divider>
            </AccordionSummary>
            <AccordionDetails sx={{ textAlign: 'justify' }}>
              <Box display={'flex'} flexWrap="wrap" marginBottom={2} justifyContent="space-evenly">
                <Box textAlign="center">
                  <Typography variant="overline">Hit Die</Typography>
                  <Typography>{`1d${info.hit_die} per level`}</Typography>
                </Box>

                <Box textAlign="center">
                  <Typography variant="overline">Proficiency Bonus</Typography>
                  <Typography>{`1d${info.prof_bonus}`}</Typography>
                </Box>
              </Box>

              {info.proficiencies?.length ? (
                <Fragment>
                  <Typography variant="overline" color="secondary">
                    Proficiencies
                  </Typography>
                  <Typography marginBottom={2}>
                    {info.proficiencies
                      .map((p) => p.name)
                      .filter((p) => !p.includes('Saving Throw'))
                      .join(', ')}
                  </Typography>
                </Fragment>
              ) : null}

              {info.starting_equipment?.length ? (
                <Fragment>
                  <Typography variant="overline" color="secondary">
                    Starting Equipment:
                  </Typography>
                  <EquipmentList
                    equipmentList={info.starting_equipment.map((e) => ({
                      ...e.equipment,
                      quantity: e.quantity,
                      equipment_category: { index: 'e', name: 'Equipment' },
                      cost: { quantity: 0, unit: MoneyUnits[0] },
                      desc: []
                    }))}
                  />
                </Fragment>
              ) : null}
            </AccordionDetails>
          </Accordion>

          {info?.spellcasting && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">Spellcasting</Typography>
                </Divider>
              </AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                <Box
                  display={'flex'}
                  flexWrap="wrap"
                  marginBottom={2}
                  justifyContent="space-evenly"
                >
                  <Box textAlign="center">
                    <Typography variant="overline">Level</Typography>
                    <Typography>{info.spellcasting.level}</Typography>
                  </Box>

                  <Box textAlign="center">
                    <Typography variant="overline">Ability</Typography>
                    <Typography>{info.spellcasting.spellcasting_ability.name}</Typography>
                  </Box>
                </Box>

                <Box
                  display="grid"
                  columnGap={2}
                  gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                >
                  {info.spellcasting.info
                    .sort((a, b) => b.desc.join('').length - a.desc.join('').length)
                    .map((i) => (
                      <Box key={`spellcasting-info-${selected.index}-${i.name}`} marginBottom={2}>
                        <Typography variant="overline" color="secondary">
                          {i.name}
                        </Typography>
                        {i.desc.map((d) => (
                          <Typography variant="body2" paddingBottom={1}>
                            {d}
                          </Typography>
                        ))}
                      </Box>
                    ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {info.spells?.length ? (
            <AccordionButtonDialog
              fullWidth
              maxWidth="lg"
              PaperProps={{ elevation: 0 }}
              slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(50, 50, 50, 0.85)' } } }}
              title={`${subSelected?.name} Spells (${info.spells.length})`}
            >
              <SpellList
                characterInfo={characterInfo}
                additionalSpellList={info.spells}
                spellListOnly={true}
                showDesc={true}
              />
            </AccordionButtonDialog>
          ) : null}
        </Fragment>
      ) : null}

      {features?.length ? (
        <AccordionButtonDialog title={`Features (${features.length})`}>
          <FeaturesDisplay
            character={{
              features: features,
              version: version || 'Legacy'
            }}
            useblackList={false}
          />
        </AccordionButtonDialog>
      ) : null}

      {traits?.length ? (
        <AccordionButtonDialog title={`Traits (${traits.length})`}>
          <TraitsDisplay
            character={{
              traits: traits,
              version: version || 'Legacy'
            }}
            useblackList={false}
          />
        </AccordionButtonDialog>
      ) : null}
    </Box>
  );
}
