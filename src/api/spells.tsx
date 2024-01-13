import { get } from './utils';

export async function getSpellsForClass(
  classIndex: string,
  level?: number
): Promise<{ count: number; results: unknown }> {
  const url = level
    ? `https://www.dnd5eapi.co/api/classes/${classIndex}/levels/${level}/spells`
    : `https://www.dnd5eapi.co/api/classes/${classIndex}/spells`;

  return get(`${classIndex} Spells${level ? ` ${level}` : ''}`, url);
}
