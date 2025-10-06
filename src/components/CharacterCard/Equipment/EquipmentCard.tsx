import { getProperty } from '@api/ressources';
import { CoinsIcon, WeightIcon } from '@assets';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography
} from '@mui/material';
import { Box } from '@mui/system';
import type { Equipment, WeaponProperty } from '@representations/campaign/equipment.representation';
import { EquipmentLine } from '@shared/EquipmentLine';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { Fragment, useCallback } from 'react';
import { useAuth } from 'src/providers/AuthProvider';
import { getCoinColor } from '../utils';

interface EquipmentCardProps {
  selectedEquipment: Equipment;
}

export function EquipmentCard({ selectedEquipment }: EquipmentCardProps) {
  const { version } = useAuth();

  const { data: properties } = useQueries({
    queries:
      uniqBy(selectedEquipment.properties, 'index')?.map(({ index }) => ({
        queryKey: ['fetchProperty', version, index],
        queryFn: async () => (version ? await getProperty(version, index) : null),
        enabled: !!index && !!version
      })) || [],
    combine: useCallback((results: UseQueryResult<WeaponProperty | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as WeaponProperty[],
        isFetching: results.some((result) => result.isFetching)
      };
    }, [])
  });

  return (
    <Fragment>
      <DialogTitle display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="baseline" gap="5px">
          {selectedEquipment.name}
          {selectedEquipment.quantity && <Typography>({selectedEquipment.quantity})</Typography>}
        </Box>
        <Box display="flex" flexDirection="column" alignItems="flex-end">
          <Box display="flex" gap="5px">
            <CoinsIcon
              height="20px"
              width="20px"
              fill={getCoinColor(selectedEquipment.cost.unit)}
            />
            <Typography>
              {selectedEquipment.cost.quantity}
              {selectedEquipment.cost.unit}
            </Typography>
          </Box>
          {selectedEquipment.weight && (
            <Box display="flex" paddingLeft="50px" gap="5px">
              <WeightIcon height="20px" width="20px" fill="slategrey" />
              <Typography sx={{ float: 'right' }}>{selectedEquipment.weight}</Typography>
            </Box>
          )}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <DialogContentText textAlign="justify">{selectedEquipment.desc}</DialogContentText>
        {selectedEquipment.armor_class && (
          <EquipmentLine
            label="Armor Class"
            data={`${selectedEquipment.armor_class.base}
            ${selectedEquipment.armor_class.dex_bonus ? ' - Dexterity bonus' : ''}
            ${
              selectedEquipment.armor_class.max_bonus
                ? ` (Max bonus: ${selectedEquipment.armor_class.max_bonus})`
                : ''
            }`}
          />
        )}
        {selectedEquipment.category_range && (
          <EquipmentLine label="Range Category" data={selectedEquipment.category_range} />
        )}
        {selectedEquipment.range && (
          <EquipmentLine
            label="Range"
            data={`${selectedEquipment.range.normal}ft
            ${selectedEquipment.range.long ? ` - ${selectedEquipment.range.long}ft` : ''}`}
          />
        )}
        {selectedEquipment.throw_range && (
          <EquipmentLine
            label="Throw Range"
            data={`
            ${selectedEquipment.throw_range.normal}ft
            ${
              selectedEquipment.throw_range.long ? ` - ${selectedEquipment.throw_range.long}ft` : ''
            }`}
          />
        )}
        {selectedEquipment.damage && (
          <EquipmentLine
            label="Damage"
            data={`${selectedEquipment.damage.damage_dice} ${selectedEquipment.damage.damage_type.name}`}
          />
        )}
        {selectedEquipment.two_handed_damage && (
          <EquipmentLine
            label="Two-Handed Damage"
            data={`${selectedEquipment.two_handed_damage.damage_dice} ${selectedEquipment.two_handed_damage.damage_type.name}`}
          />
        )}
        {selectedEquipment.capacity && (
          <EquipmentLine label="Capacity" data={selectedEquipment.capacity.toString()} />
        )}
        {selectedEquipment.contents?.map((content) => (
          <Typography key={content.item.index}>
            {content.quantity} {content.item.name}
          </Typography>
        ))}
        {selectedEquipment.speed && (
          <EquipmentLine
            label="Speed"
            data={`${selectedEquipment.speed?.quantity} ${selectedEquipment.speed?.unit}`}
          />
        )}
        {selectedEquipment.str_minimum ? (
          <EquipmentLine label="Minimum Strength" data={selectedEquipment.str_minimum.toString()} />
        ) : null}
        {selectedEquipment.stealth_disadvantage && <Typography>Stealth Disadvantage</Typography>}
        {selectedEquipment.special && (
          <EquipmentLine label="Special" data={selectedEquipment.special} />
        )}
        {selectedEquipment.properties && (
          <Box paddingTop="15px">
            {properties.map((property) => (
              <Accordion key={property.index}>
                <AccordionSummary expandIcon={<ExpandMore />}>{property.name}</AccordionSummary>
                <AccordionDetails sx={{ textAlign: 'justify' }}>{property.desc}</AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>
    </Fragment>
  );
}
