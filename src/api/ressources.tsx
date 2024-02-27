import type { Feature } from '../representations/abilities/feature.representation';
import type { Spell } from '../representations/abilities/magic.representation';
import type { Proficiency } from '../representations/campaign/adventure.representation';
import type { Class } from '../representations/character/class.representation';
import type { Race } from '../representations/character/race.representation';
import type { DefaultRepresentation } from '../representations/common.representation';
import { subraces } from './characters';
import { apiLink, get } from './utils';

export async function getAllRaces(): Promise<{
  count: number;
  results: DefaultRepresentation[];
}> {
  return (await get('All Races', apiLink + '/races')).json();
}

export async function getRaceInfo(raceIndex: string): Promise<Race> {
  return (await get('Race info', apiLink + `/races/${raceIndex}`)).json().then((raceData) => {
    raceData.subraces =
      subraces.find(({ index }) => index === raceIndex)?.data || raceData.subraces;
    return raceData;
  });
}

export async function getAllClasses(): Promise<{
  count: number;
  results: DefaultRepresentation[];
}> {
  return (await get('All Classes', apiLink + '/classes')).json();
}

export async function getClassInfo(classIndex: string, level?: number): Promise<Class> {
  const url = level ? `/classes/${classIndex}/levels/${level}` : `/classes/${classIndex}`;

  return (await get('Class Level Ressources', apiLink + url)).json();
}

export async function getSpellsForClass(
  classIndex: string,
  level?: number
): Promise<{ count: number; results: Spell[] }> {
  const url = level
    ? `/classes/${classIndex}/levels/${level}/spells`
    : `/classes/${classIndex}/spells`;

  return (await get('Class Spells', apiLink + url)).json();
}

export async function getFeaturesForClass(
  classIndex: string,
  level: number = 1
): Promise<{ count: number; results: Feature[] }> {
  return (
    await get('Class features', apiLink + `/classes/${classIndex}/levels/${level}/features`)
  ).json();
}

export async function getProficiencies(): Promise<{
  count: number;
  results: Proficiency[];
}> {
  return (await get('Class Level Ressources', apiLink + '/proficiencies')).json();
}
