import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import type { Character } from '../components/CharacterCard/CharacterContainer';
import { createUserInFirebase, database, signInFirebase, signOutInFirebase } from '../firebase';
import { get, getAll } from './utils';

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
  signOutInFirebase()
    .then(() => toast.success('Signed out successfully'))
    .catch((error) => {
      toast.error(
        `Something went wrong
        ${(error as Error).message || 'Error'}`
      );
    });

export const getUserCharacters = async (userId: string): Promise<Character[] | undefined> =>
  (await getAll('All user characters', `users/${userId}/characters`)).results;

export const getCharacter = async (
  userId: string,
  characterId: string
): Promise<Character | undefined> =>
  get('All user characters', `users/${userId}/characters`, characterId);
