import type { Feature } from '../representations/abilities/feature.representation';
import type { Spell } from '../representations/abilities/magic.representation';
import type { Proficiency } from '../representations/campaign/adventure.representation';
import type { Classes } from '../representations/character/class.representation';
import type { Race } from '../representations/character/race.representation';
import type { DefaultRepresentation } from '../representations/common.representation';
import { subraces } from './characters';
import { get, getAll } from './utils';

export async function getAllRaces(): Promise<{
  count: number;
  results: DefaultRepresentation[];
}> {
  return get('All Races', '/races', 'all');
}

export async function getRaceInfo(raceIndex: string): Promise<Race> {
  // TODO: Add Subraces?
  return get('Race info', '/races', raceIndex).then((raceData: Race) => {
    raceData.subraces =
      subraces.find(({ index }) => index === raceIndex)?.data || raceData.subraces;
    return raceData;
  });
}

export async function getAllClasses(): Promise<{
  count: number;
  results: DefaultRepresentation[];
}> {
  return get('All Classes', '/classes', 'all');
}

export async function getClassInfo(classIndex: string, level?: number): Promise<Classes> {
  return level
    ? get('Class Level Ressources', `/classes/${classIndex}/levels`, `${classIndex}-${level}`)
    : get('Class Ressources', '/classes', classIndex);

  // TODO: Add Subclasses?
  // if (subclassIndex) {
  //   res.subclasses = [
  //     await (level
  //       ? get(
  //           'Class Level Ressources',
  //           `/classes/${classIndex}/subclasses/${subclassIndex}/levels`,
  //           `${subclassIndex}-${level}`
  //         )
  //       : get('Class Ressources', `/classes/${classIndex}/subclasses`, subclassIndex))
  //   ] as Subclass[];
  // }
}

export async function getSpellsForClass(
  classIndex: string,
  level?: number
): Promise<{ count: number; results: Spell[] }> {
  // TODO: Add subclass?
  // FIX: Fix spells list
  return level
    ? get('Classes Spells', `/classes/${classIndex}/levels/${classIndex}-${level}`, 'spells')
    : get('Classes Spells', `/classes/${classIndex}`, 'spells');
}

export async function getFeaturesForClass(
  classIndex: string,
  level: number = 1
): Promise<{ count: number; results: Feature[] }> {
  // TODO: Add subclass?
  // FIX: Fix features list
  return get(
    'Classes features',
    `/classes/${classIndex}/levels/${classIndex}-${level}`,
    'features'
  );
}

export async function getProficiencies(): Promise<{
  count: number;
  results: Proficiency[];
}> {
  return getAll('Proficiencies', '/proficiencies');
}
