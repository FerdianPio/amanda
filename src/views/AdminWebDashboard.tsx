import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Store,
  Package,
  Palette,
  Search,
  Check,
  X,
  RefreshCw,
  TrendingUp,
  Smartphone,
  MapPin,
  Calendar,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Building2,
  DollarSign,
  ShoppingCart,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  AdminOverviewData,
  AdminBusinessUnitMetric,
  AdminSalesMember,
  AdminPendingApproval,
  Customer,
  Product,
} from '../types';

interface AdminWebDashboardProps {
  onSwitchToMobileView: () => void;
  onOpenThemeModal: () => void;
  onOpenUserSwitcher: () => void;
}

type AdminTab = 'overview' | 'sales-team' | 'approvals' | 'customers' | 'products' | 'branding';

export function AdminWebDashboard({
  onSwitchToMobileView,
  onOpenThemeModal,
  onOpenUserSwitcher,
}: AdminWebDashboardProps) {
  const { user, businessUnit, theme } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuFilter, setSelectedBuFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Additional data for customers and products tabs
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminOverview();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomersAndProducts = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.getCustomers(),
        api.getProducts(),
      ]);
      setCustomers(custRes);
      setProducts(prodRes);
    } catch (err: any) {
      console.error('Failed to load customer/product catalog:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchCustomersAndProducts();
  }, []);

  const handleApprove = async (orderId: string) => {
    setIsActionLoading(true);
    try {
      await api.approveOrder(orderId, 'Disetujui via Admin Web Dashboard');
      setNotificationMsg(`✅ Pesanan #${orderId.slice(0, 8)} berhasil disetujui.`);
      await fetchAdminData();
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err: any) {
      setNotificationMsg(`❌ Gagal menyetujui: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = prompt('Masukkan alasan penolakan diskon / pesanan:', 'Diskon melebihi batas toleransi');
    if (!reason) return;

    setIsActionLoading(true);
    try {
      await api.rejectOrder(orderId, reason);
      setNotificationMsg(`⚠️ Pesanan #${orderId.slice(0, 8)} telah ditolak.`);
      await fetchAdminData();
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err: any) {
      setNotificationMsg(`❌ Gagal menolak: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filtered lists based on BU selector
  const filteredSalesTeam = data?.salesTeam.filter((s) => {
    const matchesBu = selectedBuFilter === 'ALL' || s.businessUnitId === selectedBuFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.area.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBu && matchesSearch;
  }) || [];

  const filteredApprovals = data?.pendingApprovals.filter((a) => {
    return selectedBuFilter === 'ALL' || a.businessUnitName.toLowerCase().includes(selectedBuFilter.toLowerCase());
  }) || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Notification Banner */}
      {notificationMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center space-x-2 sticky top-0 z-50 shadow-md transition-all">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="opacity-80 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main App Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                style={{ backgroundColor: theme.primaryDarkColor || '#8C4318' }}
              >
                {theme.initials || 'AG'}
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 tracking-tight leading-tight">
                  Amanda SFA
                </h1>
                <p className="text-[11px] text-amber-400 font-medium">
                  Portal Admin & Eksekutif
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Menu Utama
            </div>

            <button
              id="admin-nav-overview"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Ringkasan Eksekutif</span>
            </button>

            <button
              id="admin-nav-sales-team"
              onClick={() => setActiveTab('sales-team')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'sales-team'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Monitoring Tim Sales</span>
              {data && (
                <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
                  {data.summary.activeSalesCount}
                </span>
              )}
            </button>

            <button
              id="admin-nav-approvals"
              onClick={() => setActiveTab('approvals')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'approvals'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approval Diskon</span>
              {data && data.pendingApprovals.length > 0 && (
                <span className="ml-auto text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {data.pendingApprovals.length}
                </span>
              )}
            </button>

            <div className="pt-3 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Master Data & Outlet
            </div>

            <button
              id="admin-nav-customers"
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Pelanggan & Outlet</span>
            </button>

            <button
              id="admin-nav-products"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Katalog Produk BU</span>
            </button>

            <button
              id="admin-nav-branding"
              onClick={() => setActiveTab('branding')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'branding'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Branding Bisnis Unit</span>
            </button>
          </nav>

          {/* Sidebar Footer: Mode Switcher & User Profile */}
          <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/60">
            {/* Switch to Mobile View Button */}
            <button
              id="btn-switch-to-mobile-view"
              onClick={onSwitchToMobileView}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-medium border border-slate-700/60 transition-colors"
              title="Beralih ke mockup tampilan aplikasi mobile untuk sales lapangan"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mode Mobile Sales</span>
            </button>

            {/* Current Admin User Badge */}
            <div
              onClick={onOpenUserSwitcher}
              className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800/80 cursor-pointer border border-slate-800 transition-colors"
              title="Klik untuk mengganti akun pengguna"
            >
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                {user?.initials || 'AD'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider">{user?.role}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        </aside>

        {/* Center Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-900">
          {/* Top Header Bar */}
          <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
            <div className="flex items-center space-x-4">
              {/* Business Unit Quick Selector */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setSelectedBuFilter('ALL')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedBuFilter === 'ALL'
                      ? 'bg-amber-600 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua BU
                </button>
                {data?.businessUnits.map((bu) => (
                  <button
                    key={bu.id}
                    onClick={() => setSelectedBuFilter(bu.id)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      selectedBuFilter === bu.id
                        ? 'bg-amber-600 text-white font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {bu.name}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari sales, toko, atau PO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={fetchAdminData}
                disabled={isLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                title="Muat ulang data terkini"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={onSwitchToMobileView}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-colors"
                title="Beralih ke mockup smartphone sales"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simulasi Mobile App</span>
              </button>
            </div>
          </header>

          {/* Main Body per Tab */}
          <main className="p-6 space-y-6 flex-1">
            {isLoading && !data ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-400">Memuat data eksekutif Amanda SFA...</p>
              </div>
            ) : null}

            {/* TAB 1: RINGKASAN EKSEKUTIF */}
            {activeTab === 'overview' && data && (
              <div className="space-y-6">
                {/* Global KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Revenue Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                      <span>Total Omset Bulan Ini</span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-100">
                      {formatRupiah(data.summary.totalRevenue)}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Target: {formatRupiah(data.summary.totalTarget)}</span>
                      <span className="font-semibold text-emerald-400">{data.summary.overallPct}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, data.summary.overallPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Orders Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                      <span>Total Pesanan Masuk</span>
                      <ShoppingCart className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-100">
                      {data.summary.totalOrders} <span className="text-xs font-normal text-slate-400">Pesanan</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Outlet Tercover:</span>
                      <span className="font-semibold text-slate-200">{data.summary.totalCustomers} Toko</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full w-4/5" />
                    </div>
                  </div>

                  {/* Attendance Live Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                      <span>Presensi Sales Lapangan</span>
                      <UserCheck className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-100">
                      {data.summary.checkedInTodayCount}{' '}
                      <span className="text-xs font-normal text-slate-400">/ {data.summary.activeSalesCount} Aktif</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Status Geofence:</span>
                      <span className="font-semibold text-emerald-400">100% Valid GPS</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{
                          width: `${(data.summary.checkedInTodayCount / Math.max(1, data.summary.activeSalesCount)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Approvals Pending Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                      <span>Antrian Approval Diskon</span>
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                      <span>{data.summary.pendingApprovalsCount}</span>
                      {data.summary.pendingApprovalsCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-red-900/50 text-red-300 rounded font-semibold">
                          Perlu Tindakan
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Diskon Khusus:</span>
                      <span className="text-slate-300 font-medium">&gt; 10% PO</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all"
                        style={{ width: data.summary.pendingApprovalsCount > 0 ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Unit Performance Comparison */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-100">
                        Kinerja Komparatif Bisnis Unit (Multi-BU)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Monitoring real-time omset, target, dan armada penjualan per divisi
                      </p>
                    </div>
                    <span className="text-xs font-mono bg-slate-900 text-amber-400 px-2.5 py-1 rounded border border-slate-800">
                      Amanda Group
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.businessUnits.map((bu) => (
                      <div
                        key={bu.id}
                        className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-3 relative overflow-hidden"
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ backgroundColor: bu.accent }}
                        />
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: bu.accent }}
                              />
                              <h3 className="text-sm font-bold text-slate-100">{bu.name}</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{bu.description}</p>
                          </div>
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {bu.achievementPct}% Target
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                          <div className="bg-slate-950/60 p-2 rounded-lg">
                            <p className="text-[10px] text-slate-400">Realisasi</p>
                            <p className="text-xs font-bold text-slate-200 mt-0.5">
                              {formatRupiah(bu.monthRevenue)}
                            </p>
                          </div>
                          <div className="bg-slate-950/60 p-2 rounded-lg">
                            <p className="text-[10px] text-slate-400">Target</p>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">
                              {formatRupiah(bu.totalTarget)}
                            </p>
                          </div>
                          <div className="bg-slate-950/60 p-2 rounded-lg">
                            <p className="text-[10px] text-slate-400">Sales / Outlet</p>
                            <p className="text-xs font-bold text-slate-200 mt-0.5">
                              {bu.salesCount} / {bu.customerCount}
                            </p>
                          </div>
                        </div>

                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              backgroundColor: bu.accent,
                              width: `${Math.min(100, bu.achievementPct)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid: Pending Approvals & Live Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Pending Approval Fast Queue (2 Cols) */}
                  <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-red-400" />
                        <h2 className="text-sm font-bold text-slate-100">
                          Antrian Otorisasi Diskon Khusus
                        </h2>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {data.pendingApprovals.length} permintaan pending
                      </span>
                    </div>

                    {data.pendingApprovals.length === 0 ? (
                      <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
                        Tidak ada pesanan yang memerlukan persetujuan diskon saat ini.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {data.pendingApprovals.map((appr) => (
                          <div
                            key={appr.id}
                            className="bg-slate-900 border border-slate-800/90 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-mono font-bold text-amber-400">
                                  #{appr.orderNumber}
                                </span>
                                <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded font-semibold border border-red-800/40">
                                  Diskon {appr.discountPct}%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {appr.businessUnitName}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-200">
                                {appr.customerName} <span className="text-slate-400 font-normal">({appr.customerArea || 'Area'})</span>
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Diajukan oleh: <span className="text-slate-300 font-medium">{appr.salesName}</span> | Total: <span className="text-emerald-400 font-semibold">{formatRupiah(appr.total)}</span>
                              </p>
                              {appr.approvalReason && (
                                <p className="text-[11px] text-amber-300/90 italic bg-slate-950/60 px-2 py-1 rounded">
                                  "{appr.approvalReason}"
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                              <button
                                onClick={() => handleApprove(appr.id)}
                                disabled={isActionLoading}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>
                              <button
                                onClick={() => handleReject(appr.id)}
                                disabled={isActionLoading}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Live Audit Activity Feed (1 Col) */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Log Aktivitas Lapangan</span>
                      </h2>
                    </div>

                    <div className="space-y-3">
                      {data.recentActivity.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-start space-x-2.5 p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60 text-xs"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {act.userInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-200 truncate">{act.userName}</p>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(act.createdAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                              {act.details}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MONITORING TIM SALES */}
            {activeTab === 'sales-team' && data && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">
                      Roster & Monitoring Tenaga Penjualan Lapangan
                    </h2>
                    <p className="text-xs text-slate-400">
                      Pantau kehadiran GPS, jumlah kunjungan, dan pencapaian target bulanan sales reps
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Total Tim:</span>
                    <span className="text-xs font-bold bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-slate-800">
                      {filteredSalesTeam.length} Personel
                    </span>
                  </div>
                </div>

                {/* Sales Roster Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Personel Sales</th>
                          <th className="py-3 px-4">Bisnis Unit</th>
                          <th className="py-3 px-4">Wilayah Operasi</th>
                          <th className="py-3 px-4">Status Presensi Hari Ini</th>
                          <th className="py-3 px-4">Kunjungan Hari Ini</th>
                          <th className="py-3 px-4">Pesanan Hari Ini</th>
                          <th className="py-3 px-4">Capaian Target Bulanan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredSalesTeam.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs">
                                  {member.initials}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-200">{member.name}</p>
                                  <p className="text-[11px] text-slate-500">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-300">
                              {member.businessUnitName}
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span>{member.area}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {member.attendanceStatus === 'on_time' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Hadir Tepat Waktu</span>
                                </span>
                              ) : member.attendanceStatus === 'late' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/50">
                                  <Clock className="w-3 h-3" />
                                  <span>Terlambat</span>
                                </span>
                              ) : member.attendanceStatus === 'outside_geofence' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950 text-red-400 border border-red-800/50">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Luar Geofence</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                                  <span>Belum Check-In</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-200">{member.todaysVisits}</span>
                              <span className="text-slate-500 text-[11px]"> Toko</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-200">{member.todaysOrders}</span>
                              <span className="text-slate-500 text-[11px]"> Order</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1 min-w-[130px]">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">{formatRupiah(member.achievedAmount)}</span>
                                  <span className="font-bold text-amber-400">{member.achievementPct}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-amber-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, member.achievementPct)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: APPROVAL PESANAN */}
            {activeTab === 'approvals' && data && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">
                      Otorisasi Diskon Khusus & Kredit Pesanan
                    </h2>
                    <p className="text-xs text-slate-400">
                      Pesanan dengan diskon melebihi 10% memerlukan persetujuan Supervisor atau Admin
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-red-950 text-red-300 px-3 py-1 rounded border border-red-800/40">
                    {filteredApprovals.length} Menunggu Tindakan
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredApprovals.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      Tidak ada antrian pesanan yang memerlukan persetujuan.
                    </div>
                  ) : (
                    filteredApprovals.map((appr) => (
                      <div
                        key={appr.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm text-amber-400">
                              #{appr.orderNumber}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-red-900/40 text-red-300 font-semibold border border-red-700/40">
                              Diskon {appr.discountPct}% (Rp {appr.discountAmount.toLocaleString('id-ID')})
                            </span>
                            <span className="text-xs text-slate-400">
                              {appr.businessUnitName}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-slate-200">
                            {appr.customerName} <span className="text-xs font-normal text-slate-400">({appr.customerArea})</span>
                          </p>

                          <div className="flex items-center space-x-3 text-xs text-slate-400">
                            <span>Sales: <b className="text-slate-300">{appr.salesName}</b></span>
                            <span>Total Qty: <b className="text-slate-300">{appr.totalQty} item</b></span>
                            <span>Nilai Akhir: <b className="text-emerald-400">{formatRupiah(appr.total)}</b></span>
                          </div>

                          {appr.approvalReason && (
                            <div className="p-2 bg-slate-900 rounded-lg text-xs text-amber-300 border border-slate-800">
                              <span className="text-slate-500 font-medium mr-1">Alasan Pengajuan:</span>
                              "{appr.approvalReason}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleApprove(appr.id)}
                            disabled={isActionLoading}
                            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>Setujui PO</span>
                          </button>
                          <button
                            onClick={() => handleReject(appr.id)}
                            disabled={isActionLoading}
                            className="flex items-center space-x-1.5 px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PELANGGAN & OUTLET */}
            {activeTab === 'customers' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">
                      Master Data Pelanggan & Toko Terdaftar
                    </h2>
                    <p className="text-xs text-slate-400">
                      Segmentasi channel (Supermarket, Minimarket, Toko Kelontong, Bakery Cafe)
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded border border-slate-800">
                    {customers.length} Outlet Aktif
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Nama Toko</th>
                          <th className="py-3 px-4">Segment Channel</th>
                          <th className="py-3 px-4">Alamat & Wilayah</th>
                          <th className="py-3 px-4">Status Toko</th>
                          <th className="py-3 px-4">Kunjungan Terakhir</th>
                          <th className="py-3 px-4">Total Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {customers.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-200">{c.name}</p>
                              <p className="text-[11px] text-slate-500">{c.pic || 'PIC'} - {c.phone || '-'}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
                                {c.segment}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              <p className="truncate max-w-xs">{c.address}</p>
                              <p className="text-[10px] text-slate-500">{c.area || 'Bandung'}</p>
                            </td>
                            <td className="py-3 px-4">
                              {c.status === 'active' ? (
                                <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-800/40">
                                  Aktif
                                </span>
                              ) : c.status === 'at_risk' ? (
                                <span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-800/40">
                                  At Risk
                                </span>
                              ) : (
                                <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                                  Non-Aktif
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {c.lastVisitDaysAgo === 0 ? (
                                <span className="text-emerald-400 font-medium">Hari ini</span>
                              ) : (
                                <span>{c.lastVisitDaysAgo} hari lalu</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-200">
                              {c.totalOrders} PO
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: KATALOG PRODUK */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">
                      Katalog Produk Amanda Group
                    </h2>
                    <p className="text-xs text-slate-400">
                      Daftar SKU, harga standar, dan unit jual
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded border border-slate-800">
                    {products.length} SKU Aktif
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-slate-800">
                          {p.sku}
                        </span>
                        <span className="text-xs text-slate-400">{p.unit}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">{p.name}</h3>
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Harga Satuan:</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatRupiah(p.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: BRANDING BISNIS UNIT */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">
                      Kustomisasi Identitas & Tema Bisnis Unit
                    </h2>
                    <p className="text-xs text-slate-400">
                      Setiap Bisnis Unit memiliki skema warna korporat yang disinkronkan langsung ke aplikasi sales mobile
                    </p>
                  </div>
                  <button
                    onClick={onOpenThemeModal}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Ubah Warna Tema Aktif</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amanda Bakery Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center text-white font-bold text-sm shadow">
                        AB
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Amanda Bakery</h3>
                        <p className="text-xs text-slate-400">Brownies & Cake Divisi</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Tema hangat dengan palet cokelat karamel khas kue Amanda (#C97A3A) yang memicu selera belanja pelanggan bakery.
                    </p>
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400">Aksen Utama:</span>
                      <div className="w-5 h-5 rounded-full bg-[#C97A3A] border border-slate-700" />
                      <span className="font-mono text-slate-300">#C97A3A</span>
                    </div>
                  </div>

                  {/* Amanda Mart Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white font-bold text-sm shadow">
                        AM
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Amanda Mart</h3>
                        <p className="text-xs text-slate-400">FMCG & Retail Grocery Divisi</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Tema segar bernuansa hijau toska (#0D6E63) untuk jaringan minimarket dan distribusi ritel cepat Amanda.
                    </p>
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400">Aksen Utama:</span>
                      <div className="w-5 h-5 rounded-full bg-[#0D6E63] border border-slate-700" />
                      <span className="font-mono text-slate-300">#0D6E63</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
