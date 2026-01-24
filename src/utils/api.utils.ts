import {
  and,
  collection,
  doc,
  type FieldPath,
  getDoc,
  getDocs,
  or,
  orderBy,
  query,
  type QueryFilterConstraint,
  where,
  type WhereFilterOp
} from 'firebase/firestore';
import { database } from 'src/firebase';

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
  isOr = false,
  orderByField?: string,
  orderDirection?: 'asc' | 'desc'
): Promise<{ results: any[]; count: number }> {
  const ref = collection(database, path);
  let conditions: QueryFilterConstraint | undefined;
  let q;

  if (queryParms?.length && queryParms.length > 1) {
    conditions = (isOr ? or : and)(
      ...queryParms.map((queryParm) => where(queryParm.fieldPath, queryParm.opStr, queryParm.value))
    );
  } else if (queryParms?.length === 1) {
    conditions = where(queryParms[0].fieldPath, queryParms[0].opStr, queryParms[0].value);
  }

  const order = orderByField ? orderBy(orderByField, orderDirection ?? 'asc') : undefined;
  if (order) {
    q = conditions ? query(ref, conditions as any, order) : query(ref, order);
  } else {
    q = conditions ? query(ref, conditions as any) : query(ref);
  }

  const res = await getDocs(q).catch((e) => {
    console.error(`Failed to get docs for ${name}: `, e);
    return { docs: [] };
  });

  return 'results' in res.docs
    ? (res.docs as any)
    : { count: res.docs.length, results: res.docs.map((item) => item.data()) };
}

export async function get(name: string, path: string, index: string): Promise<any> {
  const res = await getDoc(doc(database, path, index));

  if (!res.exists()) console.error(`Not found ${capitalizeFirstLetter(name)}: ${index}`);

  return res.data() ?? null;
}
