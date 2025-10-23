import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import { EquipmentLine } from '@shared/EquipmentLine';
import { getDamageMinMax, getSlotMinMax } from '@utils/character';
import { Fragment } from 'react';

interface SpellDetailsProps {
  spell: Spell;
  charLevel?: number;
  slotLevels?: number[];
}

export function SpellDetails({ spell, charLevel, slotLevels }: SpellDetailsProps) {
  return (
    <Fragment>
      <DialogTitle data-testid="spell-dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">{spell.name}</Typography>
          <Typography variant="subtitle2" color="primary">
            lvl{spell.level}
          </Typography>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          color="lightslategrey"
        >
          <Typography>{spell.school.name}</Typography>
          <Typography display="inline" variant="subtitle2">
            {spell.components}
            {spell.concentration ? ' - Concentration' : ''}
            {spell.ritual ? ' - Ritual' : ''}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent
        data-testid="spell-dialog-description"
        sx={{ display: 'flex', flexDirection: 'column' }}
      >
        <EquipmentLine label="Casting Time" data={spell.casting_time} />
        <EquipmentLine label="Duration" data={spell.duration} />
        {spell.area_of_effect && (
          <EquipmentLine
            label="Area"
            data={`${spell.area_of_effect.size}ft - ${spell.area_of_effect.type}`}
          />
        )}
        {spell.attack_type && <EquipmentLine label="Range Category" data={spell.attack_type} />}
        <EquipmentLine label="Range" data={`${spell.range}`} />
        {spell.damage && (
          <EquipmentLine
            label="Damage"
            data={[
              getDamageMinMax(spell.damage, charLevel, slotLevels) || '',
              spell.damage.damage_type?.name ? ` - ${spell.damage.damage_type?.name}` : ''
            ]}
          />
        )}
        {spell.heal_at_slot_level && (
          <EquipmentLine
            label="Healing"
            data={getSlotMinMax(spell.heal_at_slot_level, slotLevels) || ''}
          />
        )}
        {spell.dc && (
          <EquipmentLine
            label="DC"
            data={[
              spell.dc.dc_type.name,
              spell.dc.dc_success !== 'none' ? ` (${spell.dc.dc_success})` : ''
            ]}
          />
        )}

        {spell.material && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>Material</AccordionSummary>
            <AccordionDetails>
              <Typography>{spell.material}</Typography>
            </AccordionDetails>
          </Accordion>
        )}
        {spell.higher_level && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>Higher Level</AccordionSummary>
            <AccordionDetails>
              <Typography>{spell.higher_level}</Typography>
            </AccordionDetails>
          </Accordion>
        )}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>Description</AccordionSummary>
          <AccordionDetails>
            {spell.desc.map((d, i) => (
              <Typography key={`spell-descrption-${i}`}>{d}</Typography>
            ))}
          </AccordionDetails>
        </Accordion>
      </DialogContent>
    </Fragment>
  );
}
