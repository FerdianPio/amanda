import { db } from '../server/src/db/db.ts';

async function verifyDatabase() {
  console.log('Running Amanda Group SFA Database Scenario Verification...');
  await db.init();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`PASS: ${message}`);
      passed++;
    } else {
      console.error(`FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Business units
    const buRes = await db.query('SELECT * FROM business_units ORDER BY code ASC');
    assert(buRes.rows.length >= 2, 'At least 2 Business Units exist (Bakery & Mart)');

    // 2. Themes
    const themeRes = await db.query('SELECT * FROM business_unit_themes');
    assert(themeRes.rows.length >= 2, 'Business Unit Themes are persisted in PostgreSQL');
    const bakeryTheme = themeRes.rows.find((t) => t.business_unit_id === 'bu-bakery');
    assert(bakeryTheme && bakeryTheme.accent_color === '#C97A3A', 'Bakery theme accent is #C97A3A');

    // 3. Demo Users
    const andiRes = await db.query("SELECT * FROM users WHERE id = 'u-andi'");
    assert(andiRes.rows.length === 1 && andiRes.rows[0].business_unit_id === 'bu-bakery', 'Andi exists and belongs to Amanda Bakery');

    const sitiRes = await db.query("SELECT * FROM users WHERE id = 'u-siti'");
    assert(sitiRes.rows.length === 1 && sitiRes.rows[0].business_unit_id === 'bu-mart', 'Siti exists and belongs to Amanda Mart');

    const budiRes = await db.query("SELECT * FROM users WHERE id = 'u-budi'");
    assert(budiRes.rows.length === 1 && budiRes.rows[0].role === 'SUPERVISOR', 'Budi exists as Supervisor');

    // 4. Customers & Risk Fixtures
    const kopiSenjaRes = await db.query("SELECT * FROM customers WHERE id = 'c-3'");
    assert(kopiSenjaRes.rows.length === 1 && kopiSenjaRes.rows[0].status === 'AT_RISK', 'Cafe Kopi Senja is flagged AT_RISK');

    const barokahRes = await db.query("SELECT * FROM customers WHERE id = 'c-6'");
    assert(barokahRes.rows.length === 1 && barokahRes.rows[0].last_visit_days_ago <= 1, 'Toko Roti Barokah has recent visit (1 day ago)');

    // 5. Attendance Scenarios
    const todayKey = new Date().toDateString();
    const andiAttRes = await db.query("SELECT * FROM attendances WHERE user_id = 'u-andi' AND date_key = $1", [todayKey]);
    assert(andiAttRes.rows.length === 1 && andiAttRes.rows[0].status === 'ON_TIME', 'Andi has checked in on-time today');

    const dediAttRes = await db.query("SELECT * FROM attendances WHERE user_id = 'u-dedi' AND date_key = $1", [todayKey]);
    assert(dediAttRes.rows.length === 0, 'Dedi has NOT checked in today (Supervisor alert scenario)');

    // 6. Approval Rule Boundary Tests
    // Boundary order: 10% discount, 20 qty -> NO approval
    const boundOrder = await db.query("SELECT * FROM orders WHERE id = 'ord-demo-bound'");
    assert(boundOrder.rows.length === 1 && !boundOrder.rows[0].requires_approval, 'Order with 10% discount and 20 qty requires NO approval');

    // Discount trigger: 15% discount, 12 qty -> REQUIRES approval
    const discOrder = await db.query("SELECT * FROM orders WHERE id = 'ord-demo-disc'");
    assert(discOrder.rows.length === 1 && discOrder.rows[0].requires_approval, 'Order with 15% discount (>10%) requires approval');

    // Qty trigger: 5% discount, 25 qty -> REQUIRES approval
    const qtyOrder = await db.query("SELECT * FROM orders WHERE id = 'ord-demo-qty'");
    assert(qtyOrder.rows.length === 1 && qtyOrder.rows[0].requires_approval, 'Order with 25 qty (>20) requires approval');

    // 7. Target calculations
    const andiTarget = await db.query("SELECT * FROM monthly_sales_targets WHERE user_id = 'u-andi'");
    assert(andiTarget.rows.length === 1 && Number(andiTarget.rows[0].target_amount) === 100000000, 'Andi monthly target is Rp 100,000,000');

    // 8. Notifications
    const notifRes = await db.query("SELECT * FROM notifications WHERE user_id = 'u-andi'");
    assert(notifRes.rows.length >= 2, 'Notifications exist in PostgreSQL for Andi');

    console.log(`\nVerification Summary: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  } finally {
    await db.close().catch(() => {});
    process.exit(failed > 0 ? 1 : 0);
  }
}

verifyDatabase();
