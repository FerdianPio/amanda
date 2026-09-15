import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { DashboardData } from '../types';
import {
  TrendingUp,
  MapPin,
  Clock,
  AlertTriangle,
  ChevronRight,
  Shield,
  Users,
  ShoppingBag,
  Sparkles,
  Calendar,
  CheckCircle,
} from 'lucide-react';

interface DashboardViewProps {
  onStartVisitCustomer: (customerId: string) => void;
  onNavigateToTab: (tab: 'customers' | 'visits' | 'orders' | 'attendance') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartVisitCustomer,
  onNavigateToTab,
}) => {
  const { user, businessUnit, theme } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleQuickCheckIn = async () => {
    setAttendanceLoading(true);
    try {
      await api.checkIn({ accuracy: 5, latitude: -7.8253, longitude: 110.3650 });
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleQuickCheckOut = async () => {
    setAttendanceLoading(true);
    try {
      await api.checkOut();
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAttendanceLoading(false);
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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-xs text-gray-400">
        Memuat data dashboard...
      </div>
    );
  }

  const target = data?.target;
  const attendance = data?.attendance;
  const stats = data?.stats;

  return (
    <div id="dashboard-view" className="space-y-4 pb-20">
      {/* 1. Greeting Card */}
      <div
        className="p-4 rounded-2xl border shadow-xs transition-all"
        style={{ backgroundColor: 'white', borderColor: theme?.borderColor || '#E5E7EB' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {businessUnit?.name} • {user?.area}
            </span>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">
              Halo, {user?.name}! 👋
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.role === 'supervisor'
                ? 'Pantau pergerakan tim sales dan persetujuan order hari ini.'
                : 'Target harian dan jadwal kunjungan sudah siap.'}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs"
            style={{ backgroundColor: accent }}
          >
            {user?.initials}
          </div>
        </div>
      </div>

      {/* 2. Monthly Target Card (Computed in Real Time from PostgreSQL Orders) */}
      <div
        className="p-4 rounded-2xl border bg-white shadow-xs overflow-hidden relative"
        style={{ borderColor: theme?.borderColor || '#E5E7EB' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: accentSoft, color: accent }}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">
                Pencapaian Target ({target?.periodLabel})
              </h3>
              <p className="text-[10px] text-gray-500">Kalkulasi real-time dari database order</p>
            </div>
          </div>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: accentSoft, color: accent }}
          >
            {target?.achievementPct}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden my-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, target?.achievementPct || 0)}%`,
              backgroundColor: accent,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs mt-2">
          <div>
            <span className="text-[11px] text-gray-400">Tercapai: </span>
            <span className="font-bold text-gray-900">
              {formatRupiah(target?.achievedAmount || 0)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-gray-400">Target: </span>
            <span className="font-semibold text-gray-700">
              {formatRupiah(target?.targetAmount || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Quick Attendance Card */}
      <div
        className="p-4 rounded-2xl border bg-white shadow-xs"
        style={{ borderColor: theme?.borderColor || '#E5E7EB' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="p-2 rounded-xl"
              style={{
                backgroundColor: attendance?.status === 'on_time' || attendance?.status === 'completed'
                  ? '#ECFDF5'
                  : attendance?.status === 'late'
                  ? '#FFFBEB'
                  : '#F3F4F6',
                color: attendance?.status === 'on_time' || attendance?.status === 'completed'
                  ? '#059669'
                  : attendance?.status === 'late'
                  ? '#D97706'
                  : '#6B7280',
              }}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">
                Absensi Hari Ini
              </h3>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    attendance?.checkInTime ? 'bg-emerald-500' : 'bg-rose-400 animate-pulse'
                  }`}
                />
                <span className="text-[11px] font-medium text-gray-600">
                  {attendance?.status === 'completed'
                    ? 'Selesai (Sudah Check-Out)'
                    : attendance?.checkInTime
                    ? attendance?.late
                      ? 'Sudah Check-In (Terlambat)'
                      : 'Sudah Check-In (Tepat Waktu)'
                    : 'Belum Check-In'}
                </span>
              </div>
            </div>
          </div>

          <div>
            {!attendance?.checkInTime ? (
              <button
                id="btn-quick-check-in"
                onClick={handleQuickCheckIn}
                disabled={attendanceLoading}
                className="px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
                style={{ backgroundColor: accent }}
              >
                {attendanceLoading ? 'Proses...' : 'Check-In'}
              </button>
            ) : !attendance?.checkOutTime ? (
              <button
                id="btn-quick-check-out"
                onClick={handleQuickCheckOut}
                disabled={attendanceLoading}
                className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
              >
                {attendanceLoading ? 'Proses...' : 'Check-Out'}
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                Lengkap
              </span>
            )}
          </div>
        </div>

        {attendance?.checkInTime && (
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-gray-400" />
              GPS Akurasi: ±{attendance?.accuracy || 6}m (Radius Valid)
            </span>
            <span>
              {new Date(attendance.checkInTime).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>

      {/* 4. Mini Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onNavigateToTab('customers')}
          className="p-3 bg-white rounded-xl border border-gray-200 text-left shadow-xs hover:border-gray-300 transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-medium">Pelanggan</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <p className="text-base font-bold text-gray-900">{stats?.customerCount || 0}</p>
          <span className="text-[10px] text-gray-400">Terdaftar di {businessUnit?.code}</span>
        </button>

        <button
          onClick={() => onNavigateToTab('visits')}
          className="p-3 bg-white rounded-xl border border-gray-200 text-left shadow-xs hover:border-gray-300 transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-medium">Kunjungan Hari Ini</span>
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <p className="text-base font-bold text-gray-900">{stats?.todaysVisits || 0}</p>
          <span className="text-[10px] text-gray-400">Selesai terverifikasi</span>
        </button>

        <button
          onClick={() => onNavigateToTab('orders')}
          className="p-3 bg-white rounded-xl border border-gray-200 text-left shadow-xs hover:border-gray-300 transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-medium">Order Hari Ini</span>
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <p className="text-base font-bold text-gray-900">{stats?.todaysOrders || 0}</p>
          <span className="text-[10px] text-gray-400">Masuk ke sistem</span>
        </button>

        <div className="p-3 bg-white rounded-xl border border-gray-200 text-left shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-medium">Follow-Up Pending</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <p className="text-base font-bold text-gray-900">{stats?.followUpsCount || 0}</p>
          <span className="text-[10px] text-gray-400">Tugas tertunda</span>
        </div>
      </div>

      {/* 5. Supervisor Team Overview (if role is supervisor) */}
      {user?.role === 'supervisor' && data?.teamOverview && data.teamOverview.length > 0 && (
        <div className="p-4 rounded-2xl border bg-white shadow-xs border-purple-200">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-purple-900">
              Monitoring Tim Sales ({businessUnit?.name})
            </h3>
          </div>
          <div className="space-y-2">
            {data.teamOverview.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs"
              >
                <div>
                  <p className="font-bold text-gray-900">{member.name}</p>
                  <p className="text-[11px] text-gray-500">
                    Target Tercapai: {member.achievementPct}%
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      member.status === 'Sudah Check-In'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Agent Insights Card */}
      {data?.insights && data.insights.length > 0 && (
        <div className="p-4 rounded-2xl border bg-white shadow-xs space-y-2.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" style={{ color: accent }} />
            <h3 className="text-xs font-bold text-gray-900">Rekomendasi AI Agent SFA</h3>
          </div>
          <div className="space-y-2">
            {data.insights.map((ins) => (
              <div
                key={ins.id}
                className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                  ins.severity === 'high'
                    ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                    : 'bg-blue-50/60 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <AlertTriangle
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      ins.severity === 'high' ? 'text-amber-600' : 'text-blue-600'
                    }`}
                  />
                  <span>{ins.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Priority Customers */}
      {data?.priorityCustomers && data.priorityCustomers.length > 0 && (
        <div className="p-4 rounded-2xl border bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900">Pelanggan Perlu Dikunjungi</h3>
            <button
              onClick={() => onNavigateToTab('customers')}
              className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 flex items-center"
            >
              Semua <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <div className="space-y-2">
            {data.priorityCustomers.map((cust) => (
              <div
                key={cust.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 mr-2">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-bold text-gray-900">{cust.name}</p>
                    {cust.status === 'at_risk' && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-100 text-rose-800 rounded">
                        At Risk
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                    {cust.address}
                  </p>
                  <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                    Terakhir dikunjungi {cust.lastVisitDaysAgo} hari lalu
                  </p>
                </div>
                <button
                  id={`btn-start-visit-cust-${cust.id}`}
                  onClick={() => onStartVisitCustomer(cust.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-white rounded-lg shadow-xs shrink-0"
                  style={{ backgroundColor: accent }}
                >
                  Kunjungi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
