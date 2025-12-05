import type { MoneyUnitType } from '@representations/campaign/equipment.representation';

/**
 * Scroll behavior utility for UI interactions
 */
export const scrollOnOpen = (
  { currentTarget }: { currentTarget: EventTarget & Element },
  expanded: boolean
): void => {
  expanded && setTimeout(() => currentTarget.scrollIntoView({ behavior: 'smooth' }), 100);
};

export const getCoinColor = (type: MoneyUnitType) => {
  switch (type) {
    case 'gp':
      return 'goldenrod';
    case 'sp':
      return 'silver';
    case 'cp':
      return '#B87333';
    default:
      return 'white';
  }
};
