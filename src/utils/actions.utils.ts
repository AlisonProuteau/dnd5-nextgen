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

type HealthDataType = {
  current: number;
  temporary: number;
  deathSaves: {
    successes: number;
    failures: number;
    usedSaves: number;
  };
};
export const getResetHealthActionRecordData = (
  currentHealth: number,
  previousData: HealthDataType,
  pendingLogs: Omit<ActionRecord, 'id' | 'createdAt'>[]
): Pick<ActionRecord, 'name' | 'description'> | undefined => {
  const changes = [
    previousData.current !== currentHealth &&
      `Current HP: ${previousData.current} -> ${currentHealth}`,
    previousData.temporary !== 0 && `Temporary HP: ${previousData.temporary} -> 0`,
    previousData.deathSaves.successes !== 0 &&
      `Death Saves Successes: ${previousData.deathSaves.successes} -> 0`,
    previousData.deathSaves.failures !== 0 &&
      `Death Saves Failures: ${previousData.deathSaves.failures} -> 0`,
    previousData.deathSaves.usedSaves !== 0 && 'Reset Racial Ability uses'
  ].filter(Boolean) as string[];

  const healthLogs = pendingLogs
    .filter(({ type }) => type === 'health')
    .map(
      (log) =>
        `\t${log.name}: ${log.value} ${log.valueUnit}${log.description ? ` (${log.description})` : ''}`
    );

  return changes.length || healthLogs.length
    ? {
        name: 'Reset Health',
        description: changes
          .concat(changes.length && healthLogs.length ? [''] : [])
          .concat(healthLogs.length ? ['Pending Logs:', ...healthLogs] : [])
          .join('\n')
      }
    : undefined;
};

export const getSpellActionRecordData = (
  spell: Spell,
  slotLevel: number | 'ritual'
): Pick<ActionRecord, 'name' | 'description' | 'value' | 'valueUnit' | 'sourceIndex'> => {
  return slotLevel === 'ritual'
    ? { name: spell.name, sourceIndex: spell.index, description: 'Ritual Cast' }
    : {
        name: spell.name,
        sourceIndex: spell.index,
        description: slotLevel !== spell.level ? `Upcast from lvl${spell.level} spell` : undefined,
        value: slotLevel,
        valueUnit: 'slot lvl'
      };
};

export const formatActionRecord = (
  type: ActionRecordType,
  ressource: Pick<ActionRecord, 'name' | 'description' | 'value' | 'valueUnit' | 'sourceIndex'>,
  auto = true
): Omit<ActionRecord, 'id'> => {
  const createdAt = new Date();
  if (type === 'trait' || type === 'feature')
    return { auto, type, name: ressource.name, sourceIndex: ressource.sourceIndex, createdAt };
  if (type === 'custom') return { auto, type, createdAt, ...ressource };

  return { auto, type, createdAt, ...ressource };
};
