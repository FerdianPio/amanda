import { Router } from 'express';
import { db } from '../db/db.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';

const router = Router();

// List orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const { status, customerId } = req.query;

    let query = `
      SELECT o.*, c.name as customer_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.business_unit_id = $1
    `;
    const params: any[] = [user.businessUnitId];

    if (user.role === 'sales') {
      params.push(user.id);
      query += ` AND o.user_id = $${params.length}`;
    }

    if (status && typeof status === 'string') {
      params.push(status.toUpperCase());
      query += ` AND o.status = $${params.length}`;
    }

    if (customerId && typeof customerId === 'string') {
      params.push(customerId);
      query += ` AND o.customer_id = $${params.length}`;
    }

    query += ` ORDER BY o.created_at DESC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerId: o.customer_id,
        customerName: o.customer_name,
        userId: o.user_id,
        subtotal: Number(o.subtotal),
        discountPct: Number(o.discount_pct),
        discountAmount: Number(o.discount_amount),
        total: Number(o.total),
        totalQty: o.total_qty,
        needsApproval: o.requires_approval,
        status: o.status.toLowerCase(),
        approvalReason: o.approval_reason,
        createdAt: new Date(o.created_at).getTime(),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Order (with transaction and approval rules)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const { customerId, items, discountPct = 0, visitId } = req.body;

    if (!customerId || !items || typeof items !== 'object') {
      return res.status(400).json({ success: false, error: 'customerId and items are required' });
    }

    // Verify customer exists in user's BU
    const custRes = await db.query(
      `SELECT id, name FROM customers WHERE id = $1 AND business_unit_id = $2`,
      [customerId, user.businessUnitId]
    );
    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer tidak ditemukan' });
    }
    const customer = custRes.rows[0];

    // Compute quantities and prices from database
    const productIds = Object.keys(items);
    if (productIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Order harus memiliki minimal 1 item' });
    }

    let subtotal = 0;
    let totalQty = 0;
    const itemRecords: { productId: string; quantity: number; unitPrice: number; subtotal: number }[] = [];

    for (const pid of productIds) {
      const qty = Math.max(0, parseInt(items[pid], 10) || 0);
      if (qty <= 0) continue;

      const prodRes = await db.query(
        `SELECT id, price FROM products WHERE id = $1 AND business_unit_id = $2 AND active = true`,
        [pid, user.businessUnitId]
      );
      if (prodRes.rows.length === 0) continue;

      const unitPrice = Number(prodRes.rows[0].price);
      const itemSubtotal = qty * unitPrice;
      subtotal += itemSubtotal;
      totalQty += qty;

      itemRecords.push({
        productId: pid,
        quantity: qty,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    if (totalQty === 0) {
      return res.status(400).json({ success: false, error: 'Kuantitas produk tidak boleh 0' });
    }

    const cleanDiscount = Math.max(0, Math.min(50, Number(discountPct) || 0));
    const discountAmount = subtotal * (cleanDiscount / 100);
    const total = subtotal - discountAmount;

    // BUSINESS APPROVAL RULE:
    // requiresApproval = discountPct > 10 || totalQty > 20
    const requiresApproval = cleanDiscount > 10 || totalQty > 20;
    const status = requiresApproval ? 'PENDING_APPROVAL' : 'SUBMITTED';

    const orderId = `ord-${Date.now()}`;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // Database transaction
    await db.transaction(async (tx) => {
      // 1. Insert Order
      await tx.query(
        `INSERT INTO orders (
          id, order_number, customer_id, user_id, business_unit_id, visit_id,
          subtotal, discount_pct, discount_amount, total, total_qty,
          requires_approval, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [
          orderId,
          orderNumber,
          customerId,
          user.id,
          user.businessUnitId,
          visitId || null,
          subtotal,
          cleanDiscount,
          discountAmount,
          total,
          totalQty,
          requiresApproval,
          status,
        ]
      );

      // 2. Insert Order Items
      for (const item of itemRecords) {
        await tx.query(
          `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [`oi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, orderId, item.productId, item.quantity, item.unitPrice, item.subtotal]
        );
      }

      // 3. Update customer total orders
      await tx.query(
        `UPDATE customers SET total_orders = total_orders + 1, updated_at = NOW() WHERE id = $1`,
        [customerId]
      );

      // 4. Create Audit Log
      await tx.query(
        `INSERT INTO audit_logs (id, business_unit_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES ($1, $2, $3, 'ORDER_CREATED', 'ORDER', $4, $5, NOW())`,
        [
          `aud-${Date.now()}`,
          user.businessUnitId,
          user.id,
          orderId,
          JSON.stringify({ orderNumber, total, totalQty, requiresApproval, status }),
        ]
      );

      // 5. Create Notification
      const notifMsg = requiresApproval
        ? `Order ${orderNumber} menunggu persetujuan karena ${cleanDiscount > 10 ? `diskon ${cleanDiscount}%` : `kuantitas ${totalQty} item`}.`
        : `Order ${orderNumber} untuk ${customer.name} berhasil dibuat.`;

      await tx.query(
        `INSERT INTO notifications (id, user_id, title, message, is_read, link, created_at)
         VALUES ($1, $2, $3, $4, false, '/orders', NOW())`,
        [`notif-${Date.now()}`, user.id, requiresApproval ? 'Order Menunggu Approval' : 'Order Berhasil Dikirim', notifMsg]
      );
    });

    res.json({
      success: true,
      message: requiresApproval ? 'Order menunggu approval' : 'Order berhasil dikirim',
      data: {
        id: orderId,
        orderNumber,
        customerId,
        total,
        totalQty,
        needsApproval: requiresApproval,
        status: status.toLowerCase(),
        createdAt: Date.now(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve Order (Supervisor or Admin)
router.post('/:id/approve', authMiddleware, requireRole(['supervisor', 'admin']), async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { notes = 'Approved by supervisor' } = req.body;

    const orderRes = await db.query(
      `SELECT * FROM orders WHERE id = $1 AND business_unit_id = $2`,
      [id, user.businessUnitId]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order tidak ditemukan' });
    }

    const order = orderRes.rows[0];

    await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE orders SET status = 'APPROVED', updated_at = NOW() WHERE id = $1`,
        [id]
      );

      await tx.query(
        `INSERT INTO order_approvals (id, order_id, approver_user_id, role, action, notes, stage, created_at)
         VALUES ($1, $2, $3, $4, 'APPROVED', $5, 'ASM', NOW())`,
        [`appr-${Date.now()}`, id, user.id, user.role.toUpperCase(), notes]
      );

      await tx.query(
        `INSERT INTO notifications (id, user_id, title, message, is_read, link, created_at)
         VALUES ($1, $2, 'Order Disetujui', $3, false, '/orders', NOW())`,
        [`notif-${Date.now()}`, order.user_id, `Order ${order.order_number} telah disetujui oleh ${user.name}.`]
      );
    });

    res.json({ success: true, message: 'Order berhasil disetujui' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reject Order
router.post('/:id/reject', authMiddleware, requireRole(['supervisor', 'admin']), async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Alasan penolakan (reason) wajib diisi' });
    }

    const orderRes = await db.query(
      `SELECT * FROM orders WHERE id = $1 AND business_unit_id = $2`,
      [id, user.businessUnitId]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order tidak ditemukan' });
    }

    const order = orderRes.rows[0];

    await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE orders SET status = 'REJECTED', approval_reason = $1, updated_at = NOW() WHERE id = $2`,
        [reason, id]
      );

      await tx.query(
        `INSERT INTO order_approvals (id, order_id, approver_user_id, role, action, notes, stage, created_at)
         VALUES ($1, $2, $3, $4, 'REJECTED', $5, 'ASM', NOW())`,
        [`appr-${Date.now()}`, id, user.id, user.role.toUpperCase(), reason]
      );

      await tx.query(
        `INSERT INTO notifications (id, user_id, title, message, is_read, link, created_at)
         VALUES ($1, $2, 'Order Ditolak', $3, false, '/orders', NOW())`,
        [`notif-${Date.now()}`, order.user_id, `Order ${order.order_number} ditolak. Alasan: ${reason}`]
      );
    });

    res.json({ success: true, message: 'Order berhasil ditolak' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
