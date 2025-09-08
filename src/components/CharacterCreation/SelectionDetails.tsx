import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Typography
} from '@mui/material';
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
import { SpellList } from '../CharacterCard/Spells/SpellList';
import { scrollOnOpen } from './characterCreation.utils';

export function SelectionDetails({
  selected,
  subSelected,
  info,
  traits,
  features
}: {
  selected: DefaultRepresentation;
  subSelected?: { index: string; name: string; desc: string | string[]; subclass_flavor?: string };
  info: Race | Partial<Classes & Subclass & Omit<Level, 'spellcasting'>> | undefined;
  traits?: Character['traits'];
  features?: Character['features'];
}) {
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
          <Typography variant="overline">{selected.name}</Typography>
          <Typography marginBottom={2}>{selected.desc}</Typography>

          {subSelected && (
            <Fragment>
              <Typography variant="overline">
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
              <Typography variant="overline">Size</Typography>
              <Typography marginBottom={2}>{info.size_description}</Typography>

              <Typography variant="overline">Speed</Typography>
              <Typography marginBottom={2}>{info.speed}ft</Typography>

              <Typography variant="overline">Age</Typography>
              <Typography marginBottom={2}>{info.age}</Typography>

              <Typography variant="overline">Alignment</Typography>
              <Typography marginBottom={2}>{info.alignment}</Typography>

              <Typography variant="overline">Languages</Typography>
              <Typography marginBottom={2}>{info.language_desc}</Typography>

              {info.starting_proficiencies?.length ? (
                <Fragment>
                  <Typography variant="overline">Starting Proficiencies:</Typography>
                  <Typography marginBottom={2}>
                    {info.starting_proficiencies?.map((p) => p.name).join(', ')}
                  </Typography>
                </Fragment>
              ) : null}
            </AccordionDetails>
          </Accordion>
        </Fragment>
      ) : null}

      {selected && info && 'class_levels' in info ? (
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
                <Box>
                  <Typography variant="overline">Hit Die</Typography>
                  <Typography>{`1d${info.hit_die} per level`}</Typography>
                </Box>

                <Box>
                  <Typography variant="overline">Proficiency Bonus</Typography>
                  <Typography>{`1d${info.prof_bonus}`}</Typography>
                </Box>
              </Box>

              {info.proficiencies?.length ? (
                <Fragment>
                  <Typography variant="overline">Proficiencies</Typography>
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
                  <Typography variant="overline">Starting Equipment:</Typography>
                  <Typography marginBottom={2}>
                    {info.starting_equipment
                      .map((e) => `${e.quantity} x ${e.equipment.name}`)
                      .join(', ')}
                  </Typography>
                </Fragment>
              ) : null}

              {/* TODO: add missing class info + check ui/ux */}
              {/* {classInfo?.class_levels} */}
              {/* {subclassInfo?.subclass_levels} */}

              {/* {levelInfo?.class_specific} */}
              {/* {levelInfo?.subclass_specific} */}

              {/* {classInfo?.spellcasting}  */}
            </AccordionDetails>
          </Accordion>

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
