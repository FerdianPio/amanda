import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/src/db/db.ts';
import { seedDatabase } from './prisma/seed.ts';

import authRoutes from './server/src/routes/auth.routes.ts';
import dashboardRoutes from './server/src/routes/dashboard.routes.ts';
import customerRoutes from './server/src/routes/customers.routes.ts';
import productRoutes from './server/src/routes/products.routes.ts';
import attendanceRoutes from './server/src/routes/attendance.routes.ts';
import visitRoutes from './server/src/routes/visits.routes.ts';
import orderRoutes from './server/src/routes/orders.routes.ts';
import targetRoutes from './server/src/routes/targets.routes.ts';
import insightRoutes from './server/src/routes/insights.routes.ts';
import notificationRoutes from './server/src/routes/notifications.routes.ts';
import activityRoutes from './server/src/routes/activity.routes.ts';
import businessUnitRoutes from './server/src/routes/businessUnits.routes.ts';
import devRoutes from './server/src/routes/dev.routes.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize database and verify seed
  try {
    await db.init();
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    if (Number(usersCount.rows[0]?.count || 0) === 0) {
      console.log('Database empty, seeding demo data...');
      await seedDatabase();
    }
  } catch (err: any) {
    console.error('Database startup initialization error:', err.message);
  }

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/visits', visitRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/targets', targetRoutes);
  app.use('/api/insights', insightRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/activity-feed', activityRoutes);
  app.use('/api/business-units', businessUnitRoutes);
  app.use('/api/dev', devRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Amanda Group SFA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
