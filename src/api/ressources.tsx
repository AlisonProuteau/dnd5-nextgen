import type { Feature } from '@representations/abilities/feature.representation';
import type { Spell } from '@representations/abilities/magic.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { AbilityScore, Proficiency } from '@representations/campaign/adventure.representation';
import type { Equipment, WeaponProperty } from '@representations/campaign/equipment.representation';
import type { Level } from '@representations/campaign/level.representation';
import type { Alignment, Background } from '@representations/character/background.representation';
import type { Classes, Subclass } from '@representations/character/class.representation';
import type { Race, Subrace } from '@representations/character/race.representation';
import type { DefaultRepresentation, Option } from '@representations/common.representation';
import { get, getAll, type QueryObject } from '@utils/api.utils';

export async function getAllRaces(): Promise<{
  count: number;
  results: DefaultRepresentation[];
}> {
  return get('All Races', '/races', 'all');
}

export async function getRaceInfo(raceIndex: string): Promise<Race | null> {
  return get('Race info', '/races', raceIndex);
}

export async function getSubraceInfo(
  raceIndex: string,
  subraceIndex: string
): Promise<Subrace | null> {
  return get('Subace info', `/races/${raceIndex}/subraces`, subraceIndex);
}

export async function getAllClasses(): Promise<{
  count: number;
  results: DefaultRepresentation[];
}> {
  return get('All Classes', '/classes', 'all');
}

export async function getClassInfo(
  classIndex: string,
  level?: number
): Promise<Classes | Level | null> {
  return level
    ? get('Class Level Ressources', `/classes/${classIndex}/levels`, `${classIndex}-${level}`)
    : get('Class Ressources', '/classes', classIndex);
}

export async function getSubclassInfo(
  classIndex: string,
  subclassIndex: string,
  level?: number
): Promise<Subclass | Level | null> {
  return level
    ? get(
        `Subclass Level Ressources`,
        `/classes/${classIndex}/subclasses/${subclassIndex}/levels`,
        `${subclassIndex}-${level}`
      )
    : get(`Subclass Ressources`, `/classes/${classIndex}/subclasses`, subclassIndex);
}

export function getAllAligmenents(): Promise<{ count: number; results: Alignment[] }> {
  return getAll('Alignments', '/alignments');
}

export function getAllBackgrounds(): Promise<{ count: number; results: Background[] }> {
  return getAll('Backgrounds', '/backgrounds');
}

function getQueryForIndexAndLevel(
  path: string,
  index: string,
  level?: number,
  multiple = true
): QueryObject[] {
  const levelQuery: QueryObject[] = level
    ? [
        {
          fieldPath: 'level',
          opStr: '==',
          value: level
        }
      ]
    : [];

  return [
    ...levelQuery,
    {
      fieldPath: path,
      opStr: multiple ? 'array-contains' : '==',
      value: index
    }
  ];
}

export async function getSpellsForClass(
  classIndex: string,
  subclassIndex?: string,
  level?: number
): Promise<{ count: number; results: Spell[] }> {
  const subClassSpells: Spell[] = subclassIndex
    ? (
        await getAll(
          'Spells for subclass',
          '/spells',
          getQueryForIndexAndLevel('subclasses', subclassIndex, level)
        )
      ).results
    : [];

  const allSpells = (
    (
      await getAll(
        'Spells for class',
        '/spells',
        getQueryForIndexAndLevel('classes', classIndex, level)
      )
    ).results as Spell[]
  )
    .concat(subClassSpells)
    .reduce((acc: Spell[], current) => {
      if (acc.find((spell) => spell.index === current.index && spell.level === current.level))
        return acc;

      return [...acc, current];
    }, []);

  return { count: allSpells.length, results: allSpells };
}

export async function getSpell(index: string): Promise<Spell | null> {
  return get('Spell', '/spells', index);
}

export async function getFeature(index: string): Promise<Feature | null> {
  return get('Feature', '/features', index);
}

export async function getTrait(index: string): Promise<Trait | null> {
  return get('Trait', '/traits', index);
}

export async function getAllTraitsAndFeatures(): Promise<Trait[] | Feature[] | null> {
  const traits = await getAll('', '/traits');
  const features = await getAll('', '/features');

  return traits.results.concat(features.results);
}

export async function getProficiencies(): Promise<{
  count: number;
  results: Proficiency[];
}> {
  return getAll('Proficiencies', '/proficiencies');
}

export async function getResourceList(path: string): Promise<{
  count: number;
  results: Option[];
}> {
  const pathArray = (path.startsWith('/') ? path.replace('/', '') : path).split('/');
  let data = { count: 0, results: [] as DefaultRepresentation[] };

  if (!(pathArray.length % 2)) {
    const index = pathArray.pop() || '';
    const { equipment } = await get(`Resource list ${path}`, pathArray.join('/'), index);

    data = {
      count: equipment.length,
      results: equipment
    };
  } else {
    data = await getAll(`Resource list ${path}`, path);
  }

  return {
    count: data.count,
    results: data.results.map(({ index, name }) => ({
      option_type: 'reference',
      item: { index, name }
    }))
  };
}

export async function getEquipment(index: string): Promise<Equipment | null> {
  return get('Equipment', '/equipment', index);
}

export async function getProperty(index: string): Promise<WeaponProperty | null> {
  return get('Property', '/weapon-properties', index);
}

export async function getAllAbilities(): Promise<{
  count: number;
  results: AbilityScore[];
}> {
  return getAll('All Abilities', '/ability-scores');
}
