import { defineConfig } from 'cypress';
import { plugin as cypressFirebasePlugin } from 'cypress-firebase';
import * as admin from 'firebase-admin';
import * as env from './cypress/.env.json';
import { emulators } from './firebase.json';

export default defineConfig({
  e2e: {
    env: {
      ...env,
      FIREBASE_AUTH_EMULATOR_HOST: `${emulators.firestore.host}:${emulators.auth.port}`,
      FIRESTORE_EMULATOR_HOST: `${emulators.firestore.host}:${emulators.firestore.port}`
    },
    baseUrl: `http://${emulators.firestore.host}:${emulators.hosting.port}`,
    setupNodeEvents: (on, config) => {
      process.env = {
        ...env,
        FIREBASE_AUTH_EMULATOR_HOST: `${emulators.firestore.host}:${emulators.auth.port}`,
        FIRESTORE_EMULATOR_HOST: `${emulators.firestore.host}:${emulators.firestore.port}`
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
    }
  }
});
