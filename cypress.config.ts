import { defineConfig } from 'cypress';
import { plugin as cypressFirebasePlugin } from 'cypress-firebase';
import * as admin from 'firebase-admin';
import * as env from './cypress/.env.json';
import { emulators } from './firebase.json';

export default defineConfig({
  e2e: {
    env,
    baseUrl: `http://localhost:${emulators.hosting.port}`,
    setupNodeEvents: (on, config) =>
      cypressFirebasePlugin(on, config, admin, { projectId: 'dnd5-nextgen' })
  }
});
