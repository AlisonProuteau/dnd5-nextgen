import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { database } from '../firebase';

const myHeaders = new Headers();
myHeaders.append('Accept', 'application/json');

const capitalizeFirstLetter = (stringToCapitilize: string) =>
  stringToCapitilize.charAt(0).toUpperCase() + stringToCapitilize.slice(1);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAll(name: string, path: string): Promise<any> {
  const res = await getDocs(collection(database, path));
  if (res.empty) throw new Error(`Not found ${capitalizeFirstLetter(name)}`);

  return res.docs.map((item) => item.data());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function get(name: string, path: string, index: string): Promise<any> {
  const res = await getDoc(doc(database, path, index));

  if (!res.exists()) throw new Error(`Not found ${capitalizeFirstLetter(name)}`);

  return res.data();
}
