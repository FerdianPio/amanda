import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const activities: { id: string; type: string; description: string; timestamp: number }[] = [];

    // 1. Attendance records
    const attRes = await db.query(
      `SELECT id, check_in_time, check_out_time, is_late, notes
       FROM attendances
       WHERE user_id = $1
       ORDER BY check_in_time DESC LIMIT 20`,
      [user.id]
    );

    for (const att of attRes.rows) {
      if (att.check_in_time) {
        activities.push({
          id: `act-cin-${att.id}`,
          type: 'checkin',
          description: att.is_late ? 'Check-in di kantor (terlambat)' : 'Check-in di kantor',
          timestamp: new Date(att.check_in_time).getTime(),
        });
      }
      if (att.check_out_time) {
        activities.push({
          id: `act-cout-${att.id}`,
          type: 'checkout',
          description: 'Check-out dari kantor',
          timestamp: new Date(att.check_out_time).getTime(),
        });
      }
    }

    // 2. Visits
    const visitsRes = await db.query(
      `SELECT v.id, v.start_time, v.end_time, v.purpose, v.outcome, c.name as customer_name
       FROM visits v
       JOIN customers c ON v.customer_id = c.id
       WHERE v.user_id = $1
       ORDER BY v.start_time DESC LIMIT 20`,
      [user.id]
    );

    for (const v of visitsRes.rows) {
      activities.push({
        id: `act-v-${v.id}`,
        type: 'visit',
        description: `Kunjungan ke ${v.customer_name}${v.outcome ? ` (${v.outcome})` : ''}`,
        timestamp: new Date(v.start_time).getTime(),
      });
    }

    // 3. Orders
    const ordersRes = await db.query(
      `SELECT o.id, o.order_number, o.total, o.created_at, c.name as customer_name
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC LIMIT 20`,
      [user.id]
    );

    for (const o of ordersRes.rows) {
      activities.push({
        id: `act-o-${o.id}`,
        type: 'order',
        description: `Order baru dari ${o.customer_name}`,
        timestamp: new Date(o.created_at).getTime(),
      });
    }

    // Sort descending by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      data: activities,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
