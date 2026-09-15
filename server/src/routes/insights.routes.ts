import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const result = await db.query(
      `SELECT id, type, text, severity, source_data, is_read, created_at
       FROM agent_insights
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        type: row.type.toLowerCase(),
        text: row.text,
        severity: row.severity,
        sourceData: row.source_data,
        isRead: row.is_read,
        createdAt: new Date(row.created_at).getTime(),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
