import toast from 'react-hot-toast';
import { createUserInFirebase, signInFirebase, signOutInFirebase } from '../firebase';

export const createUser = (email: string, password: string) =>
  createUserInFirebase(email, password)
    .then((userCredential) => userCredential.user)
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
