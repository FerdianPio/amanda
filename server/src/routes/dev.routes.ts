import { Router } from 'express';
import { seedDatabase } from '../../../prisma/seed.ts';
import { runMigration } from '../../../prisma/migrate.ts';
import { db } from '../db/db.ts';

const router = Router();

router.post('/reset', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database reset to clean demo baseline successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/setup', async (req, res) => {
  try {
    const migrationResult = await runMigration();
    await seedDatabase();
    res.json({
      success: true,
      message: 'Setup & migrasi database selesai. Tabel dan data demo aktif.',
      tables: migrationResult.tables,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/migrate', async (req, res) => {
  try {
    const result = await runMigration();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/db-status', async (req, res) => {
  try {
    const status = await db.getMigrationStatus();
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const checks: { test: string; passed: boolean }[] = [];

    // Check BU
    const buRes = await db.query('SELECT COUNT(*) as count FROM business_units');
    checks.push({ test: 'Business units exist', passed: Number(buRes.rows[0].count) >= 2 });

    // Check Users
    const usersRes = await db.query('SELECT COUNT(*) as count FROM users');
    checks.push({ test: 'Users exist', passed: Number(usersRes.rows[0].count) >= 3 });

    // Check Customers
    const custRes = await db.query('SELECT COUNT(*) as count FROM customers');
    checks.push({ test: 'Customers exist', passed: Number(custRes.rows[0].count) >= 10 });

    // Check Orders
    const ordRes = await db.query('SELECT COUNT(*) as count FROM orders');
    checks.push({ test: 'Orders exist', passed: Number(ordRes.rows[0].count) >= 5 });

    const allPassed = checks.every((c) => c.passed);
    res.json({ success: allPassed, data: checks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
