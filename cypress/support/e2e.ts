import { attachCustomCommands } from 'cypress-firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import './commands';

const { FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST } = Cypress.env();
if (FIRESTORE_EMULATOR_HOST && FIREBASE_AUTH_EMULATOR_HOST) {
  let app: firebase.app.App;
  if (firebase.apps?.length === 0) {
    const firebaseConfig = {
      apiKey: Cypress.env('FIREBASE_API_KEY'),
      projectId: Cypress.env('FIREBASE_PROJECT_ID')
    };
    app = firebase.initializeApp(firebaseConfig);

    firebase.auth().useEmulator(`http://${FIRESTORE_EMULATOR_HOST}`);

    const [host, port] = FIRESTORE_EMULATOR_HOST?.split(':') || ['127.0.0.1', '8080'];
    firebase.firestore().useEmulator(host, port);
  } else {
    app = firebase.app();
  }

  attachCustomCommands({ Cypress, cy, firebase, app });
}

// returning false here prevents Cypress from failing the test
Cypress.on('uncaught:exception', () => false);

before(() => {
  const user = {
    uid: '12345',
    email: 'test@test.com'
  };
  cy.authImportUsers([user]).login(user.uid);

  cy.callFirestore('set', `/users/${user.uid}`, { identifier: user.email }).then(() => {
    cy.visit('/');
    cy.get('#name').should('be.visible').type('Test');
    cy.get('button:contains("Submit")').click();
  });
});
