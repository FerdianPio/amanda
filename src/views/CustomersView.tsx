import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Customer } from '../types';
import { Search, MapPin, Phone, User, Calendar, ShoppingBag, X, ChevronRight, AlertCircle } from 'lucide-react';

interface CustomersViewProps {
  onStartVisit: (customerId: string) => void;
  onCreateOrder: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onStartVisit,
  onCreateOrder,
}) => {
  const { user, businessUnit, theme } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('Semua');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const segments = ['Semua', 'Toko Kelontong', 'Supermarket Lokal', 'Kafe', 'Agen'];

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers({
        q: searchQuery,
        segment: selectedSegment !== 'Semua' ? selectedSegment : undefined,
      });
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user, selectedSegment]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleOpenDetail = async (c: Customer) => {
    setSelectedCustomer(c);
    setDetailLoading(true);
    try {
      const detail = await api.getCustomerDetail(c.id);
      setSelectedCustomer(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
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
    <div id="customers-view" className="space-y-3 pb-24">
      {/* Search Header */}
      <form onSubmit={handleSearch} className="relative">
        <input
          id="input-search-customers"
          type="text"
          placeholder="Cari nama toko, jalan, atau area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-20 py-2.5 bg-white border border-gray-200 rounded-xl text-xs placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-gray-400 shadow-xs"
        />
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 px-3 py-1 text-xs font-semibold text-white rounded-lg transition-all"
          style={{ backgroundColor: accent }}
        >
          Cari
        </button>
      </form>

      {/* Segment Filters */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        {segments.map((seg) => {
          const isSelected = selectedSegment === seg;
          return (
            <button
              key={seg}
              onClick={() => setSelectedSegment(seg)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                isSelected
                  ? 'border-transparent text-white font-bold'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: isSelected ? accent : undefined,
              }}
            >
              {seg}
            </button>
          );
        })}
      </div>

      {/* BU Isolation Notice */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
        <span>Menampilkan pelanggan unit: <strong>{businessUnit?.name}</strong></span>
        <span>{customers.length} Toko</span>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">Memuat daftar pelanggan...</div>
      ) : customers.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500 bg-white rounded-2xl border border-gray-200 p-6">
          Tidak ada pelanggan yang cocok dengan pencarian.
        </div>
      ) : (
        <div className="space-y-2.5">
          {customers.map((c) => (
            <div
              key={c.id}
              id={`customer-card-${c.id}`}
              className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xs font-bold text-gray-900">{c.name}</h3>
                    {c.status === 'at_risk' && (
                      <span className="flex items-center px-1.5 py-0.2 text-[9px] font-bold bg-rose-100 text-rose-800 rounded">
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> At Risk
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 flex items-center mt-0.5">
                    <MapPin className="w-3 h-3 mr-1 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[220px]">{c.address}</span>
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                  {c.segment}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 border-t border-gray-100">
                <span>
                  Kunjungan: <strong className={c.lastVisitDaysAgo >= 14 ? 'text-rose-600' : 'text-gray-900'}>
                    {c.lastVisitDaysAgo} hari lalu
                  </strong>
                </span>
                <span>Total Order: <strong>{c.totalOrders}x</strong></span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  id={`btn-visit-cust-${c.id}`}
                  onClick={() => onStartVisit(c.id)}
                  className="flex-1 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs text-center transition-opacity"
                  style={{ backgroundColor: accent }}
                >
                  Kunjungi
                </button>
                <button
                  id={`btn-order-cust-${c.id}`}
                  onClick={() => onCreateOrder(c.id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                >
                  Order
                </button>
                <button
                  onClick={() => handleOpenDetail(c)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:text-gray-900 border border-gray-200"
                  title="Detail Toko"
                >
                  Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div
          id="customer-detail-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
        >
          <div
            id="customer-detail-card"
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-gray-500">{selectedCustomer.segment} • {selectedCustomer.area}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Contact Info */}
              <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs">
                <p className="text-gray-700 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  {selectedCustomer.address}
                </p>
                {selectedCustomer.pic && (
                  <p className="text-gray-700 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    PIC: {selectedCustomer.pic}
                  </p>
                )}
                {selectedCustomer.phone && (
                  <p className="text-gray-700 flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {selectedCustomer.phone}
                  </p>
                )}
              </div>

              {/* Historical Visits */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-gray-500" /> Riwayat Kunjungan
                </h4>
                {selectedCustomer.visits && selectedCustomer.visits.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedCustomer.visits.map((v) => (
                      <div key={v.id} className="p-2.5 bg-white border border-gray-200 rounded-lg text-xs">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-gray-900">{v.purpose}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(v.startTime).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        {v.outcome && (
                          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            Hasil: {v.outcome}
                          </p>
                        )}
                        {v.notes && <p className="text-[11px] text-gray-500 mt-0.5">Catatan: {v.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Belum ada catatan kunjungan.</p>
                )}
              </div>

              {/* Historical Orders */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center">
                  <ShoppingBag className="w-3.5 h-3.5 mr-1 text-gray-500" /> Riwayat Order
                </h4>
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedCustomer.orders.map((o) => (
                      <div key={o.id} className="p-2.5 bg-white border border-gray-200 rounded-lg text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{o.orderNumber}</span>
                          <span className="font-bold text-gray-900">{formatRupiah(o.total)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                          <span>{new Date(o.createdAt).toLocaleDateString('id-ID')}</span>
                          <span className="uppercase font-semibold text-blue-700">{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Belum ada transaksi order.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center space-x-2">
              <button
                onClick={() => {
                  onStartVisit(selectedCustomer.id);
                  setSelectedCustomer(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-white rounded-xl shadow-xs"
                style={{ backgroundColor: accent }}
              >
                Mulai Kunjungan
              </button>
              <button
                onClick={() => {
                  onCreateOrder(selectedCustomer.id);
                  setSelectedCustomer(null);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50"
              >
                Buat Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
