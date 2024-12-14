import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import {
  CompleteFn,
  ErrorFn,
  NextOrObserver,
  User,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCNATiq_BDJgHq2hw79Cjdwy0TcyB73v9c',
  authDomain: 'dnd5-nextgen.firebaseapp.com',
  projectId: 'dnd5-nextgen',
  storageBucket: 'dnd5-nextgen.appspot.com',
  messagingSenderId: '566203048707',
  appId: '1:566203048707:web:fadc47511f464482c23f36',
  measurementId: 'G-FLH1SPJ74T'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getFirestore(app);
const analytics = getAnalytics(app);

const { VITE_FIRESTORE_EMULATOR_HOST, VITE_FIREBASE_AUTH_EMULATOR_HOST } = import.meta.env;
if (VITE_FIRESTORE_EMULATOR_HOST) {
  const [host, port] = VITE_FIRESTORE_EMULATOR_HOST?.split(':') || ['127.0.0.1', '8080'];
  connectFirestoreEmulator(database, host, parseInt(port));
  console.debug(`Using Firestore emulator: http://${VITE_FIRESTORE_EMULATOR_HOST}/`);
} else console.debug('Firestore production mode');

if (VITE_FIREBASE_AUTH_EMULATOR_HOST) {
  connectAuthEmulator(auth, `http://l${VITE_FIREBASE_AUTH_EMULATOR_HOST}/`);
  console.debug(`Using Auth emulator: http://${VITE_FIREBASE_AUTH_EMULATOR_HOST}/`);
} else console.debug('Auth production mode');

export { analytics, database };
export const createUserInFirebase = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);
export const signInFirebase = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
export const signOutInFirebase = () => signOut(auth);
export const onAuthChange = (fn: NextOrObserver<User>, error?: ErrorFn, completed?: CompleteFn) =>
  onAuthStateChanged(auth, fn, error, completed);
