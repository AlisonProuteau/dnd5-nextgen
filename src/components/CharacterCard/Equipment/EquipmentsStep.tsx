import { useCallback, useEffect, useState } from 'react';
import { WeightIcon } from '@assets';
import { Box, Button, Card, CardContent, Dialog, Typography } from '@mui/material';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { flatten, groupBy, uniqBy } from 'lodash';
import { getEquipment, getMagicItem } from '@api/ressources';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { IconText } from '@shared/IconText';
import { getArmorClass, hasRequiredStrength } from '@utils/character';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type { Equipment } from '@representations/campaign/equipment.representation';
import type { Character } from '@representations/user.representation';
import type { DefaultProps } from 'src/pages/Header';
import { EquipmentCard } from './EquipmentCard';
import { EquipmentListItem } from './EquipmentListItem';
import { Market } from './Market';
import { MoneyDisplay } from './MoneyDisplay';

export function Equipments({ character }: DefaultProps) {
  const { isOn: isDialogOpen, turnOn: openDialog, turnOff: closeDialog } = useToggle(false);
  const { isOn: isMarketOpen, turnOn: openMarket, turnOff: closeMarket } = useToggle(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | MagicItem>();
  const firebaseCrud = useFirebaseCrud<Character>({
    collectionPath: `users/{userId}/characters`,
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id]
  });

  const { data: equipmentList, isFetching: isEquipmentListFetching } = useQueries({
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
        const equipment: ((Equipment | MagicItem) & {
          count?: number;
          equipped: boolean;
        })[] = (results.map(({ data }) => data).filter((data) => data) as Equipment[]).map((eq) => {
          const currentEquipment = character.equipments?.find(({ index }) => index === eq.index);
          const formattedEq = { ...eq, equipped: currentEquipment?.equipped ?? true };
          const count = currentEquipment?.count;

          return count ? { ...formattedEq, count } : formattedEq;
        });

        return {
          data: groupBy(equipment, 'equipment_category.index'),
          isFetching: results.some((result) => result.isFetching)
        };
      },
      [character.equipments]
    )
  });

  useEffect(() => {
    if (isEquipmentListFetching || !Object.values(equipmentList).flat().length) return;

    const updatedEquipments = Object.values(equipmentList)
      .flat()
      .map((eq) => ({
        ...eq,
        equipped: character.equipments.find(({ index }) => index === eq?.index)?.equipped ?? true
      }));
    const newArmorClass = getArmorClass(
      character.abilityScores['dex'].modifier,
      updatedEquipments || [],
      character?.features,
      character?.class.index === 'monk'
        ? character.abilityScores['wis']?.modifier || 0
        : character.abilityScores['con']?.modifier || 0
    );

    if (newArmorClass !== character.armorClass) {
      firebaseCrud.update(character.id, {
        armorClass: newArmorClass
      });
    }
  }, [Object.values(equipmentList).flat(), character.equipments, isEquipmentListFetching]);

  const toggleEquip = async (equipment: Equipment | MagicItem) => {
    const updatedEquipments = [...character.equipments];
    const currentEquipmentIndex = updatedEquipments.findIndex(
      ({ index }) => index === equipment.index
    );
    if (currentEquipmentIndex === -1) return;

    updatedEquipments[currentEquipmentIndex] = {
      ...updatedEquipments[currentEquipmentIndex],
      equipped: !(updatedEquipments[currentEquipmentIndex!].equipped ?? true)
    };
    const fullUpdatedEquipments = updatedEquipments
      .map(({ index, equipped }) => ({
        ...(Object.values(equipmentList)
          .flat()
          .find((eq) => eq.index === index) || {}),
        equipped
      }))
      .filter(Boolean) as (Equipment | MagicItem)[];
    const newArmorClass = getArmorClass(
      character.abilityScores['dex'].modifier,
      fullUpdatedEquipments,
      character?.features,
      character?.class.index === 'monk'
        ? character.abilityScores['wis']?.modifier || 0
        : character.abilityScores['con']?.modifier || 0
    );

    await firebaseCrud.update(character.id, {
      equipments: updatedEquipments,
      armorClass: newArmorClass
    });
  };

  return (
    <Box data-testid="equipment-section" display="flex" gap="15px" flexDirection="column">
      <Box data-testid="equipment-section-header" display="grid" gridTemplateColumns="1fr 1fr">
        <IconText
          label="Weight"
          value={flatten(Object.values(equipmentList)).reduce(
            (total, equipment) =>
              'weight' in equipment && equipment.equipped ? total + (equipment.weight || 0) : total,
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

      <Box
        data-testid="equipment-section-content"
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(375px, 1fr))"
        gap={1}
      >
        {Object.entries(equipmentList).map(([category, equipment]) => (
          <Card key={category}>
            <CardContent>
              <Typography variant="h5">{equipment[0].equipment_category.name || ''}</Typography>
              {[...equipment].map((e) => (
                <EquipmentListItem
                  key={e.index}
                  equipment={e}
                  onClick={(equipment) => {
                    setSelectedEquipment(equipment);
                    openDialog();
                  }}
                  onToggleEquip={toggleEquip}
                  canEquip={!firebaseCrud.isLoading}
                  hasRequiredStrength={(equipment) =>
                    hasRequiredStrength(character.abilityScores['str']?.score || 0, equipment)
                  }
                />
              ))}
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
          closeMarket={closeMarket}
        />
      </Dialog>
    </Box>
  );
}
