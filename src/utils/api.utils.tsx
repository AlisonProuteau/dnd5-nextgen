/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  and,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type FieldPath,
  type WhereFilterOp
} from 'firebase/firestore';
import { database } from 'src/firebase';
import type { Version } from './versions.constants';

const myHeaders = new Headers();
myHeaders.append('Accept', 'application/json');

const capitalizeFirstLetter = (stringToCapitilize: string) =>
  stringToCapitilize.charAt(0).toUpperCase() + stringToCapitilize.slice(1);

export interface QueryObject {
  fieldPath: string | FieldPath;
  opStr: WhereFilterOp;
  value: unknown;
}

export async function getAll(
  name: string,
  path: string,
  queryParms?: QueryObject[],
  version: Version = 'Legacy' // TODO: update versionning
): Promise<{ results: any[]; count: number }> {
  const pathFormatted = path.startsWith('/') ? path.replace('/', '') : path;
  const versionnedPath =
    version && !pathFormatted.startsWith('users')
      ? `versions/${version}/${pathFormatted}`
      : pathFormatted;
  const ref = collection(database, versionnedPath);
  let res;

  if (queryParms?.length && queryParms.length > 1) {
    const q = query(
      ref,
      and(
        ...queryParms.map((queryParm) =>
          where(queryParm.fieldPath, queryParm.opStr, queryParm.value)
        )
      )
    );
    res = await getDocs(q).catch((e) => {
      console.error(e);
      return { docs: [] };
    });
  } else if (queryParms?.length === 1) {
    const q = query(ref, where(queryParms[0].fieldPath, queryParms[0].opStr, queryParms[0].value));
    res = await getDocs(q).catch((e) => {
      console.error(e);
      return { docs: [] };
    });
  } else {
    res = await getDocs(ref).catch((e) => {
      console.error(e);
      return { docs: [] };
    });
  }

  return 'results' in res.docs
    ? (res.docs as any)
    : { count: res.docs.length, results: res.docs.map((item) => item.data()) };
}

export async function get(
  name: string,
  path: string,
  index: string,
  version: Version = 'Legacy' // TODO: update versionning
): Promise<any> {
  const pathFormatted = path.startsWith('/') ? path.replace('/', '') : path;
  const versionnedPath =
    version && !pathFormatted.startsWith('users')
      ? `versions/${version}/${pathFormatted}`
      : pathFormatted;
  const res = await getDoc(doc(database, versionnedPath, index));

  if (!res.exists()) console.error(`Not found ${capitalizeFirstLetter(name)}: ${index}`);

  return res.data() ?? null;
}
