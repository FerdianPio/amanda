import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Customer, Product, Order } from '../types';
import {
  ShoppingBag,
  Plus,
  Minus,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Check,
  X,
  History,
  ShieldAlert,
} from 'lucide-react';

interface OrdersViewProps {
  initialCustomerId?: string | null;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ initialCustomerId }) => {
  const { user, businessUnit, theme } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Supervisor reject state
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [custList, prodList] = await Promise.all([
        api.getCustomers(),
        api.getProducts(),
      ]);
      setCustomers(custList);
      setProducts(prodList);
      if (initialCustomerId) {
        setSelectedCustomerId(initialCustomerId);
      } else if (custList.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const list = await api.getOrders();
      setOrders(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetchOrders();
  }, [user]);

  const updateQty = (prodId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[prodId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [prodId]: next };
    });
  };

  // Calculations
  let subtotal = 0;
  let totalQty = 0;
  products.forEach((p) => {
    const qty = quantities[p.id] || 0;
    subtotal += qty * p.price;
    totalQty += qty;
  });

  const discountAmount = subtotal * (discountPct / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Approval Rule: Discount > 10% OR Quantity > 20
  const needsApproval = discountPct > 10 || totalQty > 20;

  const handleCreateOrder = async () => {
    if (!selectedCustomerId) {
      alert('Pilih toko pelanggan');
      return;
    }
    if (totalQty === 0) {
      alert('Pilih minimal 1 produk');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createOrder({
        customerId: selectedCustomerId,
        items: quantities,
        discountPct,
      });
      setOrderSuccess(res);
      setQuantities({});
      setDiscountPct(0);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (orderId: string) => {
    setActionLoading(true);
    try {
      await api.approveOrder(orderId, 'Disetujui oleh Supervisor via Mobile SFA');
      await fetchOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectOrderId || !rejectReason.trim()) {
      alert('Alasan penolakan wajib diisi');
      return;
    }
    setActionLoading(true);
    try {
      await api.rejectOrder(rejectOrderId, rejectReason);
      setRejectOrderId(null);
      setRejectReason('');
      await fetchOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const accent = theme?.accent || '#C97A3A';
  const accentSoft = theme?.accentSoft || '#F5E7DA';

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div id="orders-view" className="space-y-4 pb-28">
      {/* Sub tabs: Buat Order vs Riwayat */}
      <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('create')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeSubTab === 'create'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Buat Order Baru
        </button>
        <button
          onClick={() => {
            setActiveSubTab('history');
            fetchOrders();
          }}
          className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
            activeSubTab === 'history'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Order ({orders.length})</span>
        </button>
      </div>

      {activeSubTab === 'create' ? (
        <div className="space-y-4">
          {orderSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h4 className="text-xs font-bold">Order Berhasil Dibuat ({orderSuccess.orderNumber})</h4>
              </div>
              <p className="text-xs text-emerald-800">
                {orderSuccess.needsApproval
                  ? '⚠️ Menunggu approval supervisor karena melebihi batas diskon/kuantitas.'
                  : '✓ Order langsung diproses (Auto-approved).'}
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => setOrderSuccess(null)}
                  className="text-xs font-semibold px-3 py-1 bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Buat Order Lagi
                </button>
                <button
                  onClick={() => {
                    setOrderSuccess(null);
                    setActiveSubTab('history');
                  }}
                  className="text-xs font-semibold px-3 py-1 bg-white text-emerald-800 border border-emerald-300 rounded-lg"
                >
                  Lihat di Riwayat
                </button>
              </div>
            </div>
          )}

          {/* Customer Selection */}
          <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Pilih Toko Pelanggan:
            </label>
            <select
              id="select-order-customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-gray-400"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.segment}) - {c.address}
                </option>
              ))}
            </select>
          </div>

          {/* Product Catalog */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-gray-900">
                Katalog Produk {businessUnit?.name}
              </span>
              <span className="text-gray-500">{products.length} SKU</span>
            </div>

            <div className="space-y-2">
              {products.map((p) => {
                const qty = quantities[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    id={`product-item-${p.id}`}
                    className="p-3 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex-1 mr-3">
                      <h4 className="text-xs font-bold text-gray-900">{p.name}</h4>
                      <p className="text-[11px] text-gray-500">{p.sku} • {p.unit}</p>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">
                        {formatRupiah(p.price)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => updateQty(p.id, -1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-600 active:bg-gray-200"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-gray-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(p.id, 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-600 active:bg-gray-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discount & Approval Rules Control Card */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center">
                <Percent className="w-3.5 h-3.5 mr-1" style={{ color: accent }} />
                Diskon Promo Toko:
              </label>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: accentSoft, color: accent }}
              >
                {discountPct}%
              </span>
            </div>

            <input
              id="slider-order-discount"
              type="range"
              min="0"
              max="40"
              step="5"
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value))}
              className="w-full accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0% (Normal)</span>
              <span>10% (Batas Aman)</span>
              <span>20% (Butuh Approval)</span>
              <span>40%</span>
            </div>

            {/* Live Approval Rule Indicator */}
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                needsApproval
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {needsApproval ? (
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {needsApproval
                      ? '⚠️ Order Ini Memerlukan Approval Supervisor'
                      : '✓ Order Langsung Terkirim (Auto-Approved)'}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    {needsApproval
                      ? `Pemicu approval: ${
                          discountPct > 10 ? `Diskon ${discountPct}% (>10%). ` : ''
                        }${totalQty > 20 ? `Total kuantitas ${totalQty} pcs (>20 pcs).` : ''}`
                      : 'Diskon ≤ 10% dan total kuantitas ≤ 20 pcs aman dari proses approval.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary breakdown */}
            <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Total Kuantitas:</span>
                <span className="font-semibold text-gray-900">{totalQty} pcs</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatRupiah(subtotal)}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Diskon ({discountPct}%):</span>
                  <span>- {formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total Tagihan:</span>
                <span style={{ color: accent }}>{formatRupiah(finalTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-order"
              type="button"
              onClick={handleCreateOrder}
              disabled={submitting || totalQty === 0}
              className="w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {submitting
                ? 'Memproses Order...'
                : needsApproval
                ? `Kirim Order (Minta Approval Supervisor)`
                : `Kirim Order (${formatRupiah(finalTotal)})`}
            </button>
          </div>
        </div>
      ) : (
        /* Order History View */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1 text-gray-500">
            <span>Daftar transaksi order unit {businessUnit?.code}</span>
            <span>{orders.length} Transaksi</span>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-200">
              Belum ada riwayat order.
            </div>
          ) : (
            orders.map((o) => {
              const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';
              const isPending = o.status === 'pending_approval';

              return (
                <div
                  key={o.id}
                  id={`order-card-${o.id}`}
                  className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-gray-900">
                        {o.orderNumber}
                      </span>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">
                        {o.customerName || 'Toko Pelanggan'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(o.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        o.status === 'approved' || o.status === 'submitted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-800'
                          : o.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {o.status === 'pending_approval' ? 'Menunggu Approval' : o.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100">
                    <span>
                      {o.totalQty} items {o.discountPct > 0 && `(Diskon ${o.discountPct}%)`}
                    </span>
                    <span className="font-bold text-gray-900">{formatRupiah(o.total)}</span>
                  </div>

                  {o.approvalReason && (
                    <div className="p-2 bg-rose-50 rounded-lg text-[11px] text-rose-800">
                      Alasan Penolakan: {o.approvalReason}
                    </div>
                  )}

                  {/* Supervisor Approval Actions */}
                  {isSupervisor && isPending && (
                    <div className="pt-2 border-t border-gray-100 flex items-center space-x-2">
                      <button
                        id={`btn-approve-order-${o.id}`}
                        onClick={() => handleApprove(o.id)}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui (Approve)</span>
                      </button>

                      <button
                        id={`btn-reject-order-${o.id}`}
                        onClick={() => setRejectOrderId(o.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-semibold text-xs transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Alasan Penolakan Order</h3>
            <p className="text-xs text-gray-500">
              Sales rep akan menerima notifikasi penjelasan penolakan ini.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Diskon terlalu tinggi untuk toko tipe agen..."
              className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:outline-hidden"
            />
            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => {
                  setRejectOrderId(null);
                  setRejectReason('');
                }}
                className="px-3 py-1.5 text-xs text-gray-600 rounded-lg hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                id="btn-confirm-reject-order"
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Menolak...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
