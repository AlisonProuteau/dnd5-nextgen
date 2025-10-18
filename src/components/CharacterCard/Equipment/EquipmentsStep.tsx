import { getEquipment } from '@api/ressources';
import { CoinsIcon, WeightIcon } from '@assets';
import { Box, Button, Card, CardContent, Dialog, FormControl, Typography } from '@mui/material';
import {
  Equipment,
  MoneyUnits,
  type MoneyUnitType
} from '@representations/campaign/equipment.representation';
import { IconText } from '@shared/IconText';
import { NumberInput } from '@shared/NumberInput';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { flatten, groupBy, uniqBy } from 'lodash';
import { Fragment, useCallback, useState } from 'react';
import type { DefaultProps } from 'src/components/Header';
import { getCoinColor } from '../utils';
import { EquipmentCard } from './EquipmentCard';
import { EquipmentList } from './EquipmentList';

// TODO: Buy/sell equipment from list
// TODO: Move Manage money dialog to its own component
export function Equipments({ character }: DefaultProps) {
  const [isDialogOpen, setIsDialogueOpen] = useState(false);
  const [isMoneyDialogOpen, setIsMoneyDialogueOpen] = useState(false);
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

  const getFormMoneyData = (formData: HTMLFormElement) =>
    formData
      ? MoneyUnits.reduce((total, currentUnit) => {
          const inputElement = formData.querySelector(
            `#money-units-${currentUnit}`
          ) as HTMLInputElement;

          return { ...total, [currentUnit]: Number(inputElement?.value || 0) };
        }, {} as Record<MoneyUnitType, number>)
      : undefined;

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
        <Box
          justifySelf="center"
          sx={{ '& > *': { my: '-5px' } }}
          onClick={() => setIsMoneyDialogueOpen(true)} //TODO: Change to a button with better accessibility
        >
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

      {/* TODO: Add current money display */}
      {/* TODO: Add 'edit' button? */}
      <Dialog open={isMoneyDialogOpen} onClose={() => setIsMoneyDialogueOpen(false)} fullWidth>
        <Box display="flex" flexDirection="column" p={3} gap={2}>
          <Typography variant="h6">Manage Money</Typography>

          <Box alignSelf="center">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const money = getFormMoneyData(e.currentTarget as HTMLFormElement);
                const button = (e.nativeEvent as SubmitEvent).submitter?.id;

                // TODO: Call updatePurse/buy/sell functions
                console.log(button + ' Money:', money);
              }}
            >
              <FormControl fullWidth sx={{ display: 'flex', flexDirection: 'column' }}>
                {MoneyUnits.map((unit) => (
                  <Box key={`money-units-${unit}`} display="flex" alignItems="center" gap={1}>
                    <NumberInput
                      id={`money-units-${unit}`}
                      min={0}
                      defaultValue={0}
                      onClick={(e) => e.preventDefault()}
                    />
                    <CoinsIcon height="20px" width="20px" fill={getCoinColor(unit)} />
                  </Box>
                ))}

                <Box display="flex" gap={2} marginTop={1}>
                  {['Add', 'Remove'].map((type) => (
                    <Button
                      key={type}
                      id={type}
                      variant="contained"
                      color={type === 'Add' ? 'primary' : 'secondary'}
                      type="submit"
                    >
                      {type}
                    </Button>
                  ))}
                </Box>
              </FormControl>
            </form>
          </Box>

          <Box display="flex" justifyContent="flex-end">
            <Button onClick={() => setIsMoneyDialogueOpen(false)}>Close</Button>
          </Box>
        </Box>
      </Dialog>
    </Fragment>
  );
}
