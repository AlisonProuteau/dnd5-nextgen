import { DefaultInstance } from '../representations/default.representation';
import { apiLink, get } from './utils';

export async function getSpellsForClass(
  classIndex: string,
  level?: number
): Promise<{ count: number; results: DefaultInstance[] }> {
  const url = level
    ? `/classes/${classIndex}/levels/${level}/spells`
    : `/classes/${classIndex}/spells`;

  return (await get('Class Spells', apiLink + url)).json();
}

export async function getFeaturesForClass(
  classIndex: string,
  level: number = 1
): Promise<{ count: number; results: DefaultInstance[] }> {
  return (
    await get('Class features', apiLink + `/classes/${classIndex}/levels/${level}/features`)
  ).json();
}

export async function getProficiencies(): Promise<{ count: number; results: DefaultInstance[] }> {
  return (await get('Class Level Ressources', apiLink + '/proficiencies')).json();
}
