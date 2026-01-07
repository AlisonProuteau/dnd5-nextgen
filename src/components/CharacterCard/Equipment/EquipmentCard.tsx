import { Fragment, useCallback } from 'react';
import { WeightIcon } from '@assets';
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
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { getProperty } from '@api/ressources';
import { EquipmentLine } from '@shared/EquipmentLine';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type { Equipment, WeaponProperty } from '@representations/campaign/equipment.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { MoneyDisplay } from './MoneyDisplay';

interface EquipmentCardProps {
  selectedEquipment: Equipment | MagicItem;
}

export function EquipmentCard({ selectedEquipment }: EquipmentCardProps) {
  const { version } = useAuth();

  const { data: properties } = useQueries({
    queries:
      uniqBy('properties' in selectedEquipment ? selectedEquipment.properties : [], 'index')?.map(
        ({ index }) => ({
          queryKey: ['fetchProperty', version, index],
          queryFn: async () => (version ? await getProperty(version, index) : null),
          enabled: !!index && !!version
        })
      ) || [],
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
          {'quantity' in selectedEquipment && selectedEquipment.quantity && (
            <Typography>({selectedEquipment.quantity})</Typography>
          )}
        </Box>
        <Box display="flex" flexDirection="column" alignItems="flex-end">
          <Box display="flex" gap="5px">
            <MoneyDisplay
              purse={
                'cost' in selectedEquipment
                  ? { [selectedEquipment.cost.unit]: selectedEquipment.cost.quantity }
                  : {}
              }
              showZero={false}
              display="inline-flex"
              gap={0.5}
              flexWrap="wrap"
              justifyContent="flex-end"
            />
          </Box>
          {'weight' in selectedEquipment && selectedEquipment.weight ? (
            <Box display="flex" paddingLeft="50px" gap="5px">
              <WeightIcon height="20px" width="20px" fill="slategrey" />
              <Typography sx={{ float: 'right' }}>{selectedEquipment.weight}</Typography>
            </Box>
          ) : null}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <DialogContentText textAlign="justify">{selectedEquipment.desc}</DialogContentText>
        {'armor_class' in selectedEquipment && selectedEquipment.armor_class && (
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
        {'category_range' in selectedEquipment && selectedEquipment.category_range && (
          <EquipmentLine label="Range Category" data={selectedEquipment.category_range.name} />
        )}
        {'range' in selectedEquipment && selectedEquipment.range && (
          <EquipmentLine
            label="Range"
            data={`${selectedEquipment.range.normal}ft
            ${selectedEquipment.range.long ? ` - ${selectedEquipment.range.long}ft` : ''}`}
          />
        )}
        {'throw_range' in selectedEquipment && selectedEquipment.throw_range && (
          <EquipmentLine
            label="Throw Range"
            data={`
            ${selectedEquipment.throw_range.normal}ft
            ${
              selectedEquipment.throw_range.long ? ` - ${selectedEquipment.throw_range.long}ft` : ''
            }`}
          />
        )}
        {'damage' in selectedEquipment && selectedEquipment.damage && (
          <EquipmentLine
            label="Damage"
            data={`${selectedEquipment.damage.damage_dice} ${selectedEquipment.damage.damage_type.name}`}
          />
        )}
        {'two_handed_damage' in selectedEquipment && selectedEquipment.two_handed_damage && (
          <EquipmentLine
            label="Two-Handed Damage"
            data={`${selectedEquipment.two_handed_damage.damage_dice} ${selectedEquipment.two_handed_damage.damage_type.name}`}
          />
        )}
        {'capacity' in selectedEquipment && selectedEquipment.capacity ? (
          <EquipmentLine label="Capacity" data={selectedEquipment.capacity.toString()} />
        ) : null}
        {'contents' in selectedEquipment &&
          selectedEquipment.contents?.map((content) => (
            <Typography key={content.item.index}>
              {content.quantity} {content.item.name}
            </Typography>
          ))}
        {'speed' in selectedEquipment && selectedEquipment.speed && (
          <EquipmentLine
            label="Speed"
            data={`${selectedEquipment.speed?.quantity} ${selectedEquipment.speed?.unit}`}
          />
        )}
        {'str_minimum' in selectedEquipment && selectedEquipment.str_minimum ? (
          <EquipmentLine label="Minimum Strength" data={selectedEquipment.str_minimum.toString()} />
        ) : null}
        {'stealth_disadvantage' in selectedEquipment && selectedEquipment.stealth_disadvantage ? (
          <Typography>Stealth Disadvantage</Typography>
        ) : null}
        {'special' in selectedEquipment && selectedEquipment.special && (
          <EquipmentLine label="Special" data={selectedEquipment.special} />
        )}
        {'properties' in selectedEquipment && selectedEquipment.properties && (
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
