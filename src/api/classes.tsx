import { ClassInfo } from '../representations/classes.representation';
import { DefaultInstance } from '../representations/default.representation';
import { apiLink, get } from './utils';

export async function getAllClasses(): Promise<{
  count: number;
  results: [DefaultInstance];
}> {
  return (await get('All Classes', apiLink + '/classes')).json();
}

export async function getClasseInfo(classIndex: string): Promise<ClassInfo> {
  return (await get('Class info', apiLink + `/classes/${classIndex}`)).json();
}
