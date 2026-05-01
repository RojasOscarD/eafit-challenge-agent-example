import { initDatabase } from './db';

let initialized = false;

export async function ensureDatabase() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
    console.log('Database initialized successfully');
  }
}
