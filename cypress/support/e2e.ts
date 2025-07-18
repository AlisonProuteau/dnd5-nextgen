import { attachCustomCommands } from 'cypress-firebase';
import type { UserImportRecord } from 'firebase-admin/lib/auth/user-import-builder';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import './commands';

const { FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, FIREBASE_STORAGE_EMULATOR_HOST } =
  Cypress.env();
if (FIRESTORE_EMULATOR_HOST && FIREBASE_AUTH_EMULATOR_HOST && FIREBASE_STORAGE_EMULATOR_HOST) {
  let app: firebase.app.App;
  if (firebase.apps?.length === 0) {
    const firebaseConfig = {
      apiKey: Cypress.env('FIREBASE_API_KEY'),
      projectId: Cypress.env('FIREBASE_PROJECT_ID')
    };
    app = firebase.initializeApp(firebaseConfig);

    firebase.auth().useEmulator(`http://${FIREBASE_AUTH_EMULATOR_HOST}`);

    const [firestoreHost, firestorePort] = FIRESTORE_EMULATOR_HOST?.split(':') || [
      '127.0.0.1',
      '8080'
    ];
    firebase.firestore().useEmulator(firestoreHost, firestorePort);

    const [storageHost, storagePort] = FIREBASE_STORAGE_EMULATOR_HOST?.split(':') || [
      '127.0.0.1',
      '9199'
    ];
    firebase.storage().useEmulator(storageHost, storagePort);
  } else {
    app = firebase.app();
  }

  attachCustomCommands({ Cypress, cy, firebase, app });
}

// returning false here prevents Cypress from failing the test
Cypress.on('uncaught:exception', () => false);

before(() => {
  const user: UserImportRecord = {
    displayName: 'Test',
    uid: '12345',
    email: 'test@test.com'
  };
  cy.authImportUsers([user])
    .callFirestore('set', `/users/${user.uid}`, { identifier: user.email, version: 'Legacy' })
    .login(user.uid);
});
