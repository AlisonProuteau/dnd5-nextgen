import { getEquipment } from '@api/ressources';
import { BladeIcon, MoneyIcon, ShieldIcon, WeightIcon } from '@assets';
import { InfoOutlined } from '@mui/icons-material';
import { Box, Card, CardContent, Dialog, IconButton, Typography } from '@mui/material';
import { Equipment } from '@representations/campaign/equipment.representation';
import type { Character } from '@representations/user.representation';
import { IconText } from '@shared/IconText';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { flatten, groupBy } from 'lodash';
import { Fragment, useCallback, useState } from 'react';
import { EquipmentCard } from './EquipmentCard';

export function Equipments({ character }: { character: Character }) {
  const [isDialogOpen, setIsDialogueOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment>();

  const { data: equipmentList } = useQueries({
    queries:
      character?.equipments?.map(({ index }) => ({
        queryKey: ['fetchEquipment', index],
        queryFn: async () => await getEquipment(index),
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

  const getCount = (count?: number, quantity?: number): string => {
    if (count && count > 1) return count.toString();
    if (quantity && quantity > 1) return quantity.toString();

    return '';
  };

  return (
    <Fragment>
      <Box display="grid" gridTemplateColumns="1fr 1fr">
        <IconText
          label="GP"
          value={character.armorClass}
          Icon={MoneyIcon}
          color="grey"
          top="34px"
        />
        <IconText
          label="Weight"
          value={flatten(Object.values(equipmentList)).reduce(
            (total, equipment) => total + (equipment.weight || 0),
            0
          )}
          Icon={WeightIcon}
          color="grey"
        />
      </Box>
      {Object.values(equipmentList).map((category) => {
        return (
          <Card key={category[0]?.equipment_category.index}>
            <CardContent>
              <Typography variant="h5">{category[0]?.equipment_category.name || ''}</Typography>
              {category.map((equipment) => (
                <Box key={equipment.index}>
                  <IconButton
                    sx={{ verticalAlign: 'center' }}
                    onClick={() => {
                      setSelectedEquipment(equipment);
                      setIsDialogueOpen(true);
                    }}
                  >
                    <InfoOutlined color="info" fontSize="small" />
                  </IconButton>
                  <Typography display="contents">
                    {`${getCount(equipment.count, equipment.quantity)} ${equipment.name}`}
                  </Typography>
                  {(equipment.damage || equipment.two_handed_damage) && (
                    <Box display="flex" paddingLeft="50px" gap="5px">
                      <BladeIcon height="20px" width="20px" fill="white" />
                      <Typography>
                        {equipment.damage?.damage_dice} {equipment.damage?.damage_type.name}
                      </Typography>
                    </Box>
                  )}
                  {equipment.armor_class && (
                    <Box display="flex" paddingLeft="50px" gap="5px">
                      <ShieldIcon height="20px" width="20px" fill="white" />
                      <Typography>
                        {equipment.armor_class.base} AC
                        {equipment.armor_class.dex_bonus ? ' - Dexterity bonus' : ''}
                        {equipment.armor_class.max_bonus
                          ? ` (Max: ${equipment.armor_class.max_bonus})`
                          : ''}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={isDialogOpen} onClose={() => setIsDialogueOpen(false)} fullWidth>
        {selectedEquipment && <EquipmentCard selectedEquipment={selectedEquipment} />}
      </Dialog>
    </Fragment>
  );
}
