import { addDoc, collection, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { database, storage } from 'src/firebase';
import { CharacterDetails } from './character';

export function startFirebaseUpload(
  base64Url: string,
  prompt: string,
  character: CharacterDetails
) {
  const filename = `${character.class}-${character.race}-${character.gender}_${Date.now()}.png`;
  const imageRef = ref(storage, `images/${filename}`);
  const binary = Uint8Array.from(atob(base64Url.split(',')[1]), (c) => c.charCodeAt(0));
  const uploadTask = uploadBytesResumable(imageRef, binary);

  return { uploadTask, imageRef, prompt, character };
}

export async function saveUploadMetadata(
  downloadUrl: string,
  prompt: string,
  character: CharacterDetails
) {
  await addDoc(collection(database, 'images'), {
    url: downloadUrl,
    prompt,
    character,
    createdAt: Timestamp.now()
  });
}

export async function saveImageToFirebase(
  base64Url: string,
  prompt: string,
  character: any
): Promise<boolean> {
  try {
    const res = await fetch(base64Url);
    const blob = await res.blob();

    const id = `${character.class}-${character.race}-${character.gender}_${Date.now()}`;
    const storageRef = ref(storage, `images/${id}.png`);
    await uploadBytes(storageRef, blob);

    const url = await getDownloadURL(storageRef);
    const docRef = doc(collection(database, 'images'));
    await setDoc(docRef, {
      url,
      prompt,
      character,
      createdAt: serverTimestamp()
    });

    return true;
  } catch (err) {
    console.error('Firebase upload failed', err);
    return false;
  }
}
