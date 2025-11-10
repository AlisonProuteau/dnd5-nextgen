import { attachCustomCommands } from 'cypress-firebase';
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

const hideFirebaseEmulatorWarning = () => {
  cy.get('body').then((body) => {
    // After navigation, check for the emulator warning and dismiss it if present
    if (body.find('.firebase-emulator-warning').length > 0) {
      cy.get('.firebase-emulator-warning').invoke('css', 'z-index', '-1000');
    }
  });
};

Cypress.Commands.overwrite('visit', (originalFn, options) =>
  originalFn(options).then((res) => {
    hideFirebaseEmulatorWarning();
    return res;
  })
);

Cypress.Commands.overwrite('reload', (originalFn, forceReload, options) =>
  originalFn(forceReload, options).then((res) => {
    hideFirebaseEmulatorWarning();
    return res;
  })
);

declare global {
  namespace Cypress {
    interface Cypress {
      testUser: { displayName: string; uid: string; email: string; password: string };
    }
  }
}

Cypress.testUser = {
  displayName: 'Test User',
  uid: '12345',
  email: 'test@test.com',
  password: 'v@lidPassword123'
};

before(() => {
  cy.deleteAllAuthUsers()
    .callFirestore('delete', `users/`)
    .then(() =>
      cy.authCreateUser(Cypress.testUser).callFirestore('set', `/users/${Cypress.testUser.uid}`, {
        identifier: Cypress.testUser.email,
        version: 'Legacy'
      })
    );
});

beforeEach(() => cy.logout());
