import fs from 'fs';
import path from 'path';
import { db } from '../server/src/db/db.ts';

export async function runMigration(): Promise<{ success: boolean; tables: string[]; message: string }> {
  console.log('--- Starting SFA Amanda Group Database Migration (PGlite) ---');

  // Initialize DB connection (without running auto-migration)
  await db.init({ skipAutoMigrate: true });

  // Apply schema definitions
  await db.applySchema();

  // Fetch created tables from information_schema
  const result = await db.query<{ table_name: string }>(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name ASC;
  `);

  const tables = result.rows.map((r) => r.table_name);
  console.log(`Successfully migrated ${tables.length} tables to PGlite:`);
  tables.forEach((tbl) => console.log(`  ✓ ${tbl}`));

  return {
    success: true,
    tables,
    message: `Migration completed successfully. ${tables.length} tables active.`,
  };
}

// Allow direct execution: tsx prisma/migrate.ts
if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigration()
    .then((res) => {
      console.log(res.message);
      return db.close().catch(() => {});
    })
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
