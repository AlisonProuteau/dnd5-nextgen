import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { database, storage } from 'src/firebase';
import { CharacterDetails } from './character';

// Remove undefined/null values from object
const cleanObject = <T extends Record<string, any>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
  ) as Partial<T>;
};

export function startFirebaseUpload(base64Url: string, character: CharacterDetails) {
  const filename = `${character.class}-${character.race}-${character.gender}_${Date.now()}.png`;
  const imageRef = ref(storage, `images/${filename}`);
  const binary = Uint8Array.from(atob(base64Url.split(',')[1]), (c) => c.charCodeAt(0));
  const uploadTask = uploadBytesResumable(imageRef, binary);

  return { uploadTask, imageRef, character };
}

export async function saveUploadMetadata(downloadUrl: string, character: CharacterDetails) {
  await addDoc(collection(database, 'images'), {
    url: downloadUrl,
    character: cleanObject(character),
    createdAt: Timestamp.now()
  });
}
