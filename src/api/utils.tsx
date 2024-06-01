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
import { database } from '../firebase';

const myHeaders = new Headers();
myHeaders.append('Accept', 'application/json');

const capitalizeFirstLetter = (stringToCapitilize: string) =>
  stringToCapitilize.charAt(0).toUpperCase() + stringToCapitilize.slice(1);

export interface QueryObject {
  fieldPath: string | FieldPath;
  opStr: WhereFilterOp;
  value: unknown;
}

export async function getAll(name: string, path: string, queryParms?: QueryObject[]): Promise<any> {
  let res;
  const ref = collection(database, path);

  if (queryParms?.length && queryParms.length > 1) {
    const q = query(
      ref,
      and(
        ...queryParms.map((queryParm) =>
          where(queryParm.fieldPath, queryParm.opStr, queryParm.value)
        )
      )
    );
    res = await getDocs(q);
  } else if (queryParms?.length === 1) {
    const q = query(ref, where(queryParms[0].fieldPath, queryParms[0].opStr, queryParms[0].value));
    res = await getDocs(q);
  } else {
    res = await getDocs(ref);
  }

  return (res.docs as any).results
    ? res.docs
    : { count: res.docs.length, results: res.docs.map((item) => item.data()) };
}

export async function get(name: string, path: string, index: string): Promise<any> {
  const res = await getDoc(doc(database, path, index));

  if (!res.exists()) console.error(`Not found ${capitalizeFirstLetter(name)}`);

  return res.data() ?? null;
}
