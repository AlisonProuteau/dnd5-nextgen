import type { MagicItem } from '@representations/abilities/magic.representation';
import type { Equipment } from '@representations/campaign/equipment.representation';

/**
 * Updates equipment quantity in a list
 * @param equipments Current equipment list
 * @param itemIndex Index of item to update
 * @param quantityChange Amount to add (positive) or remove (negative)
 * @returns Updated equipment list with null items filtered out
 */
export function updateEquipmentQuantity(
  equipments: Array<{ index: string; count?: number }>,
  itemIndex: string,
  quantityChange: number
): Array<{ index: string; count?: number }> {
  return equipments
    .map((eq) => {
      if (eq.index === itemIndex) {
        const newCount = (eq.count || 1) + quantityChange;
        return newCount > 0 ? { ...eq, count: newCount } : null;
      }
      return eq;
    })
    .filter((eq): eq is { index: string; count?: number } => eq !== null && eq.count !== 0);
}

/**
 * Adds or updates equipment in a list
 * @param equipments Current equipment list
 * @param item Item to add or update
 * @param quantity Quantity to add
 * @returns Updated equipment list
 */
export function addOrUpdateEquipment(
  equipments: Array<{ index: string; name: string; count?: number }>,
  item: { index: string; name: string },
  quantity: number
): Array<{ index: string; name: string; count?: number }> {
  const existingItem = equipments.find((eq) => eq.index === item.index);

  if (existingItem) {
    return equipments.map((eq) => {
      if (eq.index === item.index) {
        return { ...eq, count: (eq.count || 1) + quantity };
      }
      return eq;
    });
  }

  return [...equipments, { index: item.index, name: item.name, count: quantity }];
}

/**
 * Calculates total quantity for an item (accounting for bundled items)
 * @param item Equipment or magic item
 * @param quantity Base quantity
 * @returns Total quantity
 */
export function calculateTotalQuantity(item: Equipment | MagicItem, quantity: number = 1): number {
  return 'quantity' in item ? quantity * (item.quantity || 1) : quantity;
}
