import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const result = await db.query(
      `SELECT id, title, message, is_read, link, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    res.json({
      success: true,
      data: result.rows.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        read: n.is_read,
        link: n.link,
        timestamp: new Date(n.created_at).getTime(),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [user.id]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
