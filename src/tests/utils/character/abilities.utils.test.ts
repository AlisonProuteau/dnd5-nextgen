import { describe, expect, it } from 'vitest';
import {
  buyItem,
  remainingMoneyInCopper,
  sellItem,
  updatePurse
} from '@utils/character/abilities.utils';

describe('Coin Management Functions', () => {
  describe('remainingMoneyInCopper', () => {
    it('should calculate total copper from a purse with mixed denominations', () => {
      const purse = { gp: 5, sp: 3, cp: 7 };
      const result = remainingMoneyInCopper(purse, {});

      expect(result).toBe(537); // (5 * 100) + (3 * 10) + 7
    });

    it('should add positive amounts correctly', () => {
      const purse = { gp: 1, sp: 0, cp: 0 };
      const amount = { gp: 2, sp: 5, cp: 3 };
      const result = remainingMoneyInCopper(purse, amount);

      expect(result).toBe(353); // 100 + 200 + 50 + 3
    });

    it('should subtract negative amounts correctly', () => {
      const purse = { gp: 5, sp: 0, cp: 0 };
      const amount = { gp: -2, sp: -5, cp: -3 };
      const result = remainingMoneyInCopper(purse, amount);

      expect(result).toBe(247); // 500 - 200 - 50 - 3
    });

    it('should handle zero amounts', () => {
      const purse = { gp: 3, sp: 2, cp: 1 };
      const result = remainingMoneyInCopper(purse, {});

      expect(result).toBe(321);
    });

    it('should handle empty purse', () => {
      const purse = { gp: 0, sp: 0, cp: 0 };
      const amount = { gp: 1, sp: 2, cp: 3 };
      const result = remainingMoneyInCopper(purse, amount);

      expect(result).toBe(123);
    });

    it('should allow negative final totals (debt)', () => {
      const purse = { gp: 1, sp: 0, cp: 0 };
      const amount = { gp: -2, sp: 0, cp: 0 };
      const result = remainingMoneyInCopper(purse, amount);

      expect(result).toBe(-100);
    });

    it('should handle missing denomination fields', () => {
      const purse = { gp: 5, sp: 0, cp: 0 };
      const amount = { sp: 10 };
      const result = remainingMoneyInCopper(purse, amount);

      expect(result).toBe(600); // 500 + 100
    });
  });

  describe('updatePurse', () => {
    it('should add coins and consolidate to optimal denominations', () => {
      const purse = { gp: 0, sp: 5, cp: 5 };
      const amount = { sp: 5, cp: 5 };
      const result = updatePurse(purse, amount);

      expect(result).toEqual({ gp: 1, sp: 1, cp: 0 }); // 110 copper = 1gp + 1sp
    });

    it('should remove coins and consolidate remaining', () => {
      const purse = { gp: 2, sp: 0, cp: 0 };
      const amount = { gp: 0, sp: -5, cp: 0 };
      const result = updatePurse(purse, amount);

      expect(result).toEqual({ gp: 1, sp: 5, cp: 0 }); // 200 - 50 = 150 copper
    });

    it('should handle complex subtraction resulting in negative balance', () => {
      const purse = { gp: 3, sp: 4, cp: 7 };
      const amount = { gp: -3, sp: -9, cp: 4 };
      const result = updatePurse(purse, amount);

      expect(result).toEqual({ gp: 0, sp: -3, cp: -9 });
    });

    it('should consolidate copper into silver and gold', () => {
      const purse = { gp: 0, sp: 0, cp: 250 };
      const amount = {};
      const result = updatePurse(purse, amount);

      expect(result).toEqual({ gp: 2, sp: 5, cp: 0 });
    });

    it('should handle complete consolidation to gold', () => {
      const purse = { gp: 0, sp: 10, cp: 0 };
      const amount = {};
      const result = updatePurse(purse, amount);

      expect(result).toEqual({ gp: 1, sp: 0, cp: 0 });
    });

    it('should handle negative total and consolidate correctly', () => {
      const purse = { gp: 1, sp: 0, cp: 0 };
      const amount = { gp: -2, sp: 0, cp: 0 };
      const result = updatePurse(purse, amount);

      expect(result).toEqual({ gp: -1, sp: 0, cp: 0 });
    });

    it('should handle adding large amounts', () => {
      const purse = { gp: 5, sp: 5, cp: 5 };
      const amount = { gp: 10, sp: 3, cp: 7 };
      const result = updatePurse(purse, amount);

      expect(result).toEqual({ gp: 15, sp: 9, cp: 2 }); // 1592 copper
    });

    it('should handle empty purse with default values', () => {
      const result = updatePurse(undefined, { gp: 1, sp: 2, cp: 3 });

      expect(result).toEqual({ gp: 1, sp: 2, cp: 3 });
    });

    it('should minimize coins when consolidating (prefer gold over silver over copper)', () => {
      const purse = { gp: 0, sp: 0, cp: 999 };
      const amount = { cp: 1 };
      const result = updatePurse(purse, amount);

      expect(result).toEqual({ gp: 10, sp: 0, cp: 0 }); // 1000 copper = 10 gold
    });

    it('should handle partial silver when cannot make full gold', () => {
      const purse = { gp: 0, sp: 0, cp: 155 };
      const amount = {};
      const result = updatePurse(purse, amount);

      expect(result).toEqual({ gp: 1, sp: 5, cp: 5 });
    });
  });

  describe('sellItem', () => {
    it('should sell equipment at half cost', () => {
      const purse = { gp: 10, sp: 0, cp: 0 };
      const itemCost = { gp: 50, sp: 0, cp: 0 };
      const result = sellItem(purse, itemCost, 'equipment');

      expect(result).toEqual({ gp: 35, sp: 0, cp: 0 }); // 10 + (50 / 2)
    });

    it('should sell trade goods at full value', () => {
      const purse = { gp: 5, sp: 0, cp: 0 };
      const itemCost = { gp: 10, sp: 0, cp: 0 };
      const result = sellItem(purse, itemCost, 'trade-goods');

      expect(result).toEqual({ gp: 15, sp: 0, cp: 0 });
    });

    it('should sell gems at full value', () => {
      const purse = { gp: 20, sp: 0, cp: 0 };
      const itemCost = { gp: 100, sp: 0, cp: 0 };
      const result = sellItem(purse, itemCost, 'gem');

      expect(result).toEqual({ gp: 120, sp: 0, cp: 0 });
    });

    it('should sell art objects at full value', () => {
      const purse = { gp: 50, sp: 0, cp: 0 };
      const itemCost = { gp: 25, sp: 0, cp: 0 };
      const result = sellItem(purse, itemCost, 'art-object');

      expect(result).toEqual({ gp: 75, sp: 0, cp: 0 });
    });

    it('should sell magic items at full value', () => {
      const purse = { gp: 100, sp: 0, cp: 0 };
      const itemCost = { gp: 500, sp: 0, cp: 0 };
      const result = sellItem(purse, itemCost, 'magic-item');

      expect(result).toEqual({ gp: 600, sp: 0, cp: 0 });
    });

    it('should handle equipment with odd copper values (round down)', () => {
      const purse = { gp: 0, sp: 0, cp: 0 };
      const itemCost = { sp: 0, cp: 15 };
      const result = sellItem(purse, itemCost, 'equipment');

      expect(result).toEqual({ gp: 0, sp: 0, cp: 7 }); // 15 / 2 = 7.5, floored to 7
    });

    it('should consolidate proceeds into optimal denominations', () => {
      const purse = { gp: 1, sp: 0, cp: 50 };
      const itemCost = { sp: 10, cp: 0 };
      const result = sellItem(purse, itemCost, 'equipment');

      expect(result).toEqual({ gp: 2, sp: 0, cp: 0 }); // 150 + 50 = 200 copper
    });

    it('should handle empty purse with default values', () => {
      const itemCost = { gp: 10, sp: 0, cp: 0 };
      const result = sellItem(undefined, itemCost, 'equipment');

      expect(result).toEqual({ gp: 5, sp: 0, cp: 0 });
    });

    it('should handle mixed denomination item costs for equipment', () => {
      const purse = { gp: 5, sp: 5, cp: 5 };
      const itemCost = { gp: 2, sp: 3, cp: 7 };
      const result = sellItem(purse, itemCost, 'equipment');

      // Item: 237 copper, half = 118 copper
      // Purse: 555 copper
      // Total: 673 copper = 6gp 7sp 3cp
      expect(result).toEqual({ gp: 6, sp: 7, cp: 3 });
    });

    it('should handle mixed denomination item costs for trade goods', () => {
      const purse = { gp: 1, sp: 2, cp: 3 };
      const itemCost = { gp: 0, sp: 5, cp: 7 };
      const result = sellItem(purse, itemCost, 'trade-goods');

      // Item: 57 copper (full value)
      // Purse: 123 copper
      // Total: 180 copper = 1gp 8sp 0cp
      expect(result).toEqual({ gp: 1, sp: 8, cp: 0 });
    });
  });

  describe('buyItem', () => {
    it('should buy an item and deduct the cost', () => {
      const purse = { gp: 10, sp: 0, cp: 0 };
      const itemCost = { gp: 5, sp: 0, cp: 0 };
      const result = buyItem(purse, itemCost);

      expect(result).toEqual({ gp: 5, sp: 0, cp: 0 });
    });

    it('should throw error when insufficient funds', () => {
      const purse = { gp: 2, sp: 0, cp: 0 };
      const itemCost = { gp: 5, sp: 0, cp: 0 };

      expect(() => buyItem(purse, itemCost)).toThrow('Insufficient funds');
    });

    it('should handle mixed denomination purchases', () => {
      const purse = { gp: 3, sp: 5, cp: 8 };
      const itemCost = { gp: 1, sp: 2, cp: 3 };
      const result = buyItem(purse, itemCost);

      // Purse: 358 copper, Cost: 123 copper
      // Remaining: 235 copper = 2gp 3sp 5cp
      expect(result).toEqual({ gp: 2, sp: 3, cp: 5 });
    });

    it('should allow purchase when exact amount', () => {
      const purse = { gp: 5, sp: 0, cp: 0 };
      const itemCost = { gp: 5, sp: 0, cp: 0 };
      const result = buyItem(purse, itemCost);

      expect(result).toEqual({ gp: 0, sp: 0, cp: 0 });
    });

    it('should throw error when one copper short', () => {
      const purse = { gp: 1, sp: 0, cp: 9 };
      const itemCost = { gp: 1, sp: 1, cp: 0 };

      // Purse: 109 copper, Cost: 110 copper
      expect(() => buyItem(purse, itemCost)).toThrow('Insufficient funds');
    });

    it('should handle empty purse with default values', () => {
      const itemCost = { sp: 1, cp: 0 };

      expect(() => buyItem(undefined, itemCost)).toThrow('Insufficient funds');
    });

    it('should consolidate remaining coins after purchase', () => {
      const purse = { gp: 0, sp: 0, cp: 250 };
      const itemCost = { sp: 5, cp: 0 };
      const result = buyItem(purse, itemCost);

      // Purse: 250 copper, Cost: 50 copper
      // Remaining: 200 copper = 2gp
      expect(result).toEqual({ gp: 2, sp: 0, cp: 0 });
    });

    it('should handle complex purchase scenario', () => {
      const purse = { gp: 10, sp: 7, cp: 5 };
      const itemCost = { gp: 3, sp: 8, cp: 9 };
      const result = buyItem(purse, itemCost);

      // Purse: 1075 copper, Cost: 389 copper
      // Remaining: 686 copper = 6gp 8sp 6cp
      expect(result).toEqual({ gp: 6, sp: 8, cp: 6 });
    });
  });
});
