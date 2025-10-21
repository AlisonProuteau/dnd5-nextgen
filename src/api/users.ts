import type { Character, CharacterNote, UserData } from '@representations/user.representation';
import { get, getAll } from '@utils/api.utils';
import { VERSIONS, type Version } from '@utils/versions.constants';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { createUserInFirebase, database, signInFirebase, signOutInFirebase } from 'src/firebase';

export const createUser = (email: string, password: string, displayName?: string) =>
  createUserInFirebase(email, password)
    .then(async (userCredential) => {
      await updateProfile(userCredential.user, { displayName });
      setDoc(doc(database, 'users', userCredential.user.uid), {
        identifier: userCredential.user.email
      });

      return { ...userCredential.user, displayName };
    })
    .catch((error) => {
      toast.error(
        `Something went wrong
        ${(error as Error).message || 'Error'}`
      );
    });

export const signIn = (email: string, password: string) =>
  signInFirebase(email, password)
    .then((userCredential) => userCredential.user)
    .catch((error) => {
      toast.error(
        `Something went wrong
        ${(error as Error).message || 'Error'}`
      );
    });

export const signOut = () =>
  signOutInFirebase().catch((error) => {
    toast.error(
      `Something went wrong 
      ${(error as Error).message || 'Error'}`
    );
  });

export const getUserCharacters = async (
  userId: string,
  version: Version
): Promise<Character[] | undefined> =>
  (
    await getAll('All user characters', `users/${userId}/characters`, [
      { fieldPath: 'version', opStr: '==', value: version }
    ])
  ).results;

export const getCharacterNotes = async (
  userId: string,
  characterId: string
): Promise<CharacterNote[] | undefined> =>
  (await getAll('All character notes', `users/${userId}/characters/${characterId}/notes`)).results;

export const getCharacter = async (
  userId: string,
  characterId: string
): Promise<Character | undefined> =>
  get('All user characters', `users/${userId}/characters`, characterId);

export const getUserData = async (userId: string): Promise<UserData | undefined> => {
  const data: UserData = await get('User data', `users`, userId);

  return !(data.version && VERSIONS.includes(data.version))
    ? { ...data, version: undefined }
    : data;
};
