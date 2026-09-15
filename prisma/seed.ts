import bcrypt from 'bcryptjs';
import { db } from '../server/src/db/db.ts';

export async function seedDatabase() {
  await db.init();
  console.log('Seeding PostgreSQL database with Amanda Group SFA data...');

  const passwordHash = await bcrypt.hash('Demo123!', 10);
  const now = new Date();
  const currentMonthYear = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Clean existing tables (in reverse foreign key order)
  const tables = [
    'audit_logs',
    'follow_ups',
    'notifications',
    'agent_insights',
    'order_approvals',
    'order_items',
    'orders',
    'visits',
    'attendances',
    'monthly_sales_targets',
    'products',
    'customers',
    'users',
    'business_unit_themes',
    'business_units',
  ];

  for (const table of tables) {
    await db.query(`DELETE FROM ${table};`);
  }

  // 1. Seed Business Units
  console.log('Seeding Business Units...');
  await db.query(`
    INSERT INTO business_units (id, code, name, description, created_at, updated_at)
    VALUES 
      ('bu-bakery', 'BAKERY', 'Amanda Bakery', 'Divisi Bakery & Pastry Amanda Group', NOW(), NOW()),
      ('bu-mart', 'MART', 'Amanda Mart', 'Divisi Ritel & Sembako Amanda Group', NOW(), NOW());
  `);

  // 2. Seed Business Unit Themes (database-driven branding)
  console.log('Seeding BU Themes...');
  await db.query(`
    INSERT INTO business_unit_themes (
      id, business_unit_id, primary_color, primary_dark_color, accent_color, accent_soft_color,
      background_color, surface_color, surface_sunken_color, text_primary_color, text_muted_color,
      text_faint_color, border_color, initials, created_at, updated_at
    ) VALUES 
      ('theme-bakery', 'bu-bakery', '#0D6E63', '#094C44', '#C97A3A', '#F5E7DA', '#F1F4F3', '#FFFFFF', '#E9EEEC', '#15221D', '#5C6B65', '#8B978F', '#DCE4E1', 'AB', NOW(), NOW()),
      ('theme-mart', 'bu-mart', '#0D6E63', '#094C44', '#3454A6', '#E4E9F5', '#F1F4F3', '#FFFFFF', '#E9EEEC', '#15221D', '#5C6B65', '#8B978F', '#DCE4E1', 'AM', NOW(), NOW());
  `);

  // 3. Seed Users
  console.log('Seeding Users...');
  const users = [
    {
      id: 'u-andi',
      email: 'andi.sales@demo.local',
      name: 'Andi Wijaya',
      role: 'SALES',
      bu: 'bu-bakery',
      area: 'Area Yogyakarta Selatan',
      initials: 'AW',
    },
    {
      id: 'u-siti',
      email: 'siti.sales@demo.local',
      name: 'Siti Rahma',
      role: 'SALES',
      bu: 'bu-mart',
      area: 'Area Sleman',
      initials: 'SR',
    },
    {
      id: 'u-budi',
      email: 'budi.supervisor@demo.local',
      name: 'Budi Santoso',
      role: 'SUPERVISOR',
      bu: 'bu-bakery',
      area: 'Area Yogyakarta Selatan',
      initials: 'BS',
    },
    {
      id: 'u-rina',
      email: 'rina.sales@demo.local',
      name: 'Rina Kartika',
      role: 'SALES',
      bu: 'bu-bakery',
      area: 'Area Yogyakarta Selatan',
      initials: 'RK',
    },
    {
      id: 'u-dedi',
      email: 'dedi.sales@demo.local',
      name: 'Dedi Purnomo',
      role: 'SALES',
      bu: 'bu-bakery',
      area: 'Area Yogyakarta Selatan',
      initials: 'DP',
    },
    {
      id: 'u-admin',
      email: 'admin@demo.local',
      name: 'Admin Amanda',
      role: 'ADMIN',
      bu: 'bu-bakery',
      area: 'Kantor Pusat Yogyakarta',
      initials: 'AA',
    },
  ];

  for (const u of users) {
    await db.query(
      `INSERT INTO users (id, email, password_hash, name, role, business_unit_id, area, initials, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())`,
      [u.id, u.email, passwordHash, u.name, u.role, u.bu, u.area, u.initials]
    );
  }

  // 4. Seed Products
  console.log('Seeding Products...');
  const bakeryProducts = [
    { id: 'p-1', name: 'Roti Tawar Spesial', unit: 'pack', price: 15000, sku: 'BAK-001' },
    { id: 'p-2', name: 'Roti Coklat Keju', unit: 'pack', price: 18000, sku: 'BAK-002' },
    { id: 'p-3', name: 'Kue Bolu Pandan', unit: 'box', price: 45000, sku: 'BAK-003' },
    { id: 'p-4', name: 'Donat Mini Isi 6', unit: 'box', price: 20000, sku: 'BAK-004' },
    { id: 'p-5', name: 'Croissant Butter', unit: 'pcs', price: 12000, sku: 'BAK-005' },
    { id: 'p-6', name: 'Roti Sobek Isi Keju', unit: 'pack', price: 22000, sku: 'BAK-006' },
    { id: 'p-7', name: 'Roti Gandum Sehat', unit: 'pack', price: 19000, sku: 'BAK-007' },
    { id: 'p-8', name: 'Chiffon Cake Coklat', unit: 'box', price: 48000, sku: 'BAK-008' },
    { id: 'p-9', name: 'Lapis Legit Mini', unit: 'box', price: 65000, sku: 'BAK-009' },
    { id: 'p-10', name: 'Pastry Daging Sapi', unit: 'pcs', price: 16000, sku: 'BAK-010' },
  ];

  for (const p of bakeryProducts) {
    await db.query(
      `INSERT INTO products (id, business_unit_id, name, unit, price, sku, active, created_at, updated_at)
       VALUES ($1, 'bu-bakery', $2, $3, $4, $5, true, NOW(), NOW())`,
      [p.id, p.name, p.unit, p.price, p.sku]
    );
  }

  const martProducts = [
    { id: 'q-1', name: 'Beras Premium 5kg', unit: 'karung', price: 68000, sku: 'MRT-001' },
    { id: 'q-2', name: 'Minyak Goreng 2L', unit: 'botol', price: 34000, sku: 'MRT-002' },
    { id: 'q-3', name: 'Gula Pasir 1kg', unit: 'pack', price: 15500, sku: 'MRT-003' },
    { id: 'q-4', name: 'Sabun Cuci Piring', unit: 'botol', price: 9500, sku: 'MRT-004' },
    { id: 'q-5', name: 'Tepung Terigu 1kg', unit: 'pack', price: 12000, sku: 'MRT-005' },
    { id: 'q-6', name: 'Kecap Manis 600ml', unit: 'botol', price: 21000, sku: 'MRT-006' },
    { id: 'q-7', name: 'Susu Kental Manis', unit: 'kaleng', price: 13500, sku: 'MRT-007' },
    { id: 'q-8', name: 'Kopi Bubuk 250g', unit: 'pack', price: 18000, sku: 'MRT-008' },
  ];

  for (const p of martProducts) {
    await db.query(
      `INSERT INTO products (id, business_unit_id, name, unit, price, sku, active, created_at, updated_at)
       VALUES ($1, 'bu-mart', $2, $3, $4, $5, true, NOW(), NOW())`,
      [p.id, p.name, p.unit, p.price, p.sku]
    );
  }

  // 5. Seed Customers
  console.log('Seeding Customers...');
  const bakeryCustomers = [
    { id: 'c-1', name: 'Toko Kue Melati', segment: 'Toko Kelontong', address: 'Jl. Parangtritis No. 45, Yogyakarta', pic: 'Ibu Sri', phone: '0812-1234-5601', lat: -7.8253, lng: 110.3650, lastDays: 12, orders: 18, status: 'ACTIVE' },
    { id: 'c-2', name: 'Minimarket Sejahtera', segment: 'Minimarket', address: 'Jl. Bantul No. 12, Yogyakarta', pic: 'Pak Joko', phone: '0813-2345-5602', lat: -7.8395, lng: 110.3540, lastDays: 3, orders: 32, status: 'ACTIVE' },
    { id: 'c-3', name: 'Cafe Kopi Senja', segment: 'Cafe', address: 'Jl. Prawirotaman No. 8, Yogyakarta', pic: 'Mbak Dinda', phone: '0821-3456-5603', lat: -7.8225, lng: 110.3667, lastDays: 20, orders: 9, status: 'AT_RISK' },
    { id: 'c-4', name: 'Hotel Griya Persada', segment: 'Hotel', address: 'Jl. Mangkubumi No. 100, Yogyakarta', pic: 'Pak Rudi', phone: '0822-4567-5604', lat: -7.7891, lng: 110.3654, lastDays: 30, orders: 6, status: 'AT_RISK' },
    { id: 'c-5', name: 'Katering Ibu Yanti', segment: 'Katering', address: 'Jl. Wonosari No. 5, Yogyakarta', pic: 'Ibu Yanti', phone: '0856-5678-5605', lat: -7.8481, lng: 110.4023, lastDays: 5, orders: 21, status: 'ACTIVE' },
    { id: 'c-6', name: 'Toko Roti Barokah', segment: 'Toko Kelontong', address: 'Jl. Imogiri No. 21, Yogyakarta', pic: 'Pak Slamet', phone: '0857-6789-5606', lat: -7.8632, lng: 110.3721, lastDays: 1, orders: 40, status: 'ACTIVE' },
    { id: 'c-7', name: 'Warung Bu Endang', segment: 'Toko Kelontong', address: 'Jl. Kusumanegara No. 18, Yogyakarta', pic: 'Ibu Endang', phone: '0819-1122-3344', lat: -7.8012, lng: 110.3871, lastDays: 16, orders: 11, status: 'ACTIVE' },
    { id: 'c-8', name: 'Swalayan Mirota Selatan', segment: 'Minimarket', address: 'Jl. Menteri Supeno No. 34, Yogyakarta', pic: 'Pak Hendra', phone: '0817-2233-4455', lat: -7.8189, lng: 110.3812, lastDays: 18, orders: 15, status: 'ACTIVE' },
    { id: 'c-9', name: 'Cafe Ruang Kopi', segment: 'Cafe', address: 'Jl. Tirtodipuran No. 14, Yogyakarta', pic: 'Mas Gilang', phone: '0818-3344-5566', lat: -7.8208, lng: 110.3621, lastDays: 8, orders: 14, status: 'ACTIVE' },
    { id: 'c-10', name: 'Katering Berkah Rasa', segment: 'Katering', address: 'Jl. Gambiran No. 7, Yogyakarta', pic: 'Ibu Ratna', phone: '0812-4455-6677', lat: -7.8145, lng: 110.3920, lastDays: 2, orders: 28, status: 'ACTIVE' },
    // Empty state customer (no visits, no orders yet)
    { id: 'c-11', name: 'Toko Sahabat Baru', segment: 'Toko Kelontong', address: 'Jl. Lowanu No. 90, Yogyakarta', pic: 'Pak Agus', phone: '0813-5566-7788', lat: -7.8234, lng: 110.3789, lastDays: 0, orders: 0, status: 'ACTIVE' },
  ];

  for (const c of bakeryCustomers) {
    await db.query(
      `INSERT INTO customers (id, business_unit_id, name, segment, address, pic, phone, latitude, longitude, area, status, last_visit_days_ago, total_orders, created_at, updated_at)
       VALUES ($1, 'bu-bakery', $2, $3, $4, $5, $6, $7, $8, 'Area Yogyakarta Selatan', $9, $10, $11, NOW(), NOW())`,
      [c.id, c.name, c.segment, c.address, c.pic, c.phone, c.lat, c.lng, c.status, c.lastDays, c.orders]
    );
  }

  const martCustomers = [
    { id: 'm-1', name: 'Warung Bu Karti', segment: 'Toko Kelontong', address: 'Jl. Kaliurang Km 8, Sleman', pic: 'Ibu Karti', phone: '0812-9988-1101', lat: -7.7185, lng: 110.4023, lastDays: 4, orders: 14, status: 'ACTIVE' },
    { id: 'm-2', name: 'Minimarket Sumber Rejeki', segment: 'Minimarket', address: 'Jl. Magelang Km 10, Sleman', pic: 'Pak Hasan', phone: '0813-9988-1102', lat: -7.6981, lng: 110.3699, lastDays: 15, orders: 8, status: 'AT_RISK' },
    { id: 'm-3', name: 'Toko Sembako Amanah', segment: 'Toko Kelontong', address: 'Jl. Palagan No. 30, Sleman', pic: 'Ibu Nur', phone: '0821-9988-1103', lat: -7.7402, lng: 110.3801, lastDays: 2, orders: 27, status: 'ACTIVE' },
    { id: 'm-4', name: 'Warung Kelontong Pak Kumis', segment: 'Toko Kelontong', address: 'Jl. Monjali No. 55, Sleman', pic: 'Pak Kumis', phone: '0822-9988-1104', lat: -7.7554, lng: 110.3688, lastDays: 7, orders: 19, status: 'ACTIVE' },
    { id: 'm-5', name: 'Minimarket Barokah Sleman', segment: 'Minimarket', address: 'Jl. Gejayan No. 42, Sleman', pic: 'Ibu Ratih', phone: '0823-9988-1105', lat: -7.7654, lng: 110.3912, lastDays: 1, orders: 35, status: 'ACTIVE' },
  ];

  for (const c of martCustomers) {
    await db.query(
      `INSERT INTO customers (id, business_unit_id, name, segment, address, pic, phone, latitude, longitude, area, status, last_visit_days_ago, total_orders, created_at, updated_at)
       VALUES ($1, 'bu-mart', $2, $3, $4, $5, $6, $7, $8, 'Area Sleman', $9, $10, $11, NOW(), NOW())`,
      [c.id, c.name, c.segment, c.address, c.pic, c.phone, c.lat, c.lng, c.status, c.lastDays, c.orders]
    );
  }

  // 6. Seed Monthly Sales Targets
  console.log('Seeding Sales Targets...');
  await db.query(`
    INSERT INTO monthly_sales_targets (id, user_id, period_label, target_amount, achieved_amount, start_date, end_date, created_at, updated_at)
    VALUES 
      ('t-andi', 'u-andi', '${currentMonthYear}', 100000000, 72400000, '${startOfMonth.toISOString()}', '${endOfMonth.toISOString()}', NOW(), NOW()),
      ('t-siti', 'u-siti', '${currentMonthYear}', 60000000, 21000000, '${startOfMonth.toISOString()}', '${endOfMonth.toISOString()}', NOW(), NOW()),
      ('t-rina', 'u-rina', '${currentMonthYear}', 75000000, 43500000, '${startOfMonth.toISOString()}', '${endOfMonth.toISOString()}', NOW(), NOW()),
      ('t-dedi', 'u-dedi', '${currentMonthYear}', 60000000, 24600000, '${startOfMonth.toISOString()}', '${endOfMonth.toISOString()}', NOW(), NOW()),
      ('t-budi', 'u-budi', '${currentMonthYear}', 0, 0, '${startOfMonth.toISOString()}', '${endOfMonth.toISOString()}', NOW(), NOW());
  `);

  // 7. Seed Today's Attendance
  console.log("Seeding Today's Attendance...");
  const todayKey = now.toDateString();
  const today8am = new Date(now);
  today8am.setHours(8, 5, 0, 0);

  const today815am = new Date(now);
  today815am.setHours(8, 15, 0, 0);

  const today820am = new Date(now);
  today820am.setHours(8, 20, 0, 0);

  // Andi: checked in on time
  await db.query(`
    INSERT INTO attendances (id, user_id, business_unit_id, date_key, status, check_in_time, check_out_time, latitude, longitude, gps_accuracy, is_late, notes, created_at, updated_at)
    VALUES 
      ('att-andi-today', 'u-andi', 'bu-bakery', '${todayKey}', 'ON_TIME', '${today8am.toISOString()}', NULL, -7.8253, 110.3650, 6, false, 'Check-in kantor area', NOW(), NOW()),
      ('att-rina-today', 'u-rina', 'bu-bakery', '${todayKey}', 'ON_TIME', '${today815am.toISOString()}', NULL, -7.8250, 110.3648, 8, false, 'Check-in kantor area', NOW(), NOW()),
      ('att-siti-today', 'u-siti', 'bu-mart', '${todayKey}', 'ON_TIME', '${today820am.toISOString()}', NULL, -7.7185, 110.4023, 7, false, 'Check-in kantor area', NOW(), NOW());
    -- Notice Dedi has NO attendance for today, satisfying scenario requirement!
  `);

  // Historical 7-day attendance for Andi
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dKey = d.toDateString();
    const cin = new Date(d);
    cin.setHours(8, 5 + (i % 10), 0, 0);
    const cout = new Date(d);
    cout.setHours(17, 2 + (i % 15), 0, 0);

    await db.query(`
      INSERT INTO attendances (id, user_id, business_unit_id, date_key, status, check_in_time, check_out_time, latitude, longitude, gps_accuracy, is_late, notes, created_at, updated_at)
      VALUES 
        ('att-andi-${i}', 'u-andi', 'bu-bakery', '${dKey}', 'COMPLETED', '${cin.toISOString()}', '${cout.toISOString()}', -7.8253, 110.3650, 5, false, 'Absensi harian', NOW(), NOW());
    `);
  }

  // 8. Seed Visits
  console.log('Seeding Visits...');
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yest930 = new Date(yesterday);
  yest930.setHours(9, 30, 0, 0);
  const yest1015 = new Date(yesterday);
  yest1015.setHours(10, 15, 0, 0);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDays1015 = new Date(twoDaysAgo);
  twoDays1015.setHours(10, 15, 0, 0);
  const twoDays1100 = new Date(twoDaysAgo);
  twoDays1100.setHours(11, 0, 0, 0);

  await db.query(`
    INSERT INTO visits (id, customer_id, user_id, business_unit_id, start_time, end_time, purpose, outcome, notes, has_photo, status, created_at, updated_at)
    VALUES 
      ('v-seed-1', 'c-6', 'u-andi', 'bu-bakery', '${yest930.toISOString()}', '${yest1015.toISOString()}', 'Presentasi Produk', 'Order Baru', 'Pak Slamet menambah stok donat mini dan roti sobek.', true, 'COMPLETED', NOW(), NOW()),
      ('v-seed-2', 'c-2', 'u-andi', 'bu-bakery', '${twoDays1015.toISOString()}', '${twoDays1100.toISOString()}', 'Pengecekan Stok', 'Feedback Positif', 'Display roti di minimarket rapi, rotasi baik.', false, 'COMPLETED', NOW(), NOW()),
      ('v-seed-3', 'c-1', 'u-andi', 'bu-bakery', '${new Date(now.getTime() - 12 * 86400000).toISOString()}', NULL, 'Follow-up Order', 'Order Baru', 'Order rutin mingguan', false, 'COMPLETED', NOW(), NOW()),
      ('v-seed-4', 'c-3', 'u-andi', 'bu-bakery', '${new Date(now.getTime() - 20 * 86400000).toISOString()}', NULL, 'Follow-up Order', 'Tidak Ada Transaksi', 'Cafe sepi wisatawan', false, 'COMPLETED', NOW(), NOW()),
      ('v-seed-5', 'm-3', 'u-siti', 'bu-mart', '${yesterday.toISOString()}', NULL, 'Pengecekan Stok', 'Order Baru', 'Restok beras dan minyak goreng', true, 'COMPLETED', NOW(), NOW());
  `);

  // 9. Seed Orders with realistic distribution and approval scenarios
  console.log('Seeding Orders & Approval Scenarios...');
  // Scenario A: Normal PO Submission (discount 0%, qty 10 <= 20) -> Status: SUBMITTED
  await db.query(`
    INSERT INTO orders (id, order_number, customer_id, user_id, business_unit_id, visit_id, subtotal, discount_pct, discount_amount, total, total_qty, requires_approval, status, created_at, updated_at)
    VALUES 
      ('ord-demo-norm', 'ORD-2026-001', 'c-1', 'u-andi', 'bu-bakery', NULL, 180000, 0, 0, 180000, 10, false, 'SUBMITTED', '${yest1015.toISOString()}', NOW()),
      ('ord-demo-disc', 'ORD-2026-002', 'c-2', 'u-andi', 'bu-bakery', NULL, 240000, 15, 36000, 204000, 12, true, 'PENDING_APPROVAL', '${now.toISOString()}', NOW()),
      ('ord-demo-qty', 'ORD-2026-003', 'c-6', 'u-andi', 'bu-bakery', 'v-seed-1', 450000, 5, 22500, 427500, 25, true, 'PENDING_APPROVAL', '${yest930.toISOString()}', NOW()),
      ('ord-demo-bound', 'ORD-2026-004', 'c-5', 'u-andi', 'bu-bakery', NULL, 360000, 10, 36000, 324000, 20, false, 'APPROVED', '${twoDays1015.toISOString()}', NOW()),
      ('ord-demo-rej', 'ORD-2026-005', 'c-3', 'u-andi', 'bu-bakery', NULL, 500000, 20, 100000, 400000, 25, true, 'REJECTED', '${new Date(now.getTime() - 4 * 86400000).toISOString()}', NOW()),
      ('ord-seed-hist1', 'ORD-2026-006', 'c-6', 'u-andi', 'bu-bakery', NULL, 12500000, 5, 625000, 11875000, 180, true, 'APPROVED', '${new Date(now.getTime() - 5 * 86400000).toISOString()}', NOW()),
      ('ord-seed-hist2', 'ORD-2026-007', 'c-2', 'u-andi', 'bu-bakery', NULL, 25000000, 5, 1250000, 23750000, 320, true, 'APPROVED', '${new Date(now.getTime() - 10 * 86400000).toISOString()}', NOW()),
      ('ord-seed-hist3', 'ORD-2026-008', 'c-5', 'u-andi', 'bu-bakery', NULL, 38000000, 5, 1900000, 36100000, 450, true, 'APPROVED', '${new Date(now.getTime() - 18 * 86400000).toISOString()}', NOW()),
      -- Mart orders for Siti
      ('ord-mart-1', 'ORD-MRT-001', 'm-3', 'u-siti', 'bu-mart', 'v-seed-5', 21000000, 0, 0, 21000000, 310, true, 'APPROVED', '${yesterday.toISOString()}', NOW());
  `);

  // Order items
  await db.query(`
    INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal, created_at)
    VALUES 
      ('oi-1', 'ord-demo-norm', 'p-2', 10, 18000, 180000, NOW()),
      ('oi-2', 'ord-demo-disc', 'p-4', 12, 20000, 240000, NOW()),
      ('oi-3', 'ord-demo-qty', 'p-2', 15, 18000, 270000, NOW()),
      ('oi-4', 'ord-demo-qty', 'p-4', 10, 18000, 180000, NOW()),
      ('oi-5', 'ord-demo-bound', 'p-2', 20, 18000, 360000, NOW()),
      ('oi-6', 'ord-demo-rej', 'p-3', 10, 45000, 450000, NOW()),
      ('oi-7', 'ord-seed-hist1', 'p-1', 180, 15000, 2700000, NOW()),
      ('oi-8', 'ord-mart-1', 'q-1', 300, 68000, 20400000, NOW());
  `);

  // Order Approvals
  await db.query(`
    INSERT INTO order_approvals (id, order_id, approver_user_id, role, action, notes, stage, created_at)
    VALUES 
      ('appr-1', 'ord-demo-bound', 'u-budi', 'SUPERVISOR', 'APPROVED', 'Diskon promo reguler disetujui', 'ASM', '${twoDays1015.toISOString()}'),
      ('appr-2', 'ord-demo-rej', 'u-budi', 'SUPERVISOR', 'REJECTED', 'Diskon melebihi batas ketentuan untuk customer at-risk', 'ASM', '${new Date(now.getTime() - 4 * 86400000).toISOString()}');
  `);

  // 10. Seed Agent Insights
  console.log('Seeding Agent Insights...');
  await db.query(`
    INSERT INTO agent_insights (id, business_unit_id, user_id, type, text, severity, source_data, is_read, created_at)
    VALUES 
      ('ins-1', 'bu-bakery', 'u-andi', 'TARGET', 'Achievement Anda saat ini 72%. Tersisa Rp 27,6 juta lagi untuk mencapai target bulan ini.', 'info', '{"target": 100000000, "achieved": 72400000}', false, NOW()),
      ('ins-2', 'bu-bakery', 'u-andi', 'VISIT', '4 customer belum dikunjungi dalam 14 hari terakhir, termasuk Cafe Kopi Senja dan Hotel Griya Persada.', 'warning', '{"overdueCustomers": ["c-3", "c-4", "c-7", "c-8"]}', false, NOW()),
      ('ins-3', 'bu-bakery', 'u-andi', 'RISK', 'Cafe Kopi Senja berisiko churn — frekuensi order menurun dalam 3 bulan terakhir.', 'danger', '{"customerId": "c-3", "daysSinceVisit": 20}', false, NOW()),
      ('ins-4', 'bu-bakery', 'u-andi', 'OPPORTUNITY', 'Toko Roti Barokah berpotensi repeat order besar berdasarkan histori pembelian rutin tiap minggu.', 'success', '{"customerId": "c-6", "repeatIntervalDays": 7}', false, NOW()),
      ('ins-5', 'bu-mart', 'u-siti', 'TARGET', 'Achievement Anda saat ini 35%. Masih ada waktu untuk mengejar target bulan ini.', 'info', '{"target": 60000000, "achieved": 21000000}', false, NOW()),
      ('ins-6', 'bu-mart', 'u-siti', 'RISK', 'Minimarket Sumber Rejeki belum dikunjungi selama 15 hari — pertimbangkan kunjungan prioritas.', 'warning', '{"customerId": "m-2"}', false, NOW()),
      ('ins-7', 'bu-bakery', 'u-budi', 'TEAM', 'Dedi Purnomo belum check-in hari ini, di atas jam 09:00.', 'warning', '{"userId": "u-dedi", "status": "BELUM_CHECK_IN"}', false, NOW()),
      ('ins-8', 'bu-bakery', 'u-budi', 'TEAM', 'Rata-rata pencapaian tim saat ini 57% dari target bulanan.', 'info', '{"teamAverage": 57}', false, NOW());
  `);

  // 11. Seed Notifications
  console.log('Seeding Notifications...');
  await db.query(`
    INSERT INTO notifications (id, user_id, title, message, is_read, link, created_at)
    VALUES 
      ('n-1', 'u-andi', 'Selamat datang', 'Selamat datang kembali, Andi Wijaya.', false, '/dashboard', NOW()),
      ('n-2', 'u-andi', 'Pengingat follow-up', '2 follow-up jatuh tempo hari ini.', false, '/customers', '${new Date(now.getTime() - 3600000).toISOString()}'),
      ('n-3', 'u-andi', 'Status Order Update', 'Order ORD-2026-004 telah disetujui oleh Supervisor.', true, '/orders', '${new Date(now.getTime() - 86400000).toISOString()}'),
      ('n-4', 'u-budi', 'Peringatan Absensi Tim', 'Dedi Purnomo belum check-in hari ini.', false, '/dashboard', NOW()),
      ('n-5', 'u-budi', 'Approval Dibutuhkan', '2 order baru menunggu approval Anda.', false, '/approvals', NOW()),
      ('n-6', 'u-siti', 'Selamat datang', 'Selamat datang kembali, Siti Rahma.', false, '/dashboard', NOW());
  `);

  // 12. Seed Follow-ups
  console.log('Seeding Follow-ups...');
  await db.query(`
    INSERT INTO follow_ups (id, user_id, customer_id, title, due_date, status, notes, created_at, updated_at)
    VALUES 
      ('fu-1', 'u-andi', 'c-3', 'Follow up reorder Cafe Kopi Senja', NOW(), 'PENDING', 'Tawarkan promo paket roti cafe', NOW(), NOW()),
      ('fu-2', 'u-andi', 'c-1', 'Follow up penawaran produk baru Toko Kue Melati', NOW(), 'PENDING', 'Sampel kue bolu pandan dan croissant', NOW(), NOW()),
      ('fu-3', 'u-andi', 'c-4', 'Konfirmasi jadwal meeting GM Hotel Griya Persada', '${new Date(now.getTime() + 86400000).toISOString()}', 'PENDING', 'Kontrak pasokan breakfast hotel', NOW(), NOW());
  `);

  // 13. Seed Audit Logs
  console.log('Seeding Audit Logs...');
  await db.query(`
    INSERT INTO audit_logs (id, business_unit_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
    VALUES 
      ('aud-1', 'bu-bakery', 'u-andi', 'CHECK_IN', 'ATTENDANCE', 'att-andi-today', '{"accuracy": 6, "area": "Yogyakarta Selatan"}', '${today8am.toISOString()}'),
      ('aud-2', 'bu-bakery', 'u-andi', 'VISIT_COMPLETED', 'VISIT', 'v-seed-1', '{"customerId": "c-6", "purpose": "Presentasi Produk"}', '${yest1015.toISOString()}'),
      ('aud-3', 'bu-bakery', 'u-andi', 'ORDER_CREATED', 'ORDER', 'ord-demo-qty', '{"orderNumber": "ORD-2026-003", "total": 427500}', '${yest1015.toISOString()}'),
      ('aud-4', 'bu-bakery', 'u-budi', 'ORDER_REJECTED', 'ORDER', 'ord-demo-rej', '{"reason": "Diskon melebihi batas ketentuan"}', '${new Date(now.getTime() - 4 * 86400000).toISOString()}');
  `);

  console.log('PostgreSQL database seed completed successfully with all demo scenarios ready!');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(async () => {
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seed failed:', err);
      await db.close();
      process.exit(1);
    });
}
