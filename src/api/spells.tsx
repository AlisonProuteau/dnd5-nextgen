import { DefaultInstance } from '../representations/default.representation';
import { apiLink, get } from './utils';

export async function getSpellsForClass(
  classIndex: string,
  level?: number
): Promise<{ count: number; results: [DefaultInstance] }> {
  const url = level
    ? `/classes/${classIndex}/levels/${level}/spells`
    : `/classes/${classIndex}/spells`;

  return (await get('Class Spells', apiLink + url)).json();
}
