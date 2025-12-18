import { describe, expect, it } from 'vitest';
import {
  buyItem,
  remainingMoneyInCopper,
  sellItem,
  updatePurse
} from '@utils/character/character.utils';

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

  describe('Additional Currencies (pp, ep)', () => {
    describe('updatePurse with platinum', () => {
      it('should consolidate to platinum when additionalCurrencies includes pp', () => {
        const purse = { gp: 0, sp: 0, cp: 2500 };
        const result = updatePurse(purse, {}, ['pp']);

        expect(result).toEqual({ pp: 2, gp: 5, sp: 0, cp: 0 });
      });

      it('should handle platinum in input and consolidate properly', () => {
        const purse = { pp: 1, gp: 5, sp: 0, cp: 0 };
        const amount = { pp: 2, gp: 3, sp: 0, cp: 0 };
        const result = updatePurse(purse, amount, ['pp']);

        expect(result).toEqual({ pp: 3, gp: 8, sp: 0, cp: 0 });
      });

      it('should not include platinum when additionalCurrencies is empty', () => {
        const purse = { pp: 2, gp: 5, sp: 0, cp: 0 };
        const result = updatePurse(purse, {}, []);

        expect(result).toEqual({ gp: 25, sp: 0, cp: 0 });
      });

      it('should consolidate large amounts efficiently with platinum', () => {
        const purse = { gp: 0, sp: 0, cp: 10000 };
        const result = updatePurse(purse, {}, ['pp']);

        expect(result).toEqual({ pp: 10, gp: 0, sp: 0, cp: 0 });
      });
    });

    describe('updatePurse with electrum', () => {
      it('should consolidate to electrum when additionalCurrencies includes ep', () => {
        const purse = { gp: 0, sp: 0, cp: 250 };
        const result = updatePurse(purse, {}, ['ep']);

        expect(result).toEqual({ gp: 2, ep: 1, sp: 0, cp: 0 });
      });

      it('should handle mixed denominations with electrum', () => {
        const purse = { gp: 1, sp: 0, cp: 75 };
        const result = updatePurse(purse, {}, ['ep']);

        expect(result).toEqual({ gp: 1, ep: 1, sp: 2, cp: 5 });
      });

      it('should not include electrum when additionalCurrencies is empty', () => {
        const purse = { ep: 5, sp: 0, cp: 0 };
        const result = updatePurse(purse, {}, []);

        expect(result).toEqual({ gp: 2, sp: 5, cp: 0 });
      });
    });

    describe('updatePurse with both platinum and electrum', () => {
      it('should use both pp and ep when both are in additionalCurrencies', () => {
        const purse = { gp: 0, sp: 0, cp: 1575 };
        const result = updatePurse(purse, {}, ['pp', 'ep']);

        expect(result).toEqual({ pp: 1, gp: 5, ep: 1, sp: 2, cp: 5 });
      });

      it('should prioritize platinum over gold over electrum', () => {
        const purse = { gp: 0, sp: 0, cp: 5000 };
        const result = updatePurse(purse, {}, ['pp', 'ep']);

        expect(result).toEqual({ pp: 5, gp: 0, ep: 0, sp: 0, cp: 0 });
      });

      it('should handle complex consolidation with all currencies', () => {
        const purse = { pp: 1, gp: 7, ep: 3, sp: 8, cp: 9 };
        const result = updatePurse(purse, {}, ['pp', 'ep']);

        // 1000 + 700 + 150 + 80 + 9 = 1939 copper
        // = 1pp + 9gp + 3sp + 9cp (no room for ep since 39cp < 50cp)
        expect(result).toEqual({ pp: 1, gp: 9, ep: 0, sp: 3, cp: 9 });
      });

      it('should consolidate with platinum only (not electrum)', () => {
        const purse = { pp: 2, gp: 5, ep: 3, sp: 4, cp: 7 };
        const result = updatePurse(purse, {}, ['pp']);

        // 2000 + 500 + 150 + 40 + 7 = 2697 copper
        // With PP only: 2pp + 697cp = 2pp + 6gp + 97cp = 2pp + 6gp + 9sp + 7cp
        expect(result).toEqual({ pp: 2, gp: 6, sp: 9, cp: 7 });
      });

      it('should consolidate with electrum only (not platinum)', () => {
        const purse = { pp: 2, gp: 5, ep: 3, sp: 4, cp: 7 };
        const result = updatePurse(purse, {}, ['ep']);

        // 2000 + 500 + 150 + 40 + 7 = 2697 copper
        // With EP only: 26gp + 97cp = 26gp + 1ep + 47cp = 26gp + 1ep + 4sp + 7cp
        expect(result).toEqual({ gp: 26, ep: 1, sp: 4, cp: 7 });
      });

      it('should not create electrum when remainder after gold is less than 50cp', () => {
        const purse = { pp: 2, gp: 5, ep: 3, sp: 4, cp: 7 };
        const amount = { cp: 50 };
        const result = updatePurse(purse, amount, ['ep']);

        // 2697 + 50 = 2747 copper
        // With EP only: 27gp + 47cp (cannot make EP from 47cp) = 27gp + 0ep + 4sp + 7cp
        expect(result).toEqual({ gp: 27, ep: 0, sp: 4, cp: 7 });
      });

      it('should handle adding platinum directly then consolidating with copper', () => {
        const purse = { pp: 2, gp: 5, ep: 3, sp: 4, cp: 7 };
        const amount = { pp: 3, cp: 2303 };
        const result = updatePurse(purse, amount, ['pp', 'ep']);

        // 2697 + 3000 + 2303 = 8000 copper = 8pp
        expect(result).toEqual({ pp: 8, gp: 0, ep: 0, sp: 0, cp: 0 });
      });

      it('should handle mixed all 5 currencies consolidation', () => {
        const purse = { pp: 8, gp: 0, ep: 0, sp: 0, cp: 0 };
        const amount = { pp: 10, gp: 50, ep: 20, sp: 30, cp: 100 };
        const result = updatePurse(purse, amount, ['pp', 'ep']);

        // 8000 + 10000 + 5000 + 1000 + 300 + 100 = 24400 copper = 24pp + 4gp
        expect(result).toEqual({ pp: 24, gp: 4, ep: 0, sp: 0, cp: 0 });
      });
    });

    describe('sellItem with additional currencies', () => {
      it('should return platinum when selling expensive equipment', () => {
        const purse = { gp: 0, sp: 0, cp: 0 };
        const itemCost = { gp: 2500, sp: 0, cp: 0 };
        const result = sellItem(purse, itemCost, 'equipment', ['pp']);

        // 2500gp / 2 = 1250gp = 125000cp = 125pp
        expect(result).toEqual({ pp: 125, gp: 0, sp: 0, cp: 0 });
      });

      it('should use electrum for trade goods', () => {
        const purse = { gp: 0, sp: 0, cp: 0 };
        const itemCost = { gp: 2, sp: 5, cp: 0 };
        const result = sellItem(purse, itemCost, 'trade-goods', ['ep']);

        // 250 copper = 2gp + 1ep
        expect(result).toEqual({ gp: 2, ep: 1, sp: 0, cp: 0 });
      });

      it('should use both pp and ep when selling gems', () => {
        const purse = { gp: 0, sp: 0, cp: 0 };
        const itemCost = { gp: 1575, sp: 0, cp: 0 };
        const result = sellItem(purse, itemCost, 'gem', ['pp', 'ep']);

        // 157500 copper = 157pp + 500cp = 157pp + 5gp (no ep since 0 < 50)
        expect(result).toEqual({ pp: 157, gp: 5, ep: 0, sp: 0, cp: 0 });
      });

      it('should not use additional currencies when not specified', () => {
        const purse = { gp: 0, sp: 0, cp: 0 };
        const itemCost = { pp: 5, ep: 3, gp: 2, sp: 0, cp: 0 };
        const result = sellItem(purse, itemCost, 'equipment', []);

        // (5000 + 150 + 200) / 2 = 2675 copper = 26gp 7sp 5cp
        expect(result).toEqual({ gp: 26, sp: 7, cp: 5 });
      });
    });

    describe('buyItem with additional currencies', () => {
      it('should consolidate change with platinum', () => {
        const purse = { pp: 5, gp: 0, sp: 0, cp: 0 };
        const itemCost = { gp: 25, sp: 0, cp: 0 };
        const result = buyItem(purse, itemCost, ['pp']);

        // 5pp = 5000cp, 25gp = 2500cp
        // 5000 - 2500 = 2500cp = 2pp + 500cp = 2pp + 5gp
        expect(result).toEqual({ pp: 2, gp: 5, sp: 0, cp: 0 });
      });

      it('should handle purchases with electrum consolidation', () => {
        const purse = { gp: 10, sp: 0, cp: 0 };
        const itemCost = { gp: 3, sp: 2, cp: 5 };
        const result = buyItem(purse, itemCost, ['ep']);

        // 1000 - 325 = 675 copper = 6gp + 1ep + 2sp + 5cp
        expect(result).toEqual({ gp: 6, ep: 1, sp: 2, cp: 5 });
      });

      it('should use both pp and ep in consolidation', () => {
        const purse = { gp: 2000, sp: 0, cp: 0 };
        const itemCost = { gp: 325, sp: 7, cp: 8 };
        const result = buyItem(purse, itemCost, ['pp', 'ep']);

        // 2000gp = 200000cp, 325gp 7sp 8cp = 32578cp
        // 200000 - 32578 = 167422cp = 167pp + 422cp = 167pp + 4gp + 22cp = 167pp + 4gp + 2sp + 2cp
        expect(result).toEqual({ pp: 167, gp: 4, ep: 0, sp: 2, cp: 2 });
      });

      it('should not use additional currencies when not in array', () => {
        const purse = { pp: 1, ep: 2, gp: 5, sp: 0, cp: 0 };
        const itemCost = { gp: 3, sp: 0, cp: 0 };
        const result = buyItem(purse, itemCost, []);

        // 1000 + 100 + 500 - 300 = 1300 copper = 13gp
        expect(result).toEqual({ gp: 13, sp: 0, cp: 0 });
      });

      it('should throw error when insufficient funds even with pp and ep', () => {
        const purse = { pp: 1, ep: 1, gp: 0, sp: 0, cp: 0 };
        const itemCost = { pp: 2, gp: 0, sp: 0, cp: 0 };

        // 1000 + 50 = 1050 copper, need 2000 copper
        expect(() => buyItem(purse, itemCost, ['pp', 'ep'])).toThrow('Insufficient funds');
      });
    });

    describe('Edge cases with additional currencies', () => {
      it('should handle odd copper values with electrum', () => {
        const purse = { gp: 0, sp: 0, cp: 237 };
        const result = updatePurse(purse, {}, ['ep']);

        // 237 copper = 2gp + 0ep + 3sp + 7cp
        expect(result).toEqual({ gp: 2, ep: 0, sp: 3, cp: 7 });
      });

      it('should handle negative balances with platinum', () => {
        const purse = { gp: 5, sp: 0, cp: 0 };
        const amount = { pp: -1, gp: 0, sp: 0, cp: 0 };
        const result = updatePurse(purse, amount, ['pp']);

        // 500 - 1000 = -500 copper = -1gp (but let me check the actual consolidation)
        // With negative: -500cp should be 0pp + -5gp + 0sp + 0cp
        expect(result).toEqual({ pp: 0, gp: -5, sp: 0, cp: 0 });
      });

      it('should handle zero amounts with all currencies enabled', () => {
        const purse = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
        const result = updatePurse(purse, {}, ['pp', 'ep']);

        expect(result).toEqual({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
      });
    });
  });
});
