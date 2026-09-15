import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Customer } from '../types';
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
  RotateCcw,
} from 'lucide-react';

interface VisitsViewProps {
  initialCustomerId?: string | null;
  onOrderForCustomer?: (customerId: string) => void;
}

export const VisitsView: React.FC<VisitsViewProps> = ({
  initialCustomerId,
  onOrderForCustomer,
}) => {
  const { user, businessUnit, theme } = useAuth();
  const [activeVisit, setActiveVisit] = useState<any | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [purpose, setPurpose] = useState('Sales Order');
  const [outcome, setOutcome] = useState('Order Closed');
  const [notes, setNotes] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const purposes = ['Sales Order', 'Penagihan', 'Survey Pasar', 'Merchandising', 'Follow-Up Rutin'];
  const outcomes = ['Order Closed', 'Tertunda / Janji Re-order', 'Toko Tutup', 'Komplain Produk'];

  const checkActiveVisit = async () => {
    try {
      const active = await api.getActiveVisit();
      setActiveVisit(active);
      if (active) {
        setSelectedCustomerId(active.customerId);
        if (active.purpose) setPurpose(active.purpose);
        if (active.outcome) setOutcome(active.outcome);
        if (active.notes) setNotes(active.notes);
        setHasPhoto(active.hasPhoto || false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const list = await api.getCustomers();
      setCustomers(list);
      if (initialCustomerId && !selectedCustomerId) {
        setSelectedCustomerId(initialCustomerId);
      } else if (list.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkActiveVisit();
    fetchCustomers();
  }, [user]);

  // Elapsed timer
  useEffect(() => {
    if (!activeVisit) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = activeVisit.startTime || Date.now();
    const updateElapsed = () => {
      const diffSec = Math.floor((Date.now() - startMs) / 1000);
      setElapsedSeconds(Math.max(0, diffSec));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeVisit]);

  const handleStartVisit = async () => {
    if (!selectedCustomerId) {
      alert('Pilih toko pelanggan terlebih dahulu');
      return;
    }
    setSaving(true);
    try {
      const visit = await api.startVisit(selectedCustomerId);
      await checkActiveVisit();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEndVisit = async () => {
    if (!activeVisit) return;
    setSaving(true);
    try {
      await api.endVisit({
        visitId: activeVisit.id,
        purpose,
        outcome,
        notes,
        hasPhoto,
      });
      setSuccessMessage('Kunjungan berhasil diselesaikan dan dicatat ke PostgreSQL!');
      setActiveVisit(null);
      setNotes('');
      setHasPhoto(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const accent = theme?.accent || '#C97A3A';
  const accentSoft = theme?.accentSoft || '#F5E7DA';

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div id="visits-view" className="space-y-4 pb-24">
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Active Visit Section */}
      {activeVisit ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
          {/* Header with live timer */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full animate-pulse">
                ● Kunjungan Berlangsung
              </span>
              <h2 className="text-sm font-bold text-gray-900 mt-1">
                {activeVisit.customerName || currentCustomer?.name || 'Toko Pelanggan'}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block font-medium">Durasi:</span>
              <span className="font-mono text-base font-bold text-gray-900">
                {formatTimer(elapsedSeconds)}
              </span>
            </div>
          </div>

          {/* Form: Purpose */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Tujuan Kunjungan:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {purposes.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={`py-1.5 px-2 text-xs rounded-lg border text-left transition-colors ${
                    purpose === p
                      ? 'border-transparent text-white font-bold'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: purpose === p ? accent : undefined,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Form: Outcome */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Hasil Kunjungan (Outcome):
            </label>
            <div className="space-y-1.5">
              {outcomes.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o)}
                  className={`w-full py-1.5 px-3 text-xs rounded-lg border text-left flex items-center justify-between transition-colors ${
                    outcome === o
                      ? 'border-transparent text-white font-bold'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: outcome === o ? accent : undefined,
                  }}
                >
                  <span>{o}</span>
                  {outcome === o && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Photo attachment toggle */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Foto Bukti Kunjungan (Display / Toko):
            </label>
            <button
              id="btn-toggle-visit-photo"
              type="button"
              onClick={() => setHasPhoto(!hasPhoto)}
              className={`w-full p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                hasPhoto
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span className="text-xs font-medium">
                {hasPhoto ? '✓ Foto Terlampir (Display Rak Toko)' : '+ Ambil Foto Kunjungan'}
              </span>
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Catatan Lapangan:
            </label>
            <textarea
              id="textarea-visit-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Stok Amanda Brownies tinggal 3 box, kasir minta restock Kamis..."
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-gray-400"
            />
          </div>

          {/* Quick link to create order if needed */}
          {onOrderForCustomer && currentCustomer && (
            <button
              type="button"
              onClick={() => onOrderForCustomer(currentCustomer.id)}
              className="w-full py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              + Buat Order untuk Toko Ini Sekarang
            </button>
          )}

          {/* Finish Visit Button */}
          <button
            id="btn-complete-visit"
            onClick={handleEndVisit}
            disabled={saving}
            className="w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {saving ? 'Menyimpan...' : 'Selesaikan Kunjungan'}
          </button>
        </div>
      ) : (
        /* Start New Visit Form */
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Mulai Kunjungan Toko</h2>
            <p className="text-xs text-gray-500">
              Pilih toko pelanggan terdaftar di {businessUnit?.name}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Pilih Toko Pelanggan:
            </label>
            <select
              id="select-visit-customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-gray-400"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.address} ({c.segment})
                </option>
              ))}
            </select>
          </div>

          {currentCustomer && (
            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 text-gray-600">
              <p className="font-semibold text-gray-900">{currentCustomer.name}</p>
              <p className="flex items-center text-[11px]">
                <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                {currentCustomer.address}
              </p>
              <p className="text-[11px] text-gray-500">
                Terakhir dikunjungi: {currentCustomer.lastVisitDaysAgo} hari lalu • Total Order: {currentCustomer.totalOrders}x
              </p>
            </div>
          )}

          <button
            id="btn-start-visit-action"
            onClick={handleStartVisit}
            disabled={saving || !selectedCustomerId}
            className="w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity flex items-center justify-center space-x-2 disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{saving ? 'Memulai...' : 'Mulai Kunjungan Sekarang'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
