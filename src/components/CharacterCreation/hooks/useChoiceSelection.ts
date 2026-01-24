import type { ChoiceObjectType } from '@utils/character';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';

interface SelectionItem extends DefaultRepresentation {
  type?: number;
  count?: number;
  isMultiple?: boolean;
}

type InheritedItem = (DefaultRepresentation & { count?: number }) | RaceAbilityBonus;

/**
 * Custom hook to manage choice selection logic
 */
export function useChoiceSelection(
  selected: (ChoiceObjectType | RaceAbilityBonus)[],
  inherited: InheritedItem[],
  setSelected: (data: any) => void
) {
  const isItemMatch = (
    current: ChoiceObjectType | RaceAbilityBonus,
    toSearch: DefaultRepresentation | RaceAbilityBonus
  ) => {
    if ('index' in current && 'index' in toSearch) return current.index === toSearch.index;
    if ('ability_score' in current && 'ability_score' in toSearch)
      return current.ability_score.index === toSearch.ability_score.index;
    return false;
  };

  const isChecked = (
    item: DefaultRepresentation,
    selection: (SelectionItem | RaceAbilityBonus)[],
    count?: number,
    isMultiple?: boolean
  ): boolean => {
    return selection.some((current) => {
      if ('index' in current)
        return (
          current.index === item.index &&
          (current.count || 0) === (count || 0) &&
          current.isMultiple === isMultiple
        );
      if ('ability_score' in current) return current.ability_score.index === item.index;

      return false;
    });
  };

  const isDisabled = (
    item: DefaultRepresentation,
    choose: number,
    choiceIndex: number,
    count?: number,
    isMultiple?: boolean,
    options?: string[]
  ): boolean => {
    if (isChecked(item, inherited, count, isMultiple)) return true;

    // Filter selections for this specific choice type
    let filteredSelection = selected.filter((selection) =>
      'type' in selection ? selection.type === choiceIndex : true
    );

    // If checked in another choice type, disable it
    if (
      !isChecked(item, filteredSelection, count, isMultiple) &&
      isChecked(item, selected, count, isMultiple)
    )
      return true;

    // No selections yet, not disabled
    if (!filteredSelection.length) return false;

    // If this item is already checked, it's not disabled
    if (isChecked(item, filteredSelection, count, isMultiple)) return false;

    // Prevent mixing bundle and non-bundle selections
    const hasBundleSelections = filteredSelection.some(
      (sel) => 'isMultiple' in sel && sel.isMultiple
    );
    const hasNonBundleSelections = filteredSelection.some(
      (sel) => !('isMultiple' in sel) || !sel.isMultiple
    );

    // If this is a bundle item and non-bundle items are selected, disable it
    if (isMultiple && hasNonBundleSelections) return true;

    // If this is a non-bundle item and bundle items are selected, disable it
    if (!isMultiple && hasBundleSelections) return true;

    // Filter by options if provided (for limit checking within option sets)
    const selectionForLimitCheck = options
      ? filteredSelection.filter((selection) =>
          options.includes('index' in selection ? selection.index : selection.ability_score.index)
        )
      : filteredSelection;

    // Check if we've reached the selection limit
    const totalSelected = selectionForLimitCheck.reduce(
      (acc, current) => acc + ('count' in current ? current.count || 1 : 1),
      0
    );

    return totalSelected >= choose;
  };

  const handleSelect = (
    checked: boolean,
    item:
      | DefaultRepresentation
      | RaceAbilityBonus
      | ((RaceAbilityBonus | DefaultRepresentation) & { count?: number })[],
    choiceIndex: number,
    count?: number,
    isMultiple?: boolean
  ) => {
    if (checked) {
      const mapData = (data: DefaultRepresentation | RaceAbilityBonus, currentCount?: number) => {
        const newData =
          currentCount && currentCount > 0
            ? { ...data, type: choiceIndex, count: currentCount }
            : { ...data, type: choiceIndex };
        return isMultiple ? { ...newData, isMultiple } : newData;
      };

      if (Array.isArray(item)) setSelected([...selected, ...item.map((i) => mapData(i, i.count))]);
      else setSelected([...selected, mapData(item, count)]);
    } else if (selected.length) {
      if (Array.isArray(item)) {
        let newArray = [...selected];

        // For bundle items (isMultiple), remove ALL items with the same type
        if (isMultiple && item.length > 0) {
          const firstItem = item[0];
          const foundItem = newArray.find((current) => isItemMatch(current, firstItem));
          const bundleType = foundItem && 'type' in foundItem ? foundItem.type : undefined;
          if (bundleType !== undefined) {
            newArray = newArray.filter(
              (current) =>
                !(
                  'type' in current &&
                  'isMultiple' in current &&
                  current.type === bundleType &&
                  current.isMultiple
                )
            );
          }
        } else newArray = newArray.filter((current) => item.every((i) => !isItemMatch(current, i)));

        setSelected(newArray);
      } else setSelected(selected.filter((current) => !isItemMatch(current, item)));
    }
  };

  return {
    isChecked,
    isDisabled,
    handleSelect
  };
}
