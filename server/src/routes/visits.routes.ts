import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.get('/active', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const result = await db.query(
      `SELECT v.*, c.name as customer_name
       FROM visits v
       JOIN customers c ON v.customer_id = c.id
       WHERE v.user_id = $1 AND v.status = 'IN_PROGRESS'
       ORDER BY v.start_time DESC LIMIT 1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const v = result.rows[0];
    res.json({
      success: true,
      data: {
        id: v.id,
        customerId: v.customer_id,
        customerName: v.customer_name,
        startTime: new Date(v.start_time).getTime(),
        hasPhoto: v.has_photo,
        purpose: v.purpose,
        outcome: v.outcome,
        notes: v.notes,
        status: v.status.toLowerCase(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/start', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'customerId is required' });
    }

    const visitId = `v-${Date.now()}`;
    const now = new Date();

    await db.query(
      `INSERT INTO visits (id, customer_id, user_id, business_unit_id, start_time, has_photo, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, 'IN_PROGRESS', NOW(), NOW())`,
      [visitId, customerId, user.id, user.businessUnitId, now.toISOString()]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, business_unit_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, 'VISIT_START', 'VISIT', $4, $5, NOW())`,
      [`aud-${Date.now()}`, user.businessUnitId, user.id, visitId, JSON.stringify({ customerId })]
    );

    res.json({
      success: true,
      data: {
        id: visitId,
        customerId,
        startTime: now.getTime(),
        hasPhoto: false,
        status: 'ongoing',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/end', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const { visitId, purpose, outcome, notes, hasPhoto = false } = req.body;

    if (!visitId || !purpose || !outcome) {
      return res.status(400).json({ success: false, error: 'visitId, purpose, and outcome are required' });
    }

    const now = new Date();

    const visitRes = await db.query(
      `UPDATE visits
       SET end_time = $1, purpose = $2, outcome = $3, notes = $4, has_photo = $5, status = 'COMPLETED', updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING customer_id, start_time`,
      [now.toISOString(), purpose, outcome, notes || '', hasPhoto, visitId, user.id]
    );

    if (visitRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Kunjungan tidak ditemukan' });
    }

    const { customer_id, start_time } = visitRes.rows[0];

    // Update customer last visit days ago to 0
    await db.query(
      `UPDATE customers SET last_visit_days_ago = 0, updated_at = NOW() WHERE id = $1`,
      [customer_id]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, business_unit_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, 'VISIT_COMPLETED', 'VISIT', $4, $5, NOW())`,
      [
        `aud-${Date.now()}`,
        user.businessUnitId,
        user.id,
        visitId,
        JSON.stringify({ purpose, outcome, durationMs: now.getTime() - new Date(start_time).getTime() }),
      ]
    );

    res.json({
      success: true,
      message: 'Data kunjungan berhasil disimpan',
      data: {
        id: visitId,
        purpose,
        outcome,
        notes,
        duration: now.getTime() - new Date(start_time).getTime(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
