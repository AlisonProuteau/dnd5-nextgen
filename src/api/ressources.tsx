import { uniqBy } from 'lodash';
import type { Feature } from '../representations/abilities/feature.representation';
import type { Spell } from '../representations/abilities/magic.representation';
import type { Proficiency } from '../representations/campaign/adventure.representation';
import type { Alignment, Background } from '../representations/character/background.representation';
import type { Classes, Subclass } from '../representations/character/class.representation';
import type { Race } from '../representations/character/race.representation';
import type { DefaultRepresentation } from '../representations/common.representation';
import { get, getAll, type QueryObject } from './utils';

export async function getAllRaces(): Promise<{
  count: number;
  results: DefaultRepresentation[];
}> {
  return get('All Races', '/races', 'all');
}

export async function getRaceInfo(raceIndex: string): Promise<Race> {
  return get('Race info', '/races', raceIndex);
}

export async function getSubraceInfo(raceIndex: string, subraceIndex: string): Promise<Race> {
  return get('Subace info', `/races/${raceIndex}/subraces`, subraceIndex);
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
}

export async function getSubclassInfo(
  classIndex: string,
  subclassIndex: string,
  level?: number
): Promise<Subclass> {
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

  const allSpells = uniqBy(
    (
      (
        await getAll(
          'Spells for class',
          '/spells',
          getQueryForIndexAndLevel('classes', classIndex, level)
        )
      ).results as Spell[]
    ).concat(subClassSpells),
    'index'
  );

  return { count: allSpells.length, results: allSpells };
}

export async function getFeaturesForClass(
  classIndex: string,
  subclassIndex?: string,
  level?: number
): Promise<{ count: number; results: Feature[] }> {
  const subclassFeatures: Feature[] = subclassIndex
    ? (
        await getAll(
          'Features for subclass',
          '/features',
          getQueryForIndexAndLevel('subclass.index', subclassIndex, level, false)
        )
      ).results
    : [];

  const allFeatures = uniqBy(
    (
      (
        await getAll(
          'Features for class',
          '/features',
          getQueryForIndexAndLevel('class.index', classIndex, level, false)
        )
      ).results as Feature[]
    ).concat(subclassFeatures),
    'index'
  );

  return { count: allFeatures.length, results: allFeatures };
}

export async function getProficiencies(): Promise<{
  count: number;
  results: Proficiency[];
}> {
  return getAll('Proficiencies', '/proficiencies');
}

export async function getEquipmentList(id: string): Promise<{
  count: number;
  results: DefaultRepresentation[];
}> {
  const data = await (await fetch(`https://www.dnd5eapi.co/api/equipment-categories/${id}`)).json();

  return { count: data?.equipment?.length || 0, results: data?.equipment || [] };

  // TODO: Update the database to use for fetching
  // return getAll(`Equipment list ${id}`, '/equipment', [
  //   { fieldPath: 'equipment_category.index', opStr: '==', value: id }
  // ]).then((res) => ({
  //   count: res.count,
  //   results: (res.results as Equipment[]).map(({ index, name }) => ({ index, name }))
  // }));
}
