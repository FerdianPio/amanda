import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const now = new Date();
    const todayKey = now.toDateString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // 1. Target and Achievement Calculation (from real orders)
    const targetRes = await db.query(
      `SELECT * FROM monthly_sales_targets WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );

    let targetAmount = 0;
    let periodLabel = 'Bulan Ini';
    if (targetRes.rows.length > 0) {
      targetAmount = Number(targetRes.rows[0].target_amount);
      periodLabel = targetRes.rows[0].period_label;
    }

    // Calculate actual achieved amount from approved/submitted orders in this month
    const ordersSumRes = await db.query(
      `SELECT COALESCE(SUM(total), 0) as achieved_sum
       FROM orders
       WHERE user_id = $1
         AND status IN ('APPROVED', 'SUBMITTED', 'PENDING_APPROVAL', 'DELIVERED')
         AND created_at >= $2 AND created_at <= $3`,
      [user.id, startOfMonth, endOfMonth]
    );

    const achievedAmount = Number(ordersSumRes.rows[0]?.achieved_sum || 0);
    const achievementPct = targetAmount > 0 ? Math.min(100, Math.round((achievedAmount / targetAmount) * 100)) : 0;

    // 2. Today's Attendance
    const attendanceRes = await db.query(
      `SELECT * FROM attendances WHERE user_id = $1 AND date_key = $2`,
      [user.id, todayKey]
    );
    const attendance = attendanceRes.rows[0] || null;

    // 3. Mini Stats
    // Customer count for user's BU
    const custCountRes = await db.query(
      `SELECT COUNT(*) as count FROM customers WHERE business_unit_id = $1`,
      [user.businessUnitId]
    );
    const customerCount = Number(custCountRes.rows[0]?.count || 0);

    // Today's visits
    const visitsCountRes = await db.query(
      `SELECT COUNT(*) as count FROM visits
       WHERE user_id = $1 AND start_time >= $2 AND start_time <= $3`,
      [user.id, startOfDay, endOfDay]
    );
    const todaysVisits = Number(visitsCountRes.rows[0]?.count || 0);

    // Today's orders
    const ordersCountRes = await db.query(
      `SELECT COUNT(*) as count FROM orders
       WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [user.id, startOfDay, endOfDay]
    );
    const todaysOrders = Number(ordersCountRes.rows[0]?.count || 0);

    // Follow-ups pending
    const followUpsCountRes = await db.query(
      `SELECT COUNT(*) as count FROM follow_ups
       WHERE user_id = $1 AND status = 'PENDING'`,
      [user.id]
    );
    const followUpsCount = Number(followUpsCountRes.rows[0]?.count || 0);

    // 4. Priority Customers (top 3 by longest days since last visit)
    const priorityCustRes = await db.query(
      `SELECT id, name, segment, address, last_visit_days_ago, status
       FROM customers
       WHERE business_unit_id = $1
       ORDER BY last_visit_days_ago DESC, total_orders DESC
       LIMIT 3`,
      [user.businessUnitId]
    );

    // 5. Agent Insights (top insights for user)
    const insightsRes = await db.query(
      `SELECT id, type, text, severity FROM agent_insights
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 4`,
      [user.id]
    );

    // 6. Supervisor Team Overview (if role is supervisor or admin)
    let teamOverview: any[] = [];
    if (user.role === 'supervisor' || user.role === 'admin') {
      const teamMembersRes = await db.query(
        `SELECT u.id, u.name, u.role
         FROM users u
         WHERE u.business_unit_id = $1 AND u.role = 'SALES'
         ORDER BY u.name ASC`,
        [user.businessUnitId]
      );

      for (const member of teamMembersRes.rows) {
        // Attendance today
        const memberAttRes = await db.query(
          `SELECT status FROM attendances WHERE user_id = $1 AND date_key = $2`,
          [member.id, todayKey]
        );
        const hasCheckedIn = memberAttRes.rows.length > 0 && memberAttRes.rows[0].status !== 'OUTSIDE_GEOFENCE';

        // Target & sales achievement
        const memTargetRes = await db.query(
          `SELECT target_amount FROM monthly_sales_targets WHERE user_id = $1`,
          [member.id]
        );
        const memTarget = Number(memTargetRes.rows[0]?.target_amount || 0);

        const memOrdersRes = await db.query(
          `SELECT COALESCE(SUM(total), 0) as total FROM orders
           WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3`,
          [member.id, startOfMonth, endOfMonth]
        );
        const memAchieved = Number(memOrdersRes.rows[0]?.total || 0);
        const memPct = memTarget > 0 ? Math.min(100, Math.round((memAchieved / memTarget) * 100)) : 0;

        teamOverview.push({
          id: member.id,
          name: member.name,
          achievementPct: memPct,
          status: hasCheckedIn ? 'Sudah Check-In' : 'Belum Check-In',
        });
      }
    }

    res.json({
      success: true,
      data: {
        target: {
          periodLabel,
          targetAmount,
          achievedAmount,
          achievementPct,
        },
        attendance: attendance
          ? {
              status: attendance.status.toLowerCase(),
              checkInTime: attendance.check_in_time ? new Date(attendance.check_in_time).getTime() : null,
              checkOutTime: attendance.check_out_time ? new Date(attendance.check_out_time).getTime() : null,
              late: attendance.is_late,
              accuracy: attendance.gps_accuracy,
            }
          : null,
        stats: {
          customerCount,
          todaysVisits,
          todaysOrders,
          followUpsCount,
        },
        priorityCustomers: priorityCustRes.rows.map((c) => ({
          id: c.id,
          name: c.name,
          segment: c.segment,
          address: c.address,
          lastVisitDaysAgo: c.last_visit_days_ago,
          status: c.status.toLowerCase(),
        })),
        insights: insightsRes.rows.map((ins) => ({
          id: ins.id,
          type: ins.type.toLowerCase(),
          text: ins.text,
          severity: ins.severity,
        })),
        teamOverview,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Multi-BU Web Executive Dashboard
router.get('/admin-overview', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const todayKey = now.toDateString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // 1. Business Units with performance metrics
    const busRes = await db.query(`
      SELECT b.id, b.code, b.name, b.description,
             t.accent_color, t.accent_soft_color, t.primary_color,
             (SELECT COUNT(*) FROM users u WHERE u.business_unit_id = b.id AND u.role = 'SALES') as sales_count,
             (SELECT COUNT(*) FROM customers c WHERE c.business_unit_id = b.id) as customer_count,
             (SELECT COALESCE(SUM(o.total), 0) FROM orders o 
              WHERE o.business_unit_id = b.id 
                AND o.status IN ('APPROVED', 'SUBMITTED', 'DELIVERED', 'PROCESSING')
                AND o.created_at >= $1 AND o.created_at <= $2) as month_revenue,
             (SELECT COUNT(*) FROM orders o 
              WHERE o.business_unit_id = b.id 
                AND o.created_at >= $1 AND o.created_at <= $2) as month_orders_count,
             (SELECT COALESCE(SUM(mst.target_amount), 0) FROM monthly_sales_targets mst
              JOIN users u ON mst.user_id = u.id
              WHERE u.business_unit_id = b.id) as total_target
      FROM business_units b
      LEFT JOIN business_unit_themes t ON b.id = t.business_unit_id
      ORDER BY b.name ASC
    `, [startOfMonth, endOfMonth]);

    const businessUnits = busRes.rows.map((bu) => {
      const revenue = Number(bu.month_revenue);
      const target = Number(bu.total_target);
      const achievementPct = target > 0 ? Math.min(100, Math.round((revenue / target) * 100)) : 0;
      return {
        id: bu.id,
        code: bu.code,
        name: bu.name,
        description: bu.description,
        accent: bu.accent_color || '#C97A3A',
        accentSoft: bu.accent_soft_color || '#F5E7DA',
        primaryColor: bu.primary_color || '#0D6E63',
        salesCount: Number(bu.sales_count),
        customerCount: Number(bu.customer_count),
        monthRevenue: revenue,
        monthOrdersCount: Number(bu.month_orders_count),
        totalTarget: target,
        achievementPct,
      };
    });

    // 2. Sales Team Roster & Live Status Today
    const teamRes = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.area, u.initials, u.business_unit_id,
             b.name as business_unit_name,
             att.status as attendance_status,
             att.check_in_time,
             att.check_out_time,
             att.is_late,
             att.gps_accuracy,
             mst.target_amount,
             (SELECT COUNT(*) FROM visits v 
              WHERE v.user_id = u.id AND v.start_time >= $1 AND v.start_time <= $2) as todays_visits,
             (SELECT COUNT(*) FROM orders o 
              WHERE o.user_id = u.id AND o.created_at >= $1 AND o.created_at <= $2) as todays_orders,
             (SELECT COALESCE(SUM(o.total), 0) FROM orders o 
              WHERE o.user_id = u.id 
                AND o.status IN ('APPROVED', 'SUBMITTED', 'DELIVERED', 'PROCESSING')
                AND o.created_at >= $3 AND o.created_at <= $4) as month_achieved
      FROM users u
      JOIN business_units b ON u.business_unit_id = b.id
      LEFT JOIN attendances att ON u.id = att.user_id AND att.date_key = $5
      LEFT JOIN monthly_sales_targets mst ON u.id = mst.user_id
      WHERE u.active = true AND u.role IN ('SALES', 'SUPERVISOR')
      ORDER BY u.role DESC, u.name ASC
    `, [startOfDay, endOfDay, startOfMonth, endOfMonth, todayKey]);

    const salesTeam = teamRes.rows.map((m) => {
      const target = Number(m.target_amount || 0);
      const achieved = Number(m.month_achieved || 0);
      const achievementPct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role.toLowerCase(),
        area: m.area,
        initials: m.initials,
        businessUnitId: m.business_unit_id,
        businessUnitName: m.business_unit_name,
        attendanceStatus: m.attendance_status ? m.attendance_status.toLowerCase() : 'not_checked_in',
        checkInTime: m.check_in_time ? new Date(m.check_in_time).getTime() : null,
        checkOutTime: m.check_out_time ? new Date(m.check_out_time).getTime() : null,
        isLate: !!m.is_late,
        todaysVisits: Number(m.todays_visits),
        todaysOrders: Number(m.todays_orders),
        targetAmount: target,
        achievedAmount: achieved,
        achievementPct,
      };
    });

    // 3. Pending Approvals
    const approvalsRes = await db.query(`
      SELECT o.id, o.order_number, o.total, o.total_qty, o.discount_pct, o.discount_amount,
             o.approval_reason, o.created_at,
             c.name as customer_name, c.area as customer_area,
             u.name as sales_name,
             b.name as business_unit_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN users u ON o.user_id = u.id
      JOIN business_units b ON o.business_unit_id = b.id
      WHERE o.status = 'PENDING_APPROVAL' OR o.requires_approval = true
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // 4. Global KPIs
    const totalRev = businessUnits.reduce((acc, bu) => acc + bu.monthRevenue, 0);
    const totalTarget = businessUnits.reduce((acc, bu) => acc + bu.totalTarget, 0);
    const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalRev / totalTarget) * 100)) : 0;
    const totalCustomers = businessUnits.reduce((acc, bu) => acc + bu.customerCount, 0);
    const totalOrders = businessUnits.reduce((acc, bu) => acc + bu.monthOrdersCount, 0);
    const activeSalesCount = salesTeam.filter((s) => s.role === 'sales').length;
    const checkedInTodayCount = salesTeam.filter((s) => s.attendanceStatus !== 'not_checked_in').length;

    // 5. Recent System Activity
    const recentActivityRes = await db.query(`
      SELECT al.id, al.action, al.entity_type, al.created_at,
             COALESCE(u.name, 'Admin') as user_name, COALESCE(u.initials, 'AD') as initials,
             COALESCE(b.name, 'Amanda Group') as business_unit_name,
             al.metadata
      FROM audit_logs al
      LEFT JOIN users u ON al.actor_user_id = u.id
      LEFT JOIN business_units b ON al.business_unit_id = b.id
      ORDER BY al.created_at DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRev,
          totalTarget,
          overallPct,
          totalCustomers,
          totalOrders,
          activeSalesCount,
          checkedInTodayCount,
          pendingApprovalsCount: approvalsRes.rows.length,
        },
        businessUnits,
        salesTeam,
        pendingApprovals: approvalsRes.rows.map((a) => ({
          id: a.id,
          orderNumber: a.order_number,
          total: Number(a.total),
          totalQty: Number(a.total_qty),
          discountPct: Number(a.discount_pct),
          discountAmount: Number(a.discount_amount),
          approvalReason: a.approval_reason,
          customerName: a.customer_name,
          customerArea: a.customer_area,
          salesName: a.sales_name,
          businessUnitName: a.business_unit_name,
          createdAt: new Date(a.created_at).getTime(),
        })),
        recentActivity: recentActivityRes.rows.map((act) => {
          let details = `${act.action} pada ${act.entity_type}`;
          if (act.metadata && typeof act.metadata === 'object') {
            details = (act.metadata as any).details || details;
          }
          return {
            id: act.id,
            action: act.action,
            details,
            userName: act.user_name,
            userInitials: act.initials,
            businessUnitName: act.business_unit_name,
            createdAt: new Date(act.created_at).getTime(),
          };
        }),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
