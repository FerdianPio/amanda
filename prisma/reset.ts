import { seedDatabase } from './seed.ts';
import { db } from '../server/src/db/db.ts';

async function resetDatabase() {
  console.log('Resetting Amanda Group SFA Database to clean demo baseline...');
  await seedDatabase();
  console.log('Database reset complete. All original demo states restored.');
  await db.close().catch(() => {});
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
