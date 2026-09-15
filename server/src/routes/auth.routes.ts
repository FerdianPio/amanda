import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/db.ts';
import { generateToken, authMiddleware } from '../middleware/auth.ts';

const router = Router();

// List demo accounts for quick switcher on login screen
router.get('/demo-accounts', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.name, u.role, u.business_unit_id, u.area, u.initials,
             b.name as business_unit_name,
             t.accent_color, t.accent_soft_color
      FROM users u
      JOIN business_units b ON u.business_unit_id = b.id
      LEFT JOIN business_unit_themes t ON b.id = t.business_unit_id
      WHERE u.active = true
      ORDER BY u.role DESC, u.name ASC
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role.toLowerCase(),
        businessUnitId: row.business_unit_id,
        businessUnitName: row.business_unit_name,
        area: row.area,
        initials: row.initials,
        accent: row.accent_color || '#0D6E63',
        accentSoft: row.accent_soft_color || '#E4E9F5',
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, userId, password } = req.body;

    let userQuery;
    let params: any[];

    if (userId) {
      userQuery = `SELECT * FROM users WHERE id = $1 AND active = true`;
      params = [userId];
    } else if (email) {
      userQuery = `SELECT * FROM users WHERE email = $1 AND active = true`;
      params = [email];
    } else {
      return res.status(400).json({ success: false, error: 'Email or userId is required' });
    }

    const userRes = await db.query(userQuery, params);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User tidak ditemukan atau non-aktif' });
    }

    const user = userRes.rows[0];

    // If password provided and not a direct demo switch, verify bcrypt password
    if (password && !userId) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Password salah' });
      }
    }

    // Get Business Unit and Theme
    const buRes = await db.query(`SELECT * FROM business_units WHERE id = $1`, [user.business_unit_id]);
    const themeRes = await db.query(`SELECT * FROM business_unit_themes WHERE business_unit_id = $1`, [user.business_unit_id]);

    const bu = buRes.rows[0];
    const theme = themeRes.rows[0] || {};

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase(),
      businessUnitId: user.business_unit_id,
      area: user.area,
      initials: user.initials,
    };

    const token = generateToken(authUser);

    // Audit log
    await db.query(`
      INSERT INTO audit_logs (id, business_unit_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
      VALUES ($1, $2, $3, 'LOGIN', 'USER', $4, '{"source": "web_mobile_sfa"}', NOW())
    `, [`aud-${Date.now()}`, user.business_unit_id, user.id, user.id]);

    res.json({
      success: true,
      data: {
        token,
        user: authUser,
        businessUnit: {
          id: bu.id,
          code: bu.code,
          name: bu.name,
        },
        theme: {
          primaryColor: theme.primary_color || '#0D6E63',
          primaryDarkColor: theme.primary_dark_color || '#094C44',
          accent: theme.accent_color || '#C97A3A',
          accentSoft: theme.accent_soft_color || '#F5E7DA',
          backgroundColor: theme.background_color || '#F1F4F3',
          surfaceColor: theme.surface_color || '#FFFFFF',
          surfaceSunkenColor: theme.surface_sunken_color || '#E9EEEC',
          textPrimaryColor: theme.text_primary_color || '#15221D',
          textMutedColor: theme.text_muted_color || '#5C6B65',
          textFaintColor: theme.text_faint_color || '#8B978F',
          borderColor: theme.border_color || '#DCE4E1',
          initials: theme.initials || 'AG',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query(`SELECT * FROM users WHERE id = $1`, [req.user!.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    const user = userRes.rows[0];
    const buRes = await db.query(`SELECT * FROM business_units WHERE id = $1`, [user.business_unit_id]);
    const themeRes = await db.query(`SELECT * FROM business_unit_themes WHERE business_unit_id = $1`, [user.business_unit_id]);

    const bu = buRes.rows[0];
    const theme = themeRes.rows[0] || {};

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.toLowerCase(),
          businessUnitId: user.business_unit_id,
          area: user.area,
          initials: user.initials,
        },
        businessUnit: {
          id: bu.id,
          code: bu.code,
          name: bu.name,
        },
        theme: {
          primaryColor: theme.primary_color || '#0D6E63',
          primaryDarkColor: theme.primary_dark_color || '#094C44',
          accent: theme.accent_color || '#C97A3A',
          accentSoft: theme.accent_soft_color || '#F5E7DA',
          backgroundColor: theme.background_color || '#F1F4F3',
          surfaceColor: theme.surface_color || '#FFFFFF',
          surfaceSunkenColor: theme.surface_sunken_color || '#E9EEEC',
          textPrimaryColor: theme.text_primary_color || '#15221D',
          textMutedColor: theme.text_muted_color || '#5C6B65',
          textFaintColor: theme.text_faint_color || '#8B978F',
          borderColor: theme.border_color || '#DCE4E1',
          initials: theme.initials || 'AG',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
