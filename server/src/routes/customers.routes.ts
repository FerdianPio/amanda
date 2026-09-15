import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

// List customers (enforces BU isolation)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const { q, segment } = req.query;

    let query = `
      SELECT id, name, segment, address, pic, phone, latitude, longitude, area, status,
             last_visit_days_ago, total_orders
      FROM customers
      WHERE business_unit_id = $1
    `;
    const params: any[] = [user.businessUnitId];

    if (q && typeof q === 'string' && q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(address) LIKE $${params.length})`;
    }

    if (segment && typeof segment === 'string' && segment !== 'Semua') {
      params.push(segment);
      query += ` AND segment = $${params.length}`;
    }

    query += ` ORDER BY name ASC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map((c) => ({
        id: c.id,
        name: c.name,
        segment: c.segment,
        address: c.address,
        pic: c.pic,
        phone: c.phone,
        lat: Number(c.latitude),
        lng: Number(c.longitude),
        area: c.area,
        status: c.status.toLowerCase(),
        lastVisitDaysAgo: c.last_visit_days_ago,
        totalOrders: c.total_orders,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Customer Detail
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const custRes = await db.query(
      `SELECT * FROM customers WHERE id = $1 AND business_unit_id = $2`,
      [id, user.businessUnitId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer tidak ditemukan' });
    }

    const c = custRes.rows[0];

    // Customer visits
    const visitsRes = await db.query(
      `SELECT id, purpose, outcome, notes, has_photo, status, start_time, end_time
       FROM visits
       WHERE customer_id = $1
       ORDER BY start_time DESC`,
      [id]
    );

    // Customer orders
    const ordersRes = await db.query(
      `SELECT id, order_number, total, status, requires_approval, created_at
       FROM orders
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        id: c.id,
        name: c.name,
        segment: c.segment,
        address: c.address,
        pic: c.pic,
        phone: c.phone,
        lat: Number(c.latitude),
        lng: Number(c.longitude),
        area: c.area,
        status: c.status.toLowerCase(),
        lastVisitDaysAgo: c.last_visit_days_ago,
        totalOrders: c.total_orders,
        visits: visitsRes.rows.map((v) => ({
          id: v.id,
          purpose: v.purpose,
          outcome: v.outcome,
          notes: v.notes,
          hasPhoto: v.has_photo,
          status: v.status.toLowerCase(),
          startTime: new Date(v.start_time).getTime(),
          endTime: v.end_time ? new Date(v.end_time).getTime() : null,
        })),
        orders: ordersRes.rows.map((o) => ({
          id: o.id,
          orderNumber: o.order_number,
          total: Number(o.total),
          status: o.status.toLowerCase(),
          needsApproval: o.requires_approval,
          createdAt: new Date(o.created_at).getTime(),
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
