import { Fragment, useMemo } from 'react';
import { CancelOutlined, CheckCircleOutline, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  Typography
} from '@mui/material';
import type { ClassGuide, GuideType, RaceGuide } from '@representations/guide.representation';

function ProConList({ items, type }: { items: string[]; type: 'pros' | 'cons' }) {
  const isPros = type === 'pros';

  return (
    <List dense>
      <Typography variant="overline">{isPros ? 'Pros:' : 'Cons:'}</Typography>
      {items.map((item, index) => (
        <ListItem key={`${type}-${index}`}>
          <ListItemIcon sx={{ minWidth: '32px' }}>
            {isPros ? <CheckCircleOutline color="success" /> : <CancelOutlined color="error" />}
          </ListItemIcon>
          <Typography variant="body2">{item}</Typography>
        </ListItem>
      ))}
    </List>
  );
}

function BestForSection({ bestForArray }: { bestForArray: GuideType['bestFor'] }) {
  return (
    <List>
      <Typography variant="overline">Best For:</Typography>
      {bestForArray.map((bestFor, index) => (
        <ListItem
          key={`bestFor-${index}`}
          sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            {bestFor.instances.map((cls, classIndex) => (
              <Chip key={classIndex} label={cls.name} size="small" variant="outlined" />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {bestFor.reason}
          </Typography>
        </ListItem>
      ))}
    </List>
  );
}

interface HowToPlaySectionProps {
  playstyle?: RaceGuide | ClassGuide;
}

export function HowToPlaySection({ playstyle }: HowToPlaySectionProps) {
  const subElement = useMemo(() => {
    if (!playstyle) return null;
    if ('subclasses' in playstyle) return playstyle.subclasses;
    if ('subraces' in playstyle) return playstyle.subraces;
  }, [playstyle]);

  return (
    playstyle && (
      <Fragment>
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
      </Fragment>
    )
  );
}
