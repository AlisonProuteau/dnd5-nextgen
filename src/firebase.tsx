import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
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
export const analytics = getAnalytics(app);
export const database = getFirestore(app);
