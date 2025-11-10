import { defineConfig } from 'cypress';
import { plugin as cypressFirebasePlugin } from 'cypress-firebase';
import * as admin from 'firebase-admin';
import { emulators } from './firebase.json';

const FIREBASE_AUTH_EMULATOR_HOST = `${emulators.auth.host}:${emulators.auth.port}`;
const FIRESTORE_EMULATOR_HOST = `${emulators.firestore.host}:${emulators.firestore.port}`;
const FIREBASE_STORAGE_EMULATOR_HOST = `${emulators.storage.host}:${emulators.storage.port}`;

export default defineConfig({
  projectId: 'bgqe2g',
  e2e: {
    env: {
      FIREBASE_AUTH_EMULATOR_HOST,
      FIRESTORE_EMULATOR_HOST,
      FIREBASE_STORAGE_EMULATOR_HOST
    },
    baseUrl: `http://${emulators.hosting.host}:${emulators.hosting.port}`,
    setupNodeEvents: (on, config) => {
      process.env = {
        FIREBASE_AUTH_EMULATOR_HOST,
        FIRESTORE_EMULATOR_HOST,
        FIREBASE_STORAGE_EMULATOR_HOST
      };

      return cypressFirebasePlugin(
        on,
        config,
        admin,
        { projectId: 'dnd5-nextgen' },
        {
          protectProduction: {
            firestore: 'error',
            auth: 'error'
          }
        }
      );
    },
    reporter: 'mochawesome',
    reporterOptions: {
      reportFilename: 'cypress-report',
      reportDir: './cypress/reports',
      overwrite: false,
      html: false,
      json: true
    }
  }
});
