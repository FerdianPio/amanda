import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM business_units ORDER BY name ASC`);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/theme', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM business_unit_themes WHERE business_unit_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Theme not found' });
    }

    const t = result.rows[0];
    res.json({
      success: true,
      data: {
        id: t.id,
        businessUnitId: t.business_unit_id,
        primaryColor: t.primary_color,
        primaryDarkColor: t.primary_dark_color,
        accent: t.accent_color,
        accentSoft: t.accent_soft_color,
        backgroundColor: t.background_color,
        surfaceColor: t.surface_color,
        surfaceSunkenColor: t.surface_sunken_color,
        textPrimaryColor: t.text_primary_color,
        textMutedColor: t.text_muted_color,
        textFaintColor: t.text_faint_color,
        borderColor: t.border_color,
        initials: t.initials,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Theme in database (Scenario 8: Business Unit Branding)
router.put('/:id/theme', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { accentColor, accentSoftColor, primaryColor } = req.body;

    const existing = await db.query(
      `SELECT id FROM business_unit_themes WHERE business_unit_id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Theme not found' });
    }

    await db.query(
      `UPDATE business_unit_themes
       SET accent_color = COALESCE($1, accent_color),
           accent_soft_color = COALESCE($2, accent_soft_color),
           primary_color = COALESCE($3, primary_color),
           updated_at = NOW()
       WHERE business_unit_id = $4`,
      [accentColor, accentSoftColor, primaryColor, id]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, business_unit_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, 'THEME_UPDATED', 'BUSINESS_UNIT_THEME', $4, $5, NOW())`,
      [
        `aud-${Date.now()}`,
        id,
        req.user?.id || null,
        existing.rows[0].id,
        JSON.stringify({ accentColor, primaryColor }),
      ]
    );

    res.json({ success: true, message: 'Theme branding updated in PostgreSQL' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
