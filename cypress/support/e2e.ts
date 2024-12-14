import { attachCustomCommands } from 'cypress-firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import './commands';

const projectId = Cypress.env('FIREBASE_PROJECT_ID');
const firebaseConfig = {
  apiKey: Cypress.env('FIREBASE_API_KEY'),
  projectId: `${projectId}`,
  authDomain: `${projectId}.firebaseapp.com`,
  storageBucket: `${projectId}.appspot.com`
};
const app = firebase.initializeApp(firebaseConfig);
attachCustomCommands({ Cypress, cy, firebase, app });

before(() => {
  cy.login(Cypress.env().TEST_UID);
  cy.visit('/');
});
