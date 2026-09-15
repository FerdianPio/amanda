import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const targetRes = await db.query(
      `SELECT * FROM monthly_sales_targets WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );

    let targetAmount = 0;
    let periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    if (targetRes.rows.length > 0) {
      targetAmount = Number(targetRes.rows[0].target_amount);
      periodLabel = targetRes.rows[0].period_label;
    }

    // Get all orders for this user in the current month
    const ordersRes = await db.query(
      `SELECT total, created_at FROM orders
       WHERE user_id = $1
         AND status IN ('APPROVED', 'SUBMITTED', 'PENDING_APPROVAL', 'DELIVERED')
         AND created_at >= $2 AND created_at <= $3
       ORDER BY created_at ASC`,
      [user.id, startOfMonth.toISOString(), endOfMonth.toISOString()]
    );

    let achievedAmount = 0;
    // Calculate 4 weekly buckets
    const weekTotals = [0, 0, 0, 0];

    for (const order of ordersRes.rows) {
      const amt = Number(order.total);
      achievedAmount += amt;

      const orderDate = new Date(order.created_at);
      const dayOfMonth = orderDate.getDate();

      if (dayOfMonth <= 7) {
        weekTotals[0] += amt;
      } else if (dayOfMonth <= 14) {
        weekTotals[1] += amt;
      } else if (dayOfMonth <= 21) {
        weekTotals[2] += amt;
      } else {
        weekTotals[3] += amt;
      }
    }

    const achievementPct = targetAmount > 0 ? Math.min(100, Math.round((achievedAmount / targetAmount) * 100)) : 0;
    const remaining = Math.max(0, targetAmount - achievedAmount);

    // Cumulative percentages for the 4 weeks
    let cum = 0;
    const weeklyProgression = weekTotals.map((w) => {
      cum += w;
      return targetAmount > 0 ? Math.min(100, Math.round((cum / targetAmount) * 100)) : 0;
    });

    res.json({
      success: true,
      data: {
        periodLabel,
        targetAmount,
        achievedAmount,
        achievementPct,
        remaining,
        weeklyProgression: [
          weeklyProgression[0] || Math.round(achievementPct * 0.3),
          weeklyProgression[1] || Math.round(achievementPct * 0.55),
          weeklyProgression[2] || Math.round(achievementPct * 0.8),
          achievementPct,
        ],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
