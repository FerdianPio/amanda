import { runMigration } from './migrate.ts';
import { seedDatabase } from './seed.ts';
import { db } from '../server/src/db/db.ts';

async function setupDatabase() {
  console.log('=====================================================');
  console.log('  SFA Amanda Group: Setup & Migrasi Database (PGlite) ');
  console.log('=====================================================\n');

  console.log('1. Menjalankan Migrasi Skema PostgreSQL...');
  const migrationResult = await runMigration();
  console.log(`   ${migrationResult.message}`);

  console.log('\n2. Mengisi Data Awal Demo (Seeding)...');
  await seedDatabase();

  console.log('\n=====================================================');
  console.log('✅ Setup & migrasi selesai! Database PGlite siap.');
  console.log('   Anda dapat langsung menjalankan: npm run dev');
  console.log('=====================================================');

  await db.close().catch(() => {});
  process.exit(0);
}

setupDatabase().catch((err) => {
  console.error('\n❌ Setup database gagal:', err);
  process.exit(1);
});
