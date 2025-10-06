import { getEquipment } from '@api/ressources';
import { CoinsIcon, WeightIcon } from '@assets';
import { Box, Card, CardContent, Dialog, Typography } from '@mui/material';
import { Equipment, MoneyUnits } from '@representations/campaign/equipment.representation';
import { IconText } from '@shared/IconText';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { flatten, groupBy, uniqBy } from 'lodash';
import { Fragment, useCallback, useState } from 'react';
import type { DefaultProps } from 'src/components/Header';
import { getCoinColor } from '../utils';
import { EquipmentCard } from './EquipmentCard';
import { EquipmentList } from './EquipmentList';

export function Equipments({ character }: DefaultProps) {
  const [isDialogOpen, setIsDialogueOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment>();

  const { data: equipmentList } = useQueries({
    queries:
      uniqBy(character?.equipments, 'index')?.map(({ index }) => ({
        queryKey: ['fetchEquipment', character.version, index],
        queryFn: async () => await getEquipment(character.version, index),
        enabled: !!index
      })) || [],
    combine: useCallback((results: UseQueryResult<Equipment | null, Error>[]) => {
      const equipment: (Equipment & { count?: number })[] = (
        results.map(({ data }) => data).filter((data) => data) as Equipment[]
      ).map((eq) => {
        const count = character.equipments?.find(({ index }) => index === eq.index)?.count;
        return count ? { ...eq, count } : eq;
      });

      return {
        data: groupBy(equipment, 'equipment_category.index'),
        isFetching: results.some((result) => result.isFetching)
      };
    }, [])
  });

  return (
    <Fragment>
      <Box display="grid" gridTemplateColumns="1fr 1fr">
        <IconText
          label="Weight"
          value={flatten(Object.values(equipmentList)).reduce(
            (total, equipment) => total + (equipment.weight || 0),
            0
          )}
          Icon={WeightIcon}
          color="grey"
        />
        <Box justifySelf="center" sx={{ '& > *': { my: '-5px' } }}>
          {MoneyUnits.map((coin) => (
            <Box key={coin} display="flex" columnGap="5px" alignItems="center">
              <Typography>{character.money?.[coin] || 0}</Typography>
              <CoinsIcon height="20px" width="20px" fill={getCoinColor(coin)} />
            </Box>
          ))}
        </Box>
      </Box>

      {Object.values(equipmentList).map((category) => (
        <Card key={category[0]?.equipment_category.index}>
          <CardContent>
            <Typography variant="h5">{category[0]?.equipment_category.name || ''}</Typography>
            <EquipmentList
              equipmentList={category}
              onClick={(equipment) => {
                setSelectedEquipment(equipment);
                setIsDialogueOpen(true);
              }}
            />
          </CardContent>
        </Card>
      ))}

      <Dialog open={isDialogOpen} onClose={() => setIsDialogueOpen(false)} fullWidth>
        {selectedEquipment && <EquipmentCard selectedEquipment={selectedEquipment} />}
      </Dialog>
    </Fragment>
  );
}
