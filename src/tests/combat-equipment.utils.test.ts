import { describe, expect, it } from 'vitest';
import {
  formatEquipmentForDisplay,
  getArmorClass,
  getBaseHitPoints,
  hasRequiredStrength
} from '@utils/character/character.utils';
import { Equipment } from '@representations/campaign/equipment.representation';
import { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';

describe('Combat & Equipment Functions', () => {
  it('getArmorClass', () => {
    let equipment: (Equipment & { equipped?: boolean })[] = [];
    let features: DefaultRepresentation[] = [];

    // Test: returns 10 + dex modifier
    expect(getArmorClass(2)).toBe(12);

    // TEST: applies armor base AC with dex_bonus false
    equipment = [
      {
        index: 'plate-armor',
        name: 'Plate Armor',
        desc: [],
        cost: { quantity: 1500, unit: 'gp' as const },
        equipment_category: { index: 'armor', name: 'Armor' },
        armor_class: { base: 18, dex_bonus: false },
        equipped: true
      }
    ];
    expect(getArmorClass(3, equipment)).toBe(18);

    // TEST: applies armor base AC + capped dex bonus
    equipment = [
      {
        index: 'chain-shirt',
        name: 'Chain Shirt',
        desc: [],
        cost: { quantity: 50, unit: 'gp' as const },
        equipment_category: { index: 'armor', name: 'Armor' },
        armor_class: { base: 13, dex_bonus: true, max_bonus: 2 },
        equipped: true
      }
    ];
    // dexModifier = 5, max_bonus = 2 → AC = 13 + 2 = 15
    expect(getArmorClass(5, equipment)).toBe(15);

    // TEST: applies shield bonus
    equipment = [
      {
        index: 'shield',
        name: 'Shield',
        desc: [],
        cost: { quantity: 10, unit: 'gp' as const },
        equipment_category: { index: 'armor', name: 'Armor' },
        armor_class: { base: 2, dex_bonus: false },
        equipped: true
      }
    ];
    // unarmored: 10 + 2 (dex) = 12, + shield 2 = 14
    expect(getArmorClass(2, equipment)).toBe(14);

    // TEST: ignores unequipped items
    equipment = [
      {
        index: 'plate-armor',
        name: 'Plate Armor',
        desc: [],
        cost: { quantity: 1500, unit: 'gp' as const },
        equipment_category: { index: 'armor', name: 'Armor' },
        armor_class: { base: 18, dex_bonus: false },
        equipped: false
      }
    ];
    expect(getArmorClass(2, equipment)).toBe(12);

    features = [{ index: 'unarmored-defense-barbarian', name: 'Unarmored Defense' }];
    // TEST: applies unarmored-defense when no armor
    // 10 + dex(2) + additionalModifier(3) = 15
    expect(getArmorClass(2, [], features, 3)).toBe(15);

    // TEST: does not apply unarmored-defense when armor is equipped
    equipment = [
      {
        index: 'leather-armor',
        name: 'Leather Armor',
        desc: [],
        cost: { quantity: 10, unit: 'gp' as const },
        equipment_category: { index: 'armor', name: 'Armor' },
        armor_class: { base: 11, dex_bonus: true },
        equipped: true
      }
    ];
    // Armor: 11 + dex(2) = 13; unarmored path not taken
    expect(getArmorClass(2, equipment, features, 5)).toBe(13);

    // TEST: applies draconic-resilience feature (base 13 + dex) when no armor
    features = [{ index: 'draconic-resilience', name: 'Draconic Resilience' }];
    // 13 + dex(2) = 15
    expect(getArmorClass(2, [], features)).toBe(15);

    // TEST: picks the highest AC when multiple armors are equipped
    equipment = [
      {
        index: 'chain-shirt',
        name: 'Chain Shirt',
        desc: [],
        cost: { quantity: 50, unit: 'gp' as const },
        equipment_category: { index: 'armor', name: 'Armor' },
        armor_class: { base: 13, dex_bonus: true },
        equipped: true
      },
      {
        index: 'breastplate',
        name: 'Breastplate',
        desc: [],
        cost: { quantity: 400, unit: 'gp' as const },
        equipment_category: { index: 'armor', name: 'Armor' },
        armor_class: { base: 14, dex_bonus: true, max_bonus: 2 },
        equipped: true
      }
    ];
    // chain shirt: 13 + dex(3) = 16, breastplate: 14 + min(3,2) = 16 → max = 16
    expect(getArmorClass(3, equipment)).toBe(16);
  });

  it('getBaseHitPoints', () => {
    let features: DefaultRepresentation[] = [];

    // TEST: basic case
    // hitDie=8 (fighter), conModifier=2, level=1 → 10
    expect(getBaseHitPoints(2, [], 8, 1)).toBe(10);

    // TEST: scales con modifier with level
    // hitDie=8, conModifier=2, level=5 → 8 + 10 = 18
    expect(getBaseHitPoints(2, [], 8, 5)).toBe(18);

    // TEST: defaults to hitDie=6 and level=1 when not provided
    // 6 + 1*1 = 7
    expect(getBaseHitPoints(1, [])).toBe(7);

    // TEST: adds +1 for draconic-resilience feature
    features = [{ index: 'draconic-resilience', name: 'Draconic Resilience' }];
    // hitDie=6, conModifier=2, level=1 → 6 + 2 + 1 = 9
    expect(getBaseHitPoints(2, features, 6, 1)).toBe(9);

    // TEST: does not add +1 for unrelated features
    features = [{ index: 'unarmored-defense', name: 'Unarmored Defense' }];
    expect(getBaseHitPoints(2, features, 6, 1)).toBe(8);

    // TEST: handles negative con modifier
    // hitDie=8, conModifier=-1, level=3 → 8 + (-3) = 5
    expect(getBaseHitPoints(-1, [], 8, 3)).toBe(5);
  });

  it('hasRequiredStrength', () => {
    const baseEquipment = {
      index: 'plate-armor',
      name: 'Plate Armor',
      desc: [],
      cost: { quantity: 1500, unit: 'gp' as const },
      equipment_category: { index: 'armor', name: 'Armor' }
    };

    // TEST: no str_minimum
    expect(hasRequiredStrength(10, { ...baseEquipment })).toBe(true);

    // TEST: character strength meets the minimum
    expect(hasRequiredStrength(15, { ...baseEquipment, str_minimum: 15 })).toBe(true);

    // TEST: character strength exceeds the minimum
    expect(hasRequiredStrength(20, { ...baseEquipment, str_minimum: 15 })).toBe(true);

    // TEST: character strength is below the minimum
    expect(hasRequiredStrength(10, { ...baseEquipment, str_minimum: 15 })).toBe(false);

    // TEST: str_minimum is 0 (falsy)
    expect(hasRequiredStrength(1, { ...baseEquipment, str_minimum: 0 })).toBe(true);
  });

  it('formatEquipmentForDisplay', () => {
    const sword = {
      index: 'longsword',
      name: 'Longsword',
      desc: [],
      cost: { quantity: 15, unit: 'gp' as const },
      equipment_category: { index: 'weapon', name: 'Weapon' }
    };
    const shield = {
      index: 'shield',
      name: 'Shield',
      desc: [],
      cost: { quantity: 10, unit: 'gp' as const },
      equipment_category: { index: 'armor', name: 'Armor' }
    };
    let characterEquipment: Character['equipments'] = [];
    let result = [] as ReturnType<typeof formatEquipmentForDisplay>;

    // TEST: marks item as equipped:true when character equipment has no equipped flag
    characterEquipment = [{ index: 'longsword' }] as Character['equipments'];
    result = formatEquipmentForDisplay([sword], characterEquipment);
    expect(result[0].equipped).toBe(true);

    // TEST: preserves equipped:false from character equipment
    characterEquipment = [{ index: 'longsword', equipped: false }] as Character['equipments'];
    result = formatEquipmentForDisplay([sword], characterEquipment);
    expect(result[0].equipped).toBe(false);

    // TEST: adds count when character equipment has a count
    characterEquipment = [{ index: 'longsword', count: 3 }] as Character['equipments'];
    result = formatEquipmentForDisplay([sword], characterEquipment);
    expect(result[0].count).toBe(3);

    // TEST: does not add count property when count is absent
    characterEquipment = [{ index: 'longsword' }] as Character['equipments'];
    result = formatEquipmentForDisplay([sword], characterEquipment);
    expect('count' in result[0]).toBe(false);

    // TEST: handles multiple items correctly
    characterEquipment = [
      { index: 'longsword', equipped: true },
      { index: 'shield', equipped: false }
    ] as Character['equipments'];
    result = formatEquipmentForDisplay([sword, shield], characterEquipment);
    expect(result[0].equipped).toBe(true);
    expect(result[1].equipped).toBe(false);

    // TEST: defaults equipped to true when item is not in characterEquipment
    characterEquipment = [];
    result = formatEquipmentForDisplay([sword], characterEquipment);
    expect(result[0].equipped).toBe(true);
  });
});
