import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { omitBy } from 'lodash';
import { database, storage } from 'src/firebase';
import { CharacterDetails } from './character';

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
    character: omitBy(character, (value) => value === undefined || value === null),
    createdAt: Timestamp.now()
  });
}

export async function saveImageToFirebase(base64Url: string, character: any): Promise<boolean> {
  try {
    const { uploadTask } = startFirebaseUpload(base64Url, character);
    const downloadUrl = (await uploadTask.then(
      async (snapshot) => await getDownloadURL(snapshot.ref),
      (error) => {
        throw error;
      }
    )) as string;

    await saveUploadMetadata(downloadUrl, character);

    return true;
  } catch (err) {
    console.error('Firebase upload failed', err);
    return false;
  }
}
