import { transform } from 'lodash';
import { Spell } from '@representations/abilities/magic.representation';
import { MoneyObjectType, MoneyUnitType } from '@representations/campaign/equipment.representation';
import { ActionRecord, ActionRecordType, Character } from '@representations/user.representation';
import { DefaultRepresentation } from 'src/representations/common.representation';
import { CurrencyLabels } from './ui/ui.utils';

export const formatHealthRecord = (
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

export const formatMoneyRecord = (
  changes: Record<string, number>,
  currentAmount: Record<string, number>,
  previousAmount: Record<string, number>
): Pick<ActionRecord, 'name' | 'description'> | undefined => {
  const differenceLabel = formatMoneyForDisplay(changes);
  if (!differenceLabel) return undefined;

  return {
    name: differenceLabel,
    description: `Initial Amount: ${formatMoneyForDisplay(currentAmount, false) ?? '0'}\nFinal Amount: ${formatMoneyForDisplay(previousAmount, false) ?? '0'}`
  };
};

export const formatDeathSavesRecord = (
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
export const formatResetHealthRecord = (
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

export const formatSpellRecord = (
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

export const formatRestoreSpellSlotsRecord = (
  recovery: Record<string, number>
): Pick<ActionRecord, 'name' | 'description'> => {
  return {
    name: 'Spell Slots Restored',
    description: Object.entries(recovery)
      .filter(([, amount]) => amount > 0)
      .map(([level, total]) => `Level ${level}: ${total} slot${total > 1 ? 's' : ''}`)
      .join('\n')
  };
};

export const formatConditionRecord = (
  current: Character['conditions'],
  selected: (DefaultRepresentation & { level?: number })[],
  pendingRemovals: DefaultRepresentation[]
): Pick<ActionRecord, 'name' | 'description'> => {
  const removed = pendingRemovals.map(({ name }) => name);
  let added: string[] = [];
  let updated: string[] = [];
  selected.forEach(({ index, name, level }) => {
    const existing = current?.find(({ index: idx }) => idx === index);
    if (!existing) added.push(`${name}${level ? ` (lvl ${level})` : ''}`);
    else if (existing.level !== level && !pendingRemovals.some(({ index: i }) => i === index))
      updated.push(`${name} (lvl ${existing.level ?? 1} → lvl ${level ?? 1})`);
  });

  return {
    name: 'Conditions Updated',
    description: [
      added.length && `Added: ${added.join(', ')}`,
      removed.length && `Removed: ${removed.join(', ')}`,
      updated.length && `Updated: ${updated.join(', ')}`
    ]
      .filter(Boolean)
      .join('\n')
  };
};

export const formatActionRecord = (
  type: ActionRecordType,
  ressource: Omit<ActionRecord, 'id' | 'type' | 'createdAt'>,
  auto = true
): Omit<ActionRecord, 'id'> => {
  const createdAt = new Date();
  if (type === 'trait' || type === 'feature')
    return { auto, type, name: ressource.name, sourceIndex: ressource.sourceIndex, createdAt };
  if (type === 'custom') return { auto, type, createdAt, ...ressource };

  return { auto, type, createdAt, ...ressource };
};
