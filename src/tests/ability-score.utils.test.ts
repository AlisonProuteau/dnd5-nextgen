import { describe, expect, it } from 'vitest';
import { getAbilityPoints, getAbilityScoreModifier } from '@utils/character/character.utils';

describe('Ability Score Functions', () => {
  it('getAbilityScoreModifier', () => {
    expect(getAbilityScoreModifier(1)).toBe(-5);
    expect(getAbilityScoreModifier(0)).toBe(-5);

    expect(getAbilityScoreModifier(2)).toBe(-4);
    expect(getAbilityScoreModifier(3)).toBe(-4);

    expect(getAbilityScoreModifier(4)).toBe(-3);
    expect(getAbilityScoreModifier(5)).toBe(-3);

    expect(getAbilityScoreModifier(6)).toBe(-2);
    expect(getAbilityScoreModifier(7)).toBe(-2);

    expect(getAbilityScoreModifier(8)).toBe(-1);
    expect(getAbilityScoreModifier(9)).toBe(-1);

    expect(getAbilityScoreModifier(10)).toBe(0);
    expect(getAbilityScoreModifier(11)).toBe(0);

    expect(getAbilityScoreModifier(12)).toBe(1);
    expect(getAbilityScoreModifier(13)).toBe(1);

    expect(getAbilityScoreModifier(14)).toBe(2);
    expect(getAbilityScoreModifier(15)).toBe(2);

    expect(getAbilityScoreModifier(16)).toBe(3);
    expect(getAbilityScoreModifier(17)).toBe(3);

    expect(getAbilityScoreModifier(18)).toBe(4);
    expect(getAbilityScoreModifier(19)).toBe(4);

    expect(getAbilityScoreModifier(20)).toBe(5);
    expect(getAbilityScoreModifier(21)).toBe(5);

    expect(getAbilityScoreModifier(30)).toBe(10);
    expect(getAbilityScoreModifier(31)).toBe(10);
  });

  it('getAbilityPoints', () => {
    let scores = {} as Record<string, number>;

    scores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    expect(getAbilityPoints(scores)).toBe(0);

    scores = { str: 9, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    expect(getAbilityPoints(scores)).toBe(1);

    scores = { str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 };
    expect(getAbilityPoints(scores)).toBe(27);

    scores = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
    expect(getAbilityPoints(scores)).toBe(27);

    scores = { str: 7, dex: 7, con: 7 };
    expect(getAbilityPoints(scores)).toBe(0);
  });
});
