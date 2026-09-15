import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const result = await db.query(
      `SELECT id, name, unit, price, sku
       FROM products
       WHERE business_unit_id = $1 AND active = true
       ORDER BY name ASC`,
      [user.businessUnitId]
    );

    res.json({
      success: true,
      data: result.rows.map((p) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        price: Number(p.price),
        sku: p.sku,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
