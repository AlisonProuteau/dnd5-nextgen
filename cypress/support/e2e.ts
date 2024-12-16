import { attachCustomCommands } from 'cypress-firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import './commands';

const { FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST } = Cypress.env();
if (FIRESTORE_EMULATOR_HOST && FIREBASE_AUTH_EMULATOR_HOST) {
  const projectId = Cypress.env('FIREBASE_PROJECT_ID');
  const firebaseConfig = {
    apiKey: Cypress.env('FIREBASE_API_KEY'),
    projectId: `${projectId}`,
    authDomain: `${projectId}.firebaseapp.com`,
    storageBucket: `${projectId}.appspot.com`
  };
  const app = firebase.initializeApp(firebaseConfig);
  attachCustomCommands({ Cypress, cy, firebase, app });
}

before(() => {
  const user = {
    uid: Cypress.env().TEST_UID,
    email: 'test@test.com'
  };
  // cy.authImportUsers([user]); // .login(user.uid);

  // cy.get('#email').type('test@test.com');
  // cy.get('#password').type('Test1234!');
  // cy.get("button:contains('Sign In')").click();

  cy.authCreateUser(user);
  cy.login();
  cy.visit('/');
  cy.callFirestore('add', '/test', { id: 'test', descriptor: 'Test' });
});
