import { Fragment, useMemo, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getAllEquipment, getAllMagicItems, getEquipmentCategories } from '@api/ressources';
import { ControledInput } from '@shared/ControledInput';
import { Loader } from '@shared/Loader';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type {
  Equipment,
  MoneyObjectType
} from '@representations/campaign/equipment.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { MarketItem } from './MarketItem';

interface MarketSearchProps {
  isFreeMode?: boolean;
  canBuy?: (
    item: Equipment | MagicItem,
    quantity?: number,
    customPrice?: MoneyObjectType
  ) => boolean;
  onBuy?: (
    item: Equipment | MagicItem,
    quantity?: number,
    customPrice?: MoneyObjectType
  ) => Promise<void>;
  disableAction?: boolean;
  hasRequiredStrength?: (equipment: Equipment | MagicItem) => boolean;
}

export function MarketSearch({
  isFreeMode = false,
  canBuy = () => false,
  onBuy = async () => {},
  disableAction = false,
  hasRequiredStrength = () => true
}: MarketSearchProps = {}) {
  const { version } = useAuth();
  const [search, setSearch] = useState('');
  const [runningTimer, setRunningTimer] = useState<NodeJS.Timeout>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');

  const { data: equipmentCategories, isFetching: isEquipmentCategoriesLoading } = useQuery({
    queryKey: ['fetchEquipmentCategories', version],
    queryFn: async () => (version ? (await getEquipmentCategories(version)).results : null),
    select: (data) => [{ index: 'all', name: 'All' }, ...(data || [])] as typeof data,
    enabled: !!version
  });

  const { data: allEquipment, isFetching: isEquipmentListLoading } = useQuery({
    queryKey: ['fetchAllEquipment', version, selectedCategory, selectedSubCategory],
    queryFn: async () => {
      if (!version) return null;
      const categoryFilter = selectedCategory !== 'all' ? selectedCategory : undefined;
      const subCategoryFilter = selectedSubCategory !== 'all' ? selectedSubCategory : undefined;

      const equipmentList =
        categoryFilter !== 'magic-items'
          ? (await getAllEquipment(version, categoryFilter, subCategoryFilter)).results
          : [];

      const magicItemList =
        !categoryFilter || categoryFilter === 'magic-items'
          ? (await getAllMagicItems(version, subCategoryFilter)).results
          : [];

      return [...equipmentList, ...magicItemList];
    },
    enabled:
      !!version &&
      !isEquipmentCategoriesLoading &&
      !!equipmentCategories?.length &&
      (selectedCategory !== 'all' || search.length > 0)
  });

  const equipment = useMemo(() => {
    if (
      !allEquipment?.length ||
      (selectedCategory === 'all' && search.length === 0) ||
      isEquipmentListLoading
    )
      return [];
    return allEquipment.filter(({ name }) => name.toLowerCase().includes(search.toLowerCase()));
  }, [
    search,
    selectedCategory,
    isEquipmentListLoading,
    allEquipment
      ?.map(({ index }) => index)
      .sort((a, b) => a.localeCompare(b))
      .join(', ')
  ]);

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box paddingY={1}>
        {!isEquipmentCategoriesLoading && equipmentCategories?.length ? (
          <Fragment>
            <FormControl fullWidth>
              <InputLabel htmlFor="equipmentCategory">Category</InputLabel>
              <Select
                id="equipmentCategory"
                value={selectedCategory ?? 'all'}
                label="Category"
                onChange={(event) => {
                  setSelectedSubCategory('all');
                  setSelectedCategory(event.target.value);
                }}
              >
                {equipmentCategories.map((cat) => (
                  <MenuItem key={cat.index} id={cat.index} value={cat.index}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {equipmentCategories.find(({ index }) => index === selectedCategory)?.subcategories
              ?.length ? (
              <FormControl fullWidth sx={{ marginTop: 2 }}>
                <InputLabel htmlFor="equipmentSubcategory">Sub-Category</InputLabel>
                <Select
                  id="equipmentSubcategory"
                  value={selectedSubCategory ?? 'all'}
                  label="Sub-Category"
                  onChange={(event) => setSelectedSubCategory(event.target.value)}
                >
                  {[
                    { index: 'all', name: 'All' },
                    ...equipmentCategories.find(({ index }) => index === selectedCategory)!
                      .subcategories
                  ].map((cat) => (
                    <MenuItem key={cat.index} id={cat.index} value={cat.index}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}
          </Fragment>
        ) : null}

        <ControledInput
          fullWidth
          id="search"
          type="text"
          label="Search"
          onChange={(value: string | boolean | undefined) => {
            if (runningTimer) clearTimeout(runningTimer);
            setRunningTimer(setTimeout(() => setSearch(value as string), 500));
          }}
        />
      </Box>

      <Box overflow="auto" flex={1} alignSelf="center" width="100%">
        {isEquipmentListLoading ? (
          <Loader />
        ) : equipment.length === 0 ? (
          <Typography color="text.secondary" textAlign="center">
            {selectedCategory === 'all' && search.length === 0
              ? 'Select a category or search to see items'
              : 'No items to buy'}
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={1}>
            {equipment.map((item) =>
              'cost' in item ? (
                <MarketItem
                  key={`buy-${item.index}`}
                  item={item}
                  mode="buy"
                  isFreeMode={isFreeMode}
                  priceDisplay={{ [item.cost.unit]: item.cost.quantity }}
                  canBuy={canBuy}
                  onAction={onBuy}
                  disableAction={disableAction}
                  hasRequiredStrength={hasRequiredStrength}
                />
              ) : (
                <MarketItem
                  key={`buy-${item.index}`}
                  item={item}
                  mode="buy"
                  isFreeMode={isFreeMode}
                  canBuy={canBuy}
                  onAction={onBuy}
                  disableAction={disableAction}
                  hasRequiredStrength={hasRequiredStrength}
                />
              )
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
