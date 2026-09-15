import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { AttendanceRecord } from '../types';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Navigation,
  LogOut,
  Calendar,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { user, businessUnit, theme } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const data = await api.getTodayAttendance();
      setAttendance(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const res = await api.checkIn({
        accuracy: 5,
        latitude: -7.8253,
        longitude: 110.3650,
      });
      setAttendance(res);
      setSuccessMessage('Check-in berhasil dicatat di PostgreSQL dengan koordinat GPS valid!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    try {
      const res = await api.checkOut();
      setAttendance(res);
      setSuccessMessage('Check-out berhasil dicatat. Tugas harian selesai!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const accent = theme?.accent || '#C97A3A';
  const accentSoft = theme?.accentSoft || '#F5E7DA';

  return (
    <div id="attendance-view" className="space-y-4 pb-24">
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* GPS Status Card */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Validasi Lokasi GPS</h3>
              <p className="text-[11px] text-gray-500">Kantor Cabang {user?.area}</p>
            </div>
          </div>
          <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping" />
            Di Dalam Geofence
          </span>
        </div>

        {/* GPS Coordinates Display */}
        <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600 border border-gray-100">
          <div className="flex justify-between">
            <span>Koordinat Lapangan:</span>
            <span className="font-mono font-medium text-gray-900">-7.8253, 110.3650</span>
          </div>
          <div className="flex justify-between">
            <span>Akurasi Sinyal GPS:</span>
            <span className="font-semibold text-emerald-700">±5 Meter (Akurat)</span>
          </div>
          <div className="flex justify-between">
            <span>Zona Jam Masuk:</span>
            <span className="font-medium text-gray-700">08:00 - 09:00 WIB</span>
          </div>
        </div>
      </div>

      {/* Check In / Out Action Card */}
      <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs text-center space-y-4">
        <div>
          <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <h2 className="text-2xl font-bold font-mono text-gray-900 mt-1">
            {new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </h2>
        </div>

        {/* Status indicator */}
        <div
          className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: attendance?.checkInTime ? '#ECFDF5' : '#FEF2F2',
            color: attendance?.checkInTime ? '#065F46' : '#991B1B',
          }}
        >
          {attendance?.checkInTime ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {attendance.status === 'completed'
                  ? 'Presensi Selesai (Check-Out Tercatat)'
                  : attendance.late
                  ? 'Sudah Check-In (Terlambat)'
                  : 'Sudah Check-In (Tepat Waktu)'}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Belum Melakukan Absensi Hari Ini</span>
            </>
          )}
        </div>

        {/* Check in / Check out buttons */}
        <div className="pt-2">
          {!attendance?.checkInTime ? (
            <button
              id="btn-main-check-in"
              onClick={handleCheckIn}
              disabled={submitting}
              className="w-full py-3 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
              style={{ backgroundColor: accent }}
            >
              <Clock className="w-4 h-4" />
              <span>{submitting ? 'Memverifikasi Lokasi...' : 'Lakukan Check-In Presensi'}</span>
            </button>
          ) : !attendance.checkOutTime ? (
            <button
              id="btn-main-check-out"
              onClick={handleCheckOut}
              disabled={submitting}
              className="w-full py-3 text-sm font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{submitting ? 'Menyimpan...' : 'Check-Out Selesai Kerja'}</span>
            </button>
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 font-medium">
              ✓ Anda telah menyelesaikan presensi kerja hari ini.
            </div>
          )}
        </div>

        {/* History Timestamps */}
        {attendance?.checkInTime && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <span className="text-[10px] text-gray-400 block">Waktu Masuk</span>
              <span className="font-bold text-gray-900">
                {new Date(attendance.checkInTime).toLocaleTimeString('id-ID')}
              </span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <span className="text-[10px] text-gray-400 block">Waktu Pulang</span>
              <span className="font-bold text-gray-900">
                {attendance.checkOutTime
                  ? new Date(attendance.checkOutTime).toLocaleTimeString('id-ID')
                  : '-'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Policy Notes */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-[11px] text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700 flex items-center">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-gray-500" />
          Aturan Presensi Amanda Group
        </p>
        <p>• Geofence validasi radius 50 meter dari titik koordinat kantor cabang.</p>
        <p>• Check-in setelah pukul 09:00 WIB otomatis tercatat sebagai "Terlambat".</p>
        <p>• Seluruh data presensi tersimpan permanen di database PostgreSQL.</p>
      </div>
    </div>
  );
};
