import { attachCustomCommands } from 'cypress-firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import * as env from '../../cypress.env.json';
import './commands';

const { FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, FIREBASE_STORAGE_EMULATOR_HOST } =
  Cypress.expose();
if (FIRESTORE_EMULATOR_HOST && FIREBASE_AUTH_EMULATOR_HOST && FIREBASE_STORAGE_EMULATOR_HOST) {
  let app: firebase.app.App;

  if (firebase.apps?.length === 0) {
    const firebaseConfig = {
      apiKey: env.FIREBASE_API_KEY,
      projectId: env.FIREBASE_PROJECT_ID
    };
    app = firebase.initializeApp(firebaseConfig);

    firebase.auth().useEmulator(`http://${FIREBASE_AUTH_EMULATOR_HOST}`);

    const [firestoreHost, firestorePort] = FIRESTORE_EMULATOR_HOST?.split(':') || [
      '127.0.0.1',
      '8080'
    ];
    const firestore = firebase.firestore();
    firestore.settings({ experimentalForceLongPolling: true });
    firestore.useEmulator(firestoreHost, firestorePort);

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
// Cypress.on('uncaught:exception', () => false);

const hideFirebaseEmulatorWarning = () =>
  cy.get('body').then((body) => {
    // After navigation, check for the emulator warning and dismiss it if present
    if (body.find('.firebase-emulator-warning').length > 0) {
      return cy.get('.firebase-emulator-warning').invoke('css', 'z-index', '-1000');
    }
  });

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
  cy.log('🔧 Setting up test environment...');

  return cy
    .deleteAllAuthUsers()
    .callFirestore('delete', `users/`)
    .then(() =>
      cy.authCreateUser(Cypress.testUser).callFirestore('set', `/users/${Cypress.testUser.uid}`, {
        identifier: Cypress.testUser.email,
        version: 'Legacy'
      })
    )
    .then(() =>
      cy
        .callFirestore('get', `/users/${Cypress.testUser.uid}`)
        .should('exist', 'User data should exist in Firestore')
        .should('have.property', 'identifier', Cypress.testUser.email)
    )
    .then(() => {
      cy.log('🔐 Initialize firebase...');
      cy.login(Cypress.testUser.uid);
      cy.visit('/');
      cy.get('[role="progressbar"], .loading, [data-testid="loading"]').should('exist', {
        timeout: 10000
      });
    })
    .then(() => cy.log('✨ Test environment ready'));
});

beforeEach(() => cy.logout());
