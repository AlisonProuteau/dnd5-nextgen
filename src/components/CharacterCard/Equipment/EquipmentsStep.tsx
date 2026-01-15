import { Fragment, useCallback, useState } from 'react';
import { WeightIcon } from '@assets';
import { Box, Button, Card, CardContent, Dialog, Typography } from '@mui/material';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { flatten, groupBy, uniqBy } from 'lodash';
import { getEquipment, getMagicItem } from '@api/ressources';
import { useToggle } from '@hooks/useToggle';
import { IconText } from '@shared/IconText';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type { Equipment } from '@representations/campaign/equipment.representation';
import type { DefaultProps } from 'src/pages/Header';
import { EquipmentCard } from './EquipmentCard';
import { EquipmentList } from './EquipmentList';
import { Market } from './Market';
import { MoneyDisplay } from './MoneyDisplay';

// TODO: Used/Unused equipment selector + weight/AC calculations
// TODO: Add prerequiste warnings for equipping items
export function Equipments({ character }: DefaultProps) {
  const { isOn: isDialogOpen, turnOn: openDialog, turnOff: closeDialog } = useToggle(false);
  const { isOn: isMarketOpen, turnOn: openMarket, turnOff: closeMarket } = useToggle(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | MagicItem>();

  const { data: equipmentList } = useQueries({
    queries:
      uniqBy(character?.equipments, 'index')?.map(({ index }) => ({
        queryKey: ['fetchEquipment', character.version, index],
        queryFn: async () => {
          let item: Equipment | MagicItem | null = await getEquipment(character.version, index);
          if (!item) {
            item = await getMagicItem(character.version, index);
          }

          return item;
        },
        enabled: !!index
      })) || [],
    combine: useCallback(
      (results: UseQueryResult<Equipment | MagicItem | null, Error>[]) => {
        const equipment: ((Equipment | MagicItem) & { count?: number })[] = (
          results.map(({ data }) => data).filter((data) => data) as Equipment[]
        ).map((eq) => {
          const count = character.equipments?.find(({ index }) => index === eq.index)?.count;
          return count ? { ...eq, count } : eq;
        });

        return {
          data: groupBy(equipment, 'equipment_category.index'),
          isFetching: results.some((result) => result.isFetching)
        };
      },
      [character.equipments]
    )
  });

  return (
    <Fragment>
      <Box data-testid="equipment-section-header" display="grid" gridTemplateColumns="1fr 1fr">
        <IconText
          label="Weight"
          value={flatten(Object.values(equipmentList)).reduce(
            (total, equipment) => ('weight' in equipment ? total + (equipment.weight || 0) : total),
            0
          )}
          Icon={WeightIcon}
          color="grey"
          testid="inventory-weight"
        />
        <MoneyDisplay justifySelf="center" purse={character.money} />
      </Box>

      <Button
        variant="outlined"
        sx={{ alignSelf: 'center', marginBottom: '10px' }}
        onClick={openMarket}
      >
        Market
      </Button>

      <Box data-testid="equipment-section-content">
        {Object.entries(equipmentList).map(([category, equipment]) => (
          <Card key={category}>
            <CardContent>
              <Typography variant="h5">{equipment[0].equipment_category.name || ''}</Typography>
              <EquipmentList
                equipmentList={[...equipment]}
                onClick={(equipment) => {
                  setSelectedEquipment(equipment);
                  openDialog();
                }}
              />
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={isDialogOpen} onClose={closeDialog} fullWidth>
        {selectedEquipment && <EquipmentCard selectedEquipment={selectedEquipment} />}
      </Dialog>

      <Dialog open={isMarketOpen} onClose={closeMarket} fullWidth maxWidth="md">
        <Market
          character={character}
          purse={character.money || { cp: 0, sp: 0, gp: 0 }}
          ownedEquipment={Object.values(equipmentList).flat()}
        />
      </Dialog>
    </Fragment>
  );
}
