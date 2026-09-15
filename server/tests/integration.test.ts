import { db } from '../src/db/db.ts';

async function runTests() {
  console.log('Running Amanda Group SFA Integration Tests...');
  await db.init();

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`PASS: ${msg}`);
      passed++;
    } else {
      console.error(`FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // Test 1: BU isolation in DB
    const andiCust = await db.query("SELECT COUNT(*) as c FROM customers WHERE business_unit_id = 'bu-bakery'");
    const sitiCust = await db.query("SELECT COUNT(*) as c FROM customers WHERE business_unit_id = 'bu-mart'");
    assert(Number(andiCust.rows[0].c) > 0, 'Bakery customers exist');
    assert(Number(sitiCust.rows[0].c) > 0, 'Mart customers exist');

    // Test 2: Products isolated by BU
    const bakeryProd = await db.query("SELECT COUNT(*) as c FROM products WHERE business_unit_id = 'bu-bakery'");
    const martProd = await db.query("SELECT COUNT(*) as c FROM products WHERE business_unit_id = 'bu-mart'");
    assert(Number(bakeryProd.rows[0].c) > 0, 'Bakery products exist');
    assert(Number(martProd.rows[0].c) > 0, 'Mart products exist');

    // Test 3: Approval rule verification
    const boundOrder = await db.query("SELECT requires_approval FROM orders WHERE id = 'ord-demo-bound'");
    const discOrder = await db.query("SELECT requires_approval FROM orders WHERE id = 'ord-demo-disc'");
    const qtyOrder = await db.query("SELECT requires_approval FROM orders WHERE id = 'ord-demo-qty'");
    assert(boundOrder.rows[0]?.requires_approval === false, 'Order at boundary (10% / 20 qty) does not require approval');
    assert(discOrder.rows[0]?.requires_approval === true, 'Order with 15% discount requires approval');
    assert(qtyOrder.rows[0]?.requires_approval === true, 'Order with 25 qty requires approval');

    // Test 4: Risk fixture
    const riskCust = await db.query("SELECT * FROM customers WHERE id = 'c-3'");
    assert(riskCust.rows[0]?.status === 'AT_RISK', 'Cafe Kopi Senja is AT_RISK');

    // Test 5: Themes
    const themes = await db.query("SELECT * FROM business_unit_themes");
    assert(themes.rows.length >= 2, 'Theme branding persisted in PostgreSQL');

    console.log(`\nTest Result: ${passed} passed, ${failed} failed.`);
  } catch (err) {
    console.error('Integration test failed:', err);
    failed++;
  } finally {
    await db.close().catch(() => {});
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
