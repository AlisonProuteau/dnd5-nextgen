import { getAnalytics } from 'firebase/analytics';
import { initializeApp, type FirebaseOptions } from 'firebase/app';
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
import { getStorage } from 'firebase/storage';

const { FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, FIREBASE_CONFIG } = import.meta.env;
const firebaseConfig: FirebaseOptions = JSON.parse(FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const database = getFirestore(app);
if (FIRESTORE_EMULATOR_HOST) {
  const [host, port] = FIRESTORE_EMULATOR_HOST?.split(':') || ['127.0.0.1', '8080'];
  connectFirestoreEmulator(database, host, parseInt(port));
  console.debug(`Using Firestore emulator: http://${FIRESTORE_EMULATOR_HOST}/`);
} else console.debug('Firestore production mode');

const auth = getAuth(app);
if (FIREBASE_AUTH_EMULATOR_HOST) {
  connectAuthEmulator(auth, `http://l${FIREBASE_AUTH_EMULATOR_HOST}/`);
  console.debug(`Using Auth emulator: http://${FIREBASE_AUTH_EMULATOR_HOST}/`);
} else console.debug('Auth production mode');

const storage = getStorage(app);
// TODO: Add storage emulator configuration if needed

export const createUserInFirebase = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);
export const signInFirebase = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
export const signOutInFirebase = () => signOut(auth);
export const onAuthChange = (fn: NextOrObserver<User>, error?: ErrorFn, completed?: CompleteFn) =>
  onAuthStateChanged(auth, fn, error, completed);
export { analytics, database, storage };
