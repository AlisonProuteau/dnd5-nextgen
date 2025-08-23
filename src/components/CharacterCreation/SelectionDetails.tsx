import { Close, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from '@mui/material';
import type { Classes } from '@representations/character/class.representation';
import type { Race } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { AccordionButton } from '@shared/AccordionButton';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { useAuth } from 'src/providers/AuthProvider';
import { FeaturesDisplay } from '../CharacterCard/Characteristics/FeaturesDisplay';
import { TraitsDisplay } from '../CharacterCard/Characteristics/TraitsDisplay';
import { BestForSection, ProConList, type GuideType } from './utils';

export function SelectionDetails({
  playstyle,
  selected,
  subSelected,
  info,
  traits,
  features
}: {
  playstyle?: GuideType &
    (
      | { subraces?: Omit<GuideType, 'cons'>[] }
      | {
          evolution: string;
          subclasses: (Omit<GuideType, 'pros' | 'cons'> & { evolution: string })[];
        }
    );
  selected: DefaultRepresentation;
  subSelected?: { index: string; name: string; desc: string | string[]; subclass_flavor?: string };
  info: Race | Classes | undefined;
  traits?: Character['traits'];
  features?: Character['features'];
}) {
  const { version } = useAuth();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [traitsOpen, setTraitsOpen] = useState(false);

  const scrollOnOpen = useCallback(
    ({ currentTarget }: { currentTarget: EventTarget & Element }, expanded: boolean) => {
      expanded && setTimeout(() => currentTarget.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    []
  );

  const subElement = useMemo(() => {
    if (!playstyle) return null;
    if ('subclasses' in playstyle) return playstyle.subclasses;
    if ('subraces' in playstyle) return playstyle.subraces;
  }, [playstyle]);

  return (
    <Box marginY={2} display="flex" flexDirection="column" gap={1}>
      {/* TODO: should it be moved to a question mark action button? */}
      {playstyle && (
        <Accordion key={`${selected.index}-howTo`} disableGutters onChange={scrollOnOpen}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
              <Typography variant="subtitle2">How to Play</Typography>
            </Divider>
          </AccordionSummary>
          <AccordionDetails sx={{ textAlign: 'justify' }}>
            <Typography variant="overline">Playstyle</Typography>
            <Typography marginBottom={2}>{playstyle.playstyle}</Typography>

            {'evolution' in playstyle && (
              <Fragment>
                <Typography variant="overline">Evolution</Typography>
                <Typography marginBottom={2}>{playstyle.evolution}</Typography>
              </Fragment>
            )}

            <ProConList items={playstyle.pros} type="pros" />
            <ProConList items={playstyle.cons} type="cons" />

            <BestForSection bestForArray={playstyle.bestFor} />

            {subElement && (
              <Box>
                <Typography variant="overline">Subclasses</Typography>
                {subElement.map((sub) => (
                  <Accordion key={sub.index} disableGutters sx={{ boxShadow: 'none' }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="overline" fontWeight="bold">
                        {sub.name}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Fragment>
                        <Typography variant="overline">Playstyle</Typography>
                        <Typography marginBottom={2}>{sub.playstyle}</Typography>

                        {'pros' in sub && <ProConList items={sub.pros} type="pros" />}

                        {'evolution' in sub && (
                          <Fragment>
                            <Typography variant="overline">Evolution</Typography>
                            <Typography marginBottom={2}>{sub.evolution}</Typography>
                          </Fragment>
                        )}

                        <BestForSection bestForArray={sub.bestFor} />
                      </Fragment>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      <Accordion key={`${selected.index}-description`} disableGutters onChange={scrollOnOpen}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Description</Typography>
          </Divider>
        </AccordionSummary>
        <AccordionDetails sx={{ textAlign: 'justify' }}>
          <Typography variant="overline">{selected.name}</Typography>
          <Typography marginBottom={2}>{selected.desc}</Typography>
          {/* TODO: Add to firestore for class*/}

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

      {/* TODO: add class info */}

      {[features, traits].map((value, index) => {
        const isFeature = index === 0;
        const setOpen = isFeature ? setFeaturesOpen : setTraitsOpen;
        const isOpen = isFeature ? featuresOpen : traitsOpen;

        return value?.length ? (
          <Fragment>
            <AccordionButton
              fullWidth
              title={`${isFeature ? 'Features' : 'Traits'} (${value.length})`}
              onClick={() => setOpen(true)}
            />
            <Dialog open={isOpen} onClose={() => setOpen(false)}>
              <DialogTitle>{isFeature ? 'Features' : 'Traits'}</DialogTitle>
              <IconButton
                aria-label="close"
                onClick={() => setOpen(false)}
                sx={(theme) => ({
                  position: 'absolute',
                  right: 2,
                  top: 2,
                  color: theme.palette.grey[500]
                })}
              >
                <Close />
              </IconButton>
              <DialogContent sx={{ paddingTop: 0 }}>
                {isFeature ? (
                  <FeaturesDisplay
                    character={{
                      features: value,
                      version: version || 'Legacy'
                    }}
                    useblackList={false}
                  />
                ) : (
                  <TraitsDisplay
                    character={{
                      traits: value,
                      version: version || 'Legacy'
                    }}
                    useblackList={false}
                  />
                )}
              </DialogContent>
            </Dialog>
          </Fragment>
        ) : null;
      })}
    </Box>
  );
}
