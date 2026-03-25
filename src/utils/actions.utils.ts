import { transform } from 'lodash';
import { Spell } from '@representations/abilities/magic.representation';
import { MoneyObjectType, MoneyUnitType } from '@representations/campaign/equipment.representation';
import { ActionRecord, ActionRecordType } from '@representations/user.representation';
import { CurrencyLabels } from './ui/ui.utils';

export const getHealthActionRecordData = (
  current: number,
  previous: number,
  overrideHitPoints = false,
  temporary = false
): Pick<ActionRecord, 'name' | 'description' | 'value' | 'valueUnit'> | undefined => {
  const delta = current - previous;
  if (!delta) return;

  if (temporary)
    return {
      name: delta > 0 ? 'Gained Temporary Health' : 'Lost Temporary Health',
      value: delta,
      valueUnit: 'THP'
    };

  const differenceLabel = overrideHitPoints
    ? 'Hit points updated'
    : delta > 0
      ? 'Healed'
      : 'Took Damage';
  return {
    name: differenceLabel,
    value: delta,
    valueUnit: 'HP',
    description: overrideHitPoints ? `Initial: ${previous}\nFinal: ${current}` : undefined
  };
};

const formatMoneyForDisplay = (
  changes: MoneyObjectType,
  showPlusSign = true
): string | undefined => {
  const parts = transform(
    changes,
    (result: string[], value, unit) => {
      if (value !== 0 && value !== undefined)
        result.push(
          `${value > 0 && showPlusSign ? '+' : ''}${value} ${CurrencyLabels[unit as MoneyUnitType]}`
        );
    },
    []
  ).join(', ');

  return parts.length > 0 ? parts : undefined;
};

export const getMoneyActionRecordData = (
  changes: Record<string, number>,
  currentAmount: Record<string, number>,
  previousAmount: Record<string, number>
): Pick<ActionRecord, 'name' | 'description'> | undefined => {
  const differenceLabel = formatMoneyForDisplay(changes);
  if (!differenceLabel) return undefined;

  return {
    name: differenceLabel,
    description: `Initial Amount: ${formatMoneyForDisplay(currentAmount, false)}\nFinal Amount: ${formatMoneyForDisplay(previousAmount, false)}`
  };
};

export const getDeathSavesActionRecordData = (
  current: number,
  previous: number,
  unit: 'success' | 'failure'
): Pick<ActionRecord, 'name' | 'value' | 'valueUnit'> | undefined => {
  const delta = current - previous;
  if (!delta) return;
  return {
    name: 'Death Save',
    value: delta,
    valueUnit: unit
  };
};

export const getSpellActionRecordData = (
  spell: Spell,
  slotLevel: number | 'ritual'
): Pick<ActionRecord, 'name' | 'description' | 'value' | 'valueUnit'> => {
  return slotLevel === 'ritual'
    ? { name: spell.name, description: 'Ritual Cast' }
    : {
        name: spell.name,
        description: slotLevel !== spell.level ? `Upcast from lvl${spell.level} spell` : undefined,
        value: slotLevel,
        valueUnit: 'slot lvl'
      };
};

export const formatActionRecord = (
  type: ActionRecordType,
  ressource: Pick<ActionRecord, 'name' | 'description' | 'value' | 'valueUnit'>,
  auto = true
): Omit<ActionRecord, 'id'> => {
  const createdAt = new Date();
  if (type === 'trait' || type === 'feature')
    return { auto, type, name: ressource.name, createdAt };
  if (type === 'custom') return { auto, type, createdAt, ...ressource };

  return { auto, type, createdAt, ...ressource };
};
