import { describe, expect, it } from 'vitest';
import {
  formatUsageLabel,
  getRelatedFeatures,
  getUsageTimes,
  getUsageType,
  getUsageTypeLabel
} from '@utils/character/character.utils';
import type { Feature } from '@representations/abilities/feature.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { Character } from '@representations/user.representation';

describe('Resource Usage Functions', () => {
  const mockCharacter = {
    level: 5,
    abilityScores: {
      str: { index: 'str', name: 'STR', full_name: 'Strength', score: 16, modifier: 3 },
      dex: { index: 'dex', name: 'DEX', full_name: 'Dexterity', score: 14, modifier: 2 },
      con: { index: 'con', name: 'CON', full_name: 'Constitution', score: 12, modifier: 1 },
      int: { index: 'int', name: 'INT', full_name: 'Intelligence', score: 10, modifier: 0 },
      wis: { index: 'wis', name: 'WIS', full_name: 'Wisdom', score: 8, modifier: -1 },
      cha: { index: 'cha', name: 'CHA', full_name: 'Charisma', score: 6, modifier: -2 }
    },
    resourceUsages: {} as Character['resourceUsages']
  };

  describe('getUsageTimes', () => {
    it('number (fixed)', () => {
      // TEST: should return the exact fixed number
      expect(getUsageTimes({ type: 'long_rest', times: 3 }, mockCharacter)).toBe(3);

      // TEST: should return 1 when times is 1
      expect(getUsageTimes({ type: 'short_rest', times: 1 }, mockCharacter)).toBe(1);

      // TEST: should return 0 when times is 0
      expect(getUsageTimes({ type: 'per_day', times: 0 }, mockCharacter)).toBe(0);

      // TEST: should return large fixed numbers unchanged
      expect(getUsageTimes({ type: 'per_day', times: 100 }, mockCharacter)).toBe(100);
    });

    it('ability name (modifier)', () => {
      // TEST: times: "str" → str modifier (3)
      expect(getUsageTimes({ type: 'long_rest', times: 'str' }, mockCharacter)).toBe(3);

      // TEST: times: "dex" → dex modifier (2)
      expect(getUsageTimes({ type: 'long_rest', times: 'dex' }, mockCharacter)).toBe(2);

      // TEST: times: "con" → con modifier (1)
      expect(getUsageTimes({ type: 'long_rest', times: 'con' }, mockCharacter)).toBe(1);

      // TEST: times: "int" → int modifier (0) → clamped to 1
      expect(getUsageTimes({ type: 'long_rest', times: 'int' }, mockCharacter)).toBe(1);

      // TEST: times: "wis" → wis modifier (-1) → clamped to 1
      expect(getUsageTimes({ type: 'long_rest', times: 'wis' }, mockCharacter)).toBe(1);

      // TEST: times: "cha" → cha modifier (-2) → clamped to 1
      expect(getUsageTimes({ type: 'long_rest', times: 'cha' }, mockCharacter)).toBe(1);
    });

    describe('ability expression (str+n, dex-n, …)', () => {
      it('addition (+)', () => {
        // TEST: times: "str+2" → 3 + 2 = 5
        expect(getUsageTimes({ type: 'long_rest', times: 'str+2' }, mockCharacter)).toBe(5);

        // TEST: times: "dex+1" → 2 + 1 = 3
        expect(getUsageTimes({ type: 'long_rest', times: 'dex+1' }, mockCharacter)).toBe(3);

        // TEST: times: "int+1" → 0 + 1 = 1 (at minimum boundary)
        expect(getUsageTimes({ type: 'long_rest', times: 'int+1' }, mockCharacter)).toBe(1);

        // TEST: times: "cha+1" → -2 + 1 = -1 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'cha+1' }, mockCharacter)).toBe(1);

        // TEST: times: "wis+3" → -1 + 3 = 2
        expect(getUsageTimes({ type: 'long_rest', times: 'wis+3' }, mockCharacter)).toBe(2);
      });

      it('subtraction (-)', () => {
        // TEST: times: "str-1" → 3 - 1 = 2
        expect(getUsageTimes({ type: 'long_rest', times: 'str-1' }, mockCharacter)).toBe(2);

        // TEST: times: "dex-1" → 2 - 1 = 1
        expect(getUsageTimes({ type: 'long_rest', times: 'dex-1' }, mockCharacter)).toBe(1);

        // TEST: times: "con-2" → 1 - 2 = -1 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'con-2' }, mockCharacter)).toBe(1);

        // TEST: times: "int-1" → 0 - 1 = -1 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'int-1' }, mockCharacter)).toBe(1);
      });

      it('multiplication (*)', () => {
        // TEST: times: "str*2" → 3 * 2 = 6
        expect(getUsageTimes({ type: 'long_rest', times: 'str*2' }, mockCharacter)).toBe(6);

        // TEST: times: "con*3" → 1 * 3 = 3
        expect(getUsageTimes({ type: 'long_rest', times: 'con*3' }, mockCharacter)).toBe(3);

        // TEST: times: "wis*2" → -1 * 2 = -2 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'wis*2' }, mockCharacter)).toBe(1);

        // TEST: times: "int*5" → 0 * 5 = 0 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'int*5' }, mockCharacter)).toBe(1);
      });

      it('division (/)', () => {
        // TEST: times: "str/2" → floor(3 / 2) = 1
        expect(getUsageTimes({ type: 'long_rest', times: 'str/2' }, mockCharacter)).toBe(1);

        // TEST: times: "str/1" → floor(3 / 1) = 3
        expect(getUsageTimes({ type: 'long_rest', times: 'str/1' }, mockCharacter)).toBe(3);

        // TEST: times: "dex/2" → floor(2 / 2) = 1
        expect(getUsageTimes({ type: 'long_rest', times: 'dex/2' }, mockCharacter)).toBe(1);

        // TEST: times: "int/2" → floor(0 / 2) = 0 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'int/2' }, mockCharacter)).toBe(1);

        // TEST: times: "cha/2" → floor(-2 / 2) = -1 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'cha/2' }, mockCharacter)).toBe(1);

        // TEST: times: "cha/0" → floor(-2 / 1) = -2 → clamped to 1, does not throw
        expect(() =>
          getUsageTimes({ type: 'long_rest', times: 'cha/0' }, mockCharacter)
        ).not.toThrow();
        expect(getUsageTimes({ type: 'long_rest', times: 'cha/0' }, mockCharacter)).toBe(1);
      });
    });

    it('"level" (returns character level)', () => {
      // TEST: times: "level" → character.level (5)
      expect(getUsageTimes({ type: 'per_day', times: 'level' }, mockCharacter)).toBe(5);

      // TEST: times: "level" when level is undefined → returns 1
      const lvl10Char = { ...mockCharacter, level: undefined } as unknown as Character;
      expect(getUsageTimes({ type: 'per_day', times: 'level' }, lvl10Char)).toBe(1);
    });

    it('level expression (level+n, level-n, …)', () => {
      // TEST: times: "level+2" → 5 + 2 = 7
      expect(getUsageTimes({ type: 'long_rest', times: 'level+2' }, mockCharacter)).toBe(7);

      // TEST: times: "level-2" → 5 - 2 = 3
      expect(getUsageTimes({ type: 'long_rest', times: 'level-2' }, mockCharacter)).toBe(3);

      // TEST: times: "level-4" → 5 - 4 = 1 (minimum boundary)
      expect(getUsageTimes({ type: 'long_rest', times: 'level-4' }, mockCharacter)).toBe(1);

      // TEST: times: "level-10" → 5 - 10 = -5 → clamped to 1
      expect(getUsageTimes({ type: 'long_rest', times: 'level-10' }, mockCharacter)).toBe(1);

      // TEST: times: "level*2" → 5 * 2 = 10
      expect(getUsageTimes({ type: 'long_rest', times: 'level*2' }, mockCharacter)).toBe(10);

      // TEST: times: "level/2" → floor(5 / 2) = 2
      expect(getUsageTimes({ type: 'long_rest', times: 'level/2' }, mockCharacter)).toBe(2);

      // TEST: times: "level/3" with level undefined → floor(1 / 3) = 1
      expect(
        getUsageTimes(
          { type: 'long_rest', times: 'level/3' },
          { ...mockCharacter, level: undefined }
        )
      ).toBe(1);
    });

    it('"unlimited" (returns Infinity)', () => {
      expect(getUsageTimes({ type: 'per_day', times: 'unlimited' }, mockCharacter)).toBe(Infinity);
    });

    it('object { [level]: number }', () => {
      // TEST: returns the value for the exact matching level threshold
      // level 5 matches key "5"
      expect(getUsageTimes({ type: 'long_rest', times: { 1: 2, 3: 3, 5: 4 } }, mockCharacter)).toBe(
        4
      );

      // TEST: returns the highest threshold at or below character level
      // level 5: thresholds 1, 3, 7 → highest at-or-below is 3 (times: 3)
      expect(getUsageTimes({ type: 'long_rest', times: { 1: 2, 3: 3, 7: 5 } }, mockCharacter)).toBe(
        3
      );

      // TEST: returns the only matching threshold when just one entry qualifies
      // level 5 >= 1 only
      expect(getUsageTimes({ type: 'long_rest', times: { 1: 2 } }, mockCharacter)).toBe(2);

      // TEST: works correctly at character level 1 with multiple thresholds
      expect(
        getUsageTimes(
          { type: 'long_rest', times: { 1: 2, 5: 4, 10: 6 } },
          { ...mockCharacter, level: 1 }
        )
      ).toBe(2);

      // TEST: works correctly at high character level
      expect(
        getUsageTimes(
          { type: 'long_rest', times: { 1: 2, 5: 4, 11: 5, 17: 6 } },
          { ...mockCharacter, level: 20 }
        )
      ).toBe(6);

      // TEST: returns 0 when character level is below all thresholds
      expect(
        getUsageTimes(
          { type: 'long_rest', times: { 3: 2, 5: 4, 10: 6 } },
          { ...mockCharacter, level: 1 }
        )
      ).toBe(0);

      // TEST: returns level 1 threshold when character level is undefined
      expect(
        getUsageTimes(
          { type: 'long_rest', times: { 1: 2, 5: 4, 10: 6 } },
          { ...mockCharacter, level: undefined }
        )
      ).toBe(2);
    });
  });

  describe('getUsageType', () => {
    const baseFeature: Partial<Feature> = {
      name: 'Feature',
      desc: [],
      level: 1,
      class: { index: 'test', name: 'Test' }
    };

    it('literal type (string or array)', () => {
      // TEST: returns the literal type string
      expect(getUsageType({ type: 'long_rest', times: 1 }, [])).toBe('long_rest');

      // TEST: returns the literal type array
      expect(getUsageType({ type: ['short_rest', 'long_rest'], times: 1 }, [])).toEqual([
        'short_rest',
        'long_rest'
      ]);
    });

    it('feature-linked type', () => {
      const channelDivinityFeature = {
        ...baseFeature,
        index: 'channel-divinity',
        name: 'Channel Divinity'
      } as Feature;

      // TEST: resolves feature-linked type from the features array
      expect(
        getUsageType({ type: { feature: 'channel-divinity', default: 'long_rest' }, times: 1 }, [
          { ...channelDivinityFeature, usage: { type: 'short_rest', times: 1 } }
        ])
      ).toBe('short_rest');

      // TEST: falls back to default when the referenced feature is not found
      expect(
        getUsageType({ type: { feature: 'missing-feature', default: 'long_rest' }, times: 1 }, [])
      ).toBe('long_rest');

      // TEST: falls back to default when the found feature has no usage
      expect(
        getUsageType({ type: { feature: 'channel-divinity', default: 'per_day' }, times: 1 }, [
          channelDivinityFeature
        ])
      ).toBe('per_day');
    });

    it('chained feature-linked type', () => {
      const featureA = {
        ...baseFeature,
        index: 'feature-a',
        usage: { type: { feature: 'feature-b', default: 'long_rest' }, times: 1 }
      } as Feature;
      const featureB = {
        ...baseFeature,
        index: 'feature-b',
        usage: { type: 'short_rest', times: 1 }
      } as Feature;

      // TEST: resolves a chain A → B → short_rest
      expect(
        getUsageType({ type: { feature: 'feature-a', default: 'long_rest' }, times: 1 }, [
          featureA,
          featureB
        ])
      ).toBe('short_rest');

      // TEST: resolves a deeper chain A → B → C → per_day
      const featureC = {
        ...baseFeature,
        index: 'feature-c',
        usage: { type: 'per_day', times: 1 }
      } as Feature;
      const featureBLinked = {
        ...featureB,
        usage: { type: { feature: 'feature-c', default: 'long_rest' }, times: 1 }
      } as Feature;
      expect(
        getUsageType({ type: { feature: 'feature-a', default: 'long_rest' }, times: 1 }, [
          featureA,
          featureBLinked,
          featureC
        ])
      ).toBe('per_day');
    });

    it('cycle detection', () => {
      const featureA = {
        ...baseFeature,
        index: 'feature-a',
        usage: { type: { feature: 'feature-b', default: 'long_rest' }, times: 1 }
      } as Feature;
      const featureB = {
        ...baseFeature,
        index: 'feature-b',
        usage: { type: { feature: 'feature-a', default: 'per_day' }, times: 1 }
      } as Feature;

      // TEST: A → B → A cycle should not hang and should fall back to B's default
      expect(
        getUsageType({ type: { feature: 'feature-a', default: 'short_rest' }, times: 1 }, [
          featureA,
          featureB
        ])
      ).toBe('per_day');
    });
  });

  describe('getRelatedFeatures', () => {
    const simpleFeature: Feature = {
      index: 'simple-feature',
      name: 'Simple Feature',
      desc: [],
      level: 1,
      class: { index: 'fighter', name: 'Fighter' }
    };

    it('returns linked feature indices', () => {
      const channelDivinityFeature = {
        ...simpleFeature,
        index: 'feature-1',
        usage: { type: { feature: 'channel-divinity' }, times: 1 }
      } as Feature;
      const wildShapeFeature = {
        ...simpleFeature,
        index: 'feature-2',
        level: 2,
        usage: { type: { feature: 'wild-shape' }, times: 2 }
      } as Feature;

      // TEST: returns feature index from object-type usage
      expect(getRelatedFeatures([channelDivinityFeature])).toEqual(['channel-divinity']);

      // TEST: returns all related feature indices from multiple resources
      expect(getRelatedFeatures([channelDivinityFeature, wildShapeFeature])).toEqual([
        'channel-divinity',
        'wild-shape'
      ]);

      // TEST: returns all related feature indices from multiple resources
      expect(
        getRelatedFeatures([
          channelDivinityFeature,
          { ...wildShapeFeature, usage: { type: 'long_rest', times: 2 } }
        ])
      ).toEqual(['channel-divinity']);

      // TEST: handles Trait resources alongside Feature resources
      const trait: Trait = {
        index: 'trait-with-link',
        name: 'Trait',
        desc: [],
        usage: { type: { feature: 'rage', default: 'long_rest' }, times: 1 }
      };
      expect(getRelatedFeatures([trait])).toEqual(['rage']);
    });

    it('returns empty array', () => {
      // TEST: empty resources list
      expect(getRelatedFeatures([])).toEqual([]);

      // TEST: simple string types
      expect(
        getRelatedFeatures([{ ...simpleFeature, usage: { type: 'long_rest', times: 1 } }])
      ).toEqual([]);

      // TEST: no usage
      expect(getRelatedFeatures([simpleFeature])).toEqual([]);
    });
  });

  describe('getUsageTypeLabel', () => {
    it('string input', () => {
      expect(getUsageTypeLabel('long_rest')).toBe('Long Rest');
      expect(getUsageTypeLabel('short_rest')).toBe('Short Rest');
      expect(getUsageTypeLabel('per_rest')).toBe('Short or Long Rest');
      expect(getUsageTypeLabel('per_day')).toBe('Day');
      expect(getUsageTypeLabel('per_month')).toBe('Month');
      expect(getUsageTypeLabel('per_week')).toBe('Week');
      expect(getUsageTypeLabel('unknown' as 'per_day')).toBeUndefined();
    });

    it('array input', () => {
      // TEST: joins labels with " / " for multiple types
      expect(getUsageTypeLabel(['short_rest', 'long_rest'])).toBe('Short Rest / Long Rest');

      // TEST: handles a single-element array
      expect(getUsageTypeLabel(['per_day'])).toBe('Day');
    });
  });

  describe('formatUsageLabel', () => {
    it('usage count display', () => {
      // TEST: shows 0/max when no current usage is recorded
      expect(formatUsageLabel('rage', { type: 'long_rest', times: 3 }, mockCharacter, [])).toBe(
        '0/3 (Long Rest)'
      );

      // TEST: shows current/max when current usage is recorded
      const characterWithUsage = {
        ...mockCharacter,
        resourceUsages: { rage: { current: 2, max: 3 } } as unknown as Character['resourceUsages']
      };
      expect(
        formatUsageLabel('rage', { type: 'long_rest', times: 3 }, characterWithUsage, [])
      ).toBe('2/3 (Long Rest)');
    });

    it('resolves usage type', () => {
      // TEST: resolves feature-linked usage type
      const channelDivinityFeature = {
        index: 'channel-divinity',
        name: 'Channel Divinity',
        desc: [],
        level: 2,
        class: { index: 'cleric', name: 'Cleric' },
        usage: { type: 'short_rest' as const, times: 1 }
      } as Feature;
      expect(
        formatUsageLabel(
          'channel-divinity-usage',
          { type: { feature: 'channel-divinity', default: 'long_rest' }, times: 1 },
          mockCharacter,
          [channelDivinityFeature]
        )
      ).toBe('0/1 (Short Rest)');

      // TEST: uses ability modifier as max when times is an ability name (str modifier = 3)
      expect(formatUsageLabel('ki', { type: 'short_rest', times: 'str' }, mockCharacter, [])).toBe(
        '0/3 (Short Rest)'
      );
    });
  });
});
