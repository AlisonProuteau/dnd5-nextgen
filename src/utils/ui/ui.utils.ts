import { FemaleIcon, MaleIcon, OtherIcon } from '@assets';
import type { MoneyUnitType } from '@representations/campaign/equipment.representation';
import { GenderIndexes } from 'src/components/CharacterCreation/CharacterDescription';

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
    case 'pp':
      return '#D3D9DE'; // Platinum (bright silvery-blue)
    case 'gp':
      return 'goldenrod'; //'#FFD700'; // Gold
    case 'ep':
      return '#B8A865'; // Electrum (pale gold-green)
    case 'sp':
      return '#91a1b2'; // Silver (medium gray)
    case 'cp':
      return '#B87333'; // Copper
    default:
      return 'white';
  }
};

export const getGenderIcon = (genderIndex: GenderIndexes) => {
  switch (genderIndex) {
    case GenderIndexes.female:
      return FemaleIcon;
    case GenderIndexes.male:
      return MaleIcon;
    default:
      return OtherIcon;
  }
};
