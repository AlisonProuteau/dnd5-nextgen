import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { useChoiceSelection } from './useChoiceSelection';

/**
 * Unit tests for useChoiceSelection hook - focused on complex selection logic
 * Note: Basic selection flows are tested at component level (Choices.test.tsx)
 */
describe('useChoiceSelection', () => {
  let selected: any[];
  let inherited: any[];
  let setSelected: MockInstance;

  beforeEach(() => {
    selected = [];
    inherited = [];
    setSelected = vi.fn((data) => {
      selected = data;
    });
  });

  describe('Counted Items - Complex Logic', () => {
    it('should add item with count to selection metadata', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'crossbow-bolt',
        name: 'Crossbow bolt'
      };

      act(() => {
        result.current.handleSelect(true, item, 0, 20);
      });

      expect(setSelected).toHaveBeenCalledWith([
        { index: 'crossbow-bolt', name: 'Crossbow bolt', type: 0, count: 20 }
      ]);
    });

    it('should distinguish items by count in isChecked', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'arrow',
        name: 'Arrow'
      };

      const isChecked1 = result.current.isChecked(item, selected, 1);
      expect(isChecked1).toBe(false);

      act(() => {
        result.current.handleSelect(true, item, 0, 20);
      });

      selected = setSelected.mock.calls[0][0];
      const { result: result2 } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const isChecked20 = result2.current.isChecked(item, selected, 20);
      expect(isChecked20).toBe(true);

      const isChecked1After = result2.current.isChecked(item, selected, 1);
      expect(isChecked1After).toBe(false);
    });

    it('should deselect item with specific count only', () => {
      selected = [{ index: 'arrow', name: 'Arrow', type: 0, count: 20 }];
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'arrow',
        name: 'Arrow'
      };

      act(() => {
        result.current.handleSelect(false, item, 0, 20);
      });

      expect(setSelected).toHaveBeenCalledWith([]);
    });

    it('should use count when calculating selection limit', () => {
      selected = [
        { index: 'arrow', name: 'Arrow', type: 0, count: 15 },
        { index: 'bolt', name: 'Bolt', type: 0, count: 5 }
      ];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'dart',
        name: 'Dart'
      };

      const disabled = result.current.isDisabled(item, 20, 0);

      expect(disabled).toBe(true);
    });
  });

  describe('Bundle Selection - Core Logic', () => {
    it('should add isMultiple flag and type to all bundle items', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const bundleItems: (DefaultRepresentation & { count?: number })[] = [
        { index: 'crossbow-light', name: 'Crossbow, light', count: 1 },
        { index: 'crossbow-bolt', name: 'Crossbow bolt', count: 20 }
      ];

      act(() => {
        result.current.handleSelect(true, bundleItems, 0, undefined, true);
      });

      expect(setSelected).toHaveBeenCalledWith([
        {
          index: 'crossbow-light',
          name: 'Crossbow, light',
          count: 1,
          type: 0,
          isMultiple: true
        },
        {
          index: 'crossbow-bolt',
          name: 'Crossbow bolt',
          count: 20,
          type: 0,
          isMultiple: true
        }
      ]);
    });

    it('should remove ALL bundle items when deselecting (not just provided items)', () => {
      selected = [
        {
          index: 'crossbow-light',
          name: 'Crossbow, light',
          count: 1,
          type: 0,
          isMultiple: true
        },
        {
          index: 'crossbow-bolt',
          name: 'Crossbow bolt',
          count: 20,
          type: 0,
          isMultiple: true
        }
      ];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      // Only provide one item, but should remove all with same type and isMultiple
      const bundleItems: (DefaultRepresentation & { count?: number })[] = [
        { index: 'crossbow-light', name: 'Crossbow, light', count: 1 }
      ];

      act(() => {
        result.current.handleSelect(false, bundleItems, 0, undefined, true);
      });

      expect(setSelected).toHaveBeenCalledWith([]);
    });

    it('should prevent mixing bundle and non-bundle selections via isDisabled', () => {
      selected = [
        {
          index: 'crossbow-light',
          name: 'Crossbow, light',
          count: 1,
          type: 0,
          isMultiple: true
        }
      ];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const nonBundleItem: DefaultRepresentation & { count?: number } = {
        index: 'handaxe',
        name: 'Handaxe'
      };

      const disabled = result.current.isDisabled(nonBundleItem, 1, 0, undefined, false);

      expect(disabled).toBe(true);
    });

    it('should not remove non-bundle items when deselecting a bundle', () => {
      selected = [
        { index: 'crossbow-light', name: 'Crossbow, light', type: 0, isMultiple: true },
        { index: 'crossbow-bolt', name: 'Crossbow bolt', type: 0, isMultiple: true },
        { index: 'handaxe', name: 'Handaxe', type: 1 }
      ];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const bundleItems: (DefaultRepresentation & { count?: number })[] = [
        { index: 'crossbow-light', name: 'Crossbow, light' }
      ];

      act(() => {
        result.current.handleSelect(false, bundleItems, 0, undefined, true);
      });

      expect(setSelected).toHaveBeenCalledWith([{ index: 'handaxe', name: 'Handaxe', type: 1 }]);
    });
  });

  describe('Ability Score Bonuses', () => {
    it('should handle ability score bonus selection with proper metadata', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const abilityBonus: RaceAbilityBonus = {
        ability_score: { index: 'str', name: 'STR' },
        bonus: 1
      };

      act(() => {
        result.current.handleSelect(true, abilityBonus, 0);
      });

      expect(setSelected).toHaveBeenCalledWith([
        {
          ability_score: { index: 'str', name: 'STR' },
          bonus: 1,
          type: 0
        }
      ]);
    });

    it('should match ability bonuses by ability_score.index in isChecked', () => {
      selected = [
        {
          ability_score: { index: 'str', name: 'STR' },
          bonus: 1,
          type: 0
        }
      ];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'str',
        name: 'STR'
      };

      const checked = result.current.isChecked(item, selected);

      expect(checked).toBe(true);
    });
  });

  describe('Multiple Choice Indices - Isolation Logic', () => {
    it('should track type metadata for each choice index', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item1: DefaultRepresentation & { count?: number } = {
        index: 'skill-athletics',
        name: 'Skill: Athletics'
      };
      const item2: DefaultRepresentation & { count?: number } = {
        index: 'chainmail',
        name: 'Chain Mail'
      };

      act(() => {
        result.current.handleSelect(true, item1, 0);
      });

      selected = setSelected.mock.calls[0][0];
      const { result: result2 } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      act(() => {
        result2.current.handleSelect(true, item2, 1);
      });

      expect(setSelected).toHaveBeenLastCalledWith([
        { index: 'skill-athletics', name: 'Skill: Athletics', type: 0 },
        { index: 'chainmail', name: 'Chain Mail', type: 1 }
      ]);
    });

    it('should prevent same item in different choice indices via isDisabled', () => {
      selected = [{ index: 'skill-athletics', name: 'Skill: Athletics', type: 0 }];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'skill-athletics',
        name: 'Skill: Athletics'
      };

      const disabled = result.current.isDisabled(item, 2, 1);

      expect(disabled).toBe(true);
    });
  });

  describe('Selection Limits', () => {
    it('should disable new items when limit reached but not selected items', () => {
      selected = [
        { index: 'skill-athletics', name: 'Skill: Athletics', type: 0 },
        { index: 'skill-perception', name: 'Skill: Perception', type: 0 }
      ];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const newItem: DefaultRepresentation & { count?: number } = {
        index: 'skill-survival',
        name: 'Skill: Survival'
      };

      const selectedItem: DefaultRepresentation & { count?: number } = {
        index: 'skill-athletics',
        name: 'Skill: Athletics'
      };

      expect(result.current.isDisabled(newItem, 2, 0)).toBe(true);
      expect(result.current.isDisabled(selectedItem, 2, 0)).toBe(false);
    });

    it('should filter by option set when provided for limit calculation', () => {
      const skillOptions = ['skill-athletics', 'skill-perception', 'skill-survival'];

      selected = [
        { index: 'skill-athletics', name: 'Skill: Athletics', type: 0 },
        { index: 'skill-survival', name: 'Skill: Survival', type: 0 }
      ];
      let { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );
      const item: DefaultRepresentation & { count?: number } = {
        index: 'skill-perception',
        name: 'Skill: Perception'
      };

      let disabled = result.current.isDisabled(item, 2, 0, undefined, false, skillOptions);
      expect(disabled).toBe(true);

      selected = [
        { index: 'skill-athletics', name: 'Skill: Athletics', type: 0 },
        { index: 'longsword', name: 'Longsword', type: 0 }
      ];
      result = renderHook(() => useChoiceSelection(selected, inherited, setSelected as any)).result;

      disabled = result.current.isDisabled(item, 2, 0, undefined, false, skillOptions);
      expect(disabled).toBe(false);
    });
  });

  describe('Inherited Items', () => {
    it('should disable inherited items via isDisabled', () => {
      inherited = [{ index: 'skill-athletics', name: 'Skill: Athletics' }];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'skill-athletics',
        name: 'Skill: Athletics'
      };

      expect(result.current.isDisabled(item, 2, 0)).toBe(true);
    });

    it('should mark inherited items with count as disabled', () => {
      inherited = [{ index: 'arrow', name: 'Arrow', count: 20 }];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'arrow',
        name: 'Arrow'
      };

      expect(result.current.isDisabled(item, 2, 0, 20)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selection array', () => {
      const { result } = renderHook(() => useChoiceSelection([], inherited, setSelected as any));

      const item: DefaultRepresentation & { count?: number } = {
        index: 'skill-athletics',
        name: 'Skill: Athletics'
      };

      const disabled = result.current.isDisabled(item, 2, 0);

      expect(disabled).toBe(false);
    });

    it('should handle deselection when selection is empty', () => {
      const { result } = renderHook(() => useChoiceSelection([], inherited, setSelected as any));

      const item: DefaultRepresentation & { count?: number } = {
        index: 'skill-athletics',
        name: 'Skill: Athletics'
      };

      act(() => {
        result.current.handleSelect(false, item, 0);
      });

      // Should not call setSelected if nothing to deselect
      expect(setSelected).not.toHaveBeenCalled();
    });

    it('should handle item without count (defaults to 0)', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'longsword',
        name: 'Longsword'
      };

      act(() => {
        result.current.handleSelect(true, item, 0);
      });

      expect(setSelected).toHaveBeenCalledWith([
        { index: 'longsword', name: 'Longsword', type: 0 }
      ]);
    });

    it('should handle selecting empty array', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      act(() => {
        result.current.handleSelect(true, [], 0);
      });

      expect(setSelected).toHaveBeenCalledWith([]);
    });

    it('should handle deselecting empty array', () => {
      selected = [{ index: 'skill-athletics', name: 'Skill: Athletics', type: 0 }];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      act(() => {
        result.current.handleSelect(false, [], 0);
      });

      // Should not change selection
      expect(setSelected).toHaveBeenCalledWith(selected);
    });

    it('should handle bundle deselection when items not all in selection', () => {
      // Only one item from bundle is in selection
      selected = [{ index: 'crossbow-light', name: 'Crossbow, light', type: 0, isMultiple: true }];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const bundleItems: (DefaultRepresentation & { count?: number })[] = [
        { index: 'crossbow-light', name: 'Crossbow, light', count: 1 }
      ];

      act(() => {
        result.current.handleSelect(false, bundleItems, 0, undefined, true);
      });

      // Should remove the bundle item
      expect(setSelected).toHaveBeenCalledWith([]);
    });

    it('should not remove non-bundle items when deselecting a bundle', () => {
      selected = [
        { index: 'crossbow-light', name: 'Crossbow, light', type: 0, isMultiple: true },
        { index: 'crossbow-bolt', name: 'Crossbow bolt', type: 0, isMultiple: true },
        { index: 'handaxe', name: 'Handaxe', type: 1 } // Different choice
      ];

      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const bundleItems: (DefaultRepresentation & { count?: number })[] = [
        { index: 'crossbow-light', name: 'Crossbow, light' }
      ];

      act(() => {
        result.current.handleSelect(false, bundleItems, 0, undefined, true);
      });

      // Should only remove bundle items with type 0 and isMultiple
      expect(setSelected).toHaveBeenCalledWith([{ index: 'handaxe', name: 'Handaxe', type: 1 }]);
    });

    it('should handle count of 0', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const item: DefaultRepresentation & { count?: number } = {
        index: 'test-item',
        name: 'Test Item'
      };

      act(() => {
        result.current.handleSelect(true, item, 0, 0);
      });

      // Count of 0 should not be added
      expect(setSelected).toHaveBeenCalledWith([
        { index: 'test-item', name: 'Test Item', type: 0 }
      ]);
    });
  });

  describe('Real-World Scenarios from Data Source', () => {
    it('should handle Fighter equipment bundle (crossbow + bolts)', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      const bundleItems: (DefaultRepresentation & { count?: number })[] = [
        { index: 'crossbow-light', name: 'Crossbow, light', count: 1 },
        { index: 'crossbow-bolt', name: 'Crossbow bolt', count: 20 }
      ];

      act(() => {
        result.current.handleSelect(true, bundleItems, 0, undefined, true);
      });

      expect(setSelected).toHaveBeenCalledWith([
        {
          index: 'crossbow-light',
          name: 'Crossbow, light',
          count: 1,
          type: 0,
          isMultiple: true
        },
        {
          index: 'crossbow-bolt',
          name: 'Crossbow bolt',
          count: 20,
          type: 0,
          isMultiple: true
        }
      ]);
    });

    it('should handle Fighter equipment choice (chain mail OR leather+longbow+arrows)', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      // Select the bundle option
      const bundleItems: (DefaultRepresentation & { count?: number })[] = [
        { index: 'leather-armor', name: 'Leather Armor', count: 1 },
        { index: 'longbow', name: 'Longbow', count: 1 },
        { index: 'arrow', name: 'Arrow', count: 20 }
      ];

      act(() => {
        result.current.handleSelect(true, bundleItems, 0, undefined, true);
      });

      selected = setSelected.mock.calls[0][0];
      const { result: result2 } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      // Chain mail should be disabled (can't mix bundle and non-bundle)
      const isDisabled = result2.current.isDisabled(
        { index: 'chain-mail', name: 'Chain Mail' },
        1,
        0,
        undefined,
        false
      );

      expect(isDisabled).toBe(true);
    });

    it('should handle Fighter weapon+shield bundle with nested choice', () => {
      const { result } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      // Simulating selecting a martial weapon from nested choice + shield
      const bundleItems: (DefaultRepresentation & { count?: number })[] = [
        { index: 'longsword', name: 'Longsword', count: 1 },
        { index: 'shield', name: 'Shield', count: 1 }
      ];

      act(() => {
        result.current.handleSelect(true, bundleItems, 0, undefined, true);
      });

      expect(setSelected).toHaveBeenCalledWith([
        {
          index: 'longsword',
          name: 'Longsword',
          count: 1,
          type: 0,
          isMultiple: true
        },
        {
          index: 'shield',
          name: 'Shield',
          count: 1,
          type: 0,
          isMultiple: true
        }
      ]);

      selected = setSelected.mock.calls[0][0];
      const { result: result2 } = renderHook(() =>
        useChoiceSelection(selected, inherited, setSelected as any)
      );

      // Deselecting should remove both items
      act(() => {
        result2.current.handleSelect(false, [bundleItems[0]], 0, undefined, true);
      });

      expect(setSelected).toHaveBeenLastCalledWith([]);
    });
  });
});
