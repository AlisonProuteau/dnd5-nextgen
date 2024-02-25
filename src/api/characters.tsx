import { ClassInfo, type RaceInfo } from '../representations/classes.representation';
import { DefaultInstance } from '../representations/default.representation';
import { apiLink, get } from './utils';

export async function getAllRaces(): Promise<{
  count: number;
  results: [DefaultInstance];
}> {
  return (await get('All Races', apiLink + '/races')).json();
}

export async function getRaceInfo(raceIndex: string): Promise<RaceInfo> {
  return (await get('Race info', apiLink + `/races/${raceIndex}`)).json();
}

export async function getAllClasses(): Promise<{
  count: number;
  results: [DefaultInstance];
}> {
  return (await get('All Classes', apiLink + '/classes')).json();
}

export async function getClassInfo(classIndex: string): Promise<ClassInfo> {
  return (await get('Class info', apiLink + `/classes/${classIndex}`)).json();
}
