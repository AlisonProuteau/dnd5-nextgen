import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import type { CharacterFormData } from '../components/CharacterCreation/CharacterCreation';
import { createUserInFirebase, database, signInFirebase, signOutInFirebase } from '../firebase';
import { get, getAll } from './utils';

export const createUser = (email: string, password: string) =>
  createUserInFirebase(email, password)
    .then(async (userCredential) => {
      setDoc(doc(database, 'users', userCredential.user.uid), {
        identifier: userCredential.user.email
      });

      return userCredential.user;
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

export const getUserCharacters = async (userId: string): Promise<CharacterFormData[] | undefined> =>
  (await getAll('All user characters', `users/${userId}/characters`)).results;

export const getCharacter = async (
  userId: string,
  characterId: string
): Promise<CharacterFormData | undefined> =>
  get('All user characters', `users/${userId}/characters`, characterId);
