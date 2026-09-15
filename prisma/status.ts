import { db } from '../server/src/db/db.ts';

async function checkStatus() {
  console.log('--- Checking Amanda Group SFA Database Status (PGlite) ---');
  await db.init({ skipAutoMigrate: true });

  const status = await db.getMigrationStatus();
  console.log(`Database Engine: PGlite (PostgreSQL compatible)`);
  console.log(`Migration Status: ${status.migrated ? '✅ Migrated' : '⚠️ Not Migrated'}`);
  console.log(`Active Tables (${status.tables.length}):`);
  status.tables.forEach((t) => console.log(`  - ${t}`));
  console.log(`User Records: ${status.userCount}`);

  if (!status.migrated) {
    console.log('\nTip: Run "npm run db:migrate" to apply schema migrations.');
  } else if (status.userCount === 0) {
    console.log('\nTip: Run "npm run db:seed" to populate demo accounts & products.');
  } else {
    console.log('\nDatabase is ready for use with PGlite.');
  }

  await db.close().catch(() => {});
  process.exit(0);
}

checkStatus().catch((err) => {
  console.error('Status check error:', err);
  process.exit(1);
});
