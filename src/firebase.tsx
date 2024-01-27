import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import {
  CompleteFn,
  ErrorFn,
  NextOrObserver,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCNATiq_BDJgHq2hw79Cjdwy0TcyB73v9c',
  authDomain: 'dnd5-nextgen.firebaseapp.com',
  projectId: 'dnd5-nextgen',
  storageBucket: 'dnd5-nextgen.appspot.com',
  messagingSenderId: '566203048707',
  appId: '1:566203048707:web:fadc47511f464482c23f36',
  measurementId: 'G-FLH1SPJ74T'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const database = getFirestore(app);
export const createUserInFirebase = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);
export const signInFirebase = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
export const signOutInFirebase = () => signOut(auth);
export const onAuthChange = (fn: NextOrObserver<User>, error?: ErrorFn, completed?: CompleteFn) =>
  onAuthStateChanged(auth, fn, error, completed);
