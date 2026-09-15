import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.get('/today', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const todayKey = new Date().toDateString();

    const result = await db.query(
      `SELECT * FROM attendances WHERE user_id = $1 AND date_key = $2`,
      [user.id, todayKey]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const att = result.rows[0];
    res.json({
      success: true,
      data: {
        id: att.id,
        status: att.status.toLowerCase(),
        checkInTime: att.check_in_time ? new Date(att.check_in_time).getTime() : null,
        checkOutTime: att.check_out_time ? new Date(att.check_out_time).getTime() : null,
        accuracy: att.gps_accuracy,
        late: att.is_late,
        notes: att.notes,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/check-in', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const { accuracy = 6, latitude = -7.8253, longitude = 110.3650 } = req.body;
    const now = new Date();
    const todayKey = now.toDateString();

    // Check if already checked in today
    const existing = await db.query(
      `SELECT * FROM attendances WHERE user_id = $1 AND date_key = $2`,
      [user.id, todayKey]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Anda sudah melakukan check-in hari ini' });
    }

    const officeOpenHour = 9;
    const isLate = now.getHours() > officeOpenHour || (now.getHours() === officeOpenHour && now.getMinutes() > 0);
    const attId = `att-${Date.now()}`;

    await db.query(
      `INSERT INTO attendances (id, user_id, business_unit_id, date_key, status, check_in_time, latitude, longitude, gps_accuracy, is_late, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        attId,
        user.id,
        user.businessUnitId,
        todayKey,
        isLate ? 'LATE' : 'ON_TIME',
        now.toISOString(),
        latitude,
        longitude,
        accuracy,
        isLate,
        isLate ? 'Check-in (terlambat)' : 'Check-in kantor area',
      ]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, business_unit_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, 'CHECK_IN', 'ATTENDANCE', $4, $5, NOW())`,
      [
        `aud-${Date.now()}`,
        user.businessUnitId,
        user.id,
        attId,
        JSON.stringify({ accuracy, isLate, time: now.toISOString() }),
      ]
    );

    res.json({
      success: true,
      message: 'Check-in berhasil dicatat',
      data: {
        id: attId,
        status: isLate ? 'late' : 'on_time',
        checkInTime: now.getTime(),
        accuracy,
        late: isLate,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/check-out', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const now = new Date();
    const todayKey = now.toDateString();

    const existing = await db.query(
      `SELECT * FROM attendances WHERE user_id = $1 AND date_key = $2`,
      [user.id, todayKey]
    );

    if (existing.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Belum ada data check-in hari ini' });
    }

    const att = existing.rows[0];
    if (att.check_out_time) {
      return res.status(400).json({ success: false, error: 'Anda sudah melakukan check-out hari ini' });
    }

    await db.query(
      `UPDATE attendances
       SET check_out_time = $1, status = 'COMPLETED', updated_at = NOW()
       WHERE id = $2`,
      [now.toISOString(), att.id]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, business_unit_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, 'CHECK_OUT', 'ATTENDANCE', $4, $5, NOW())`,
      [
        `aud-${Date.now()}`,
        user.businessUnitId,
        user.id,
        att.id,
        JSON.stringify({ checkOutTime: now.toISOString() }),
      ]
    );

    res.json({
      success: true,
      message: 'Check-out berhasil dicatat',
      data: {
        id: att.id,
        status: 'completed',
        checkInTime: new Date(att.check_in_time).getTime(),
        checkOutTime: now.getTime(),
        accuracy: att.gps_accuracy,
        late: att.is_late,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
