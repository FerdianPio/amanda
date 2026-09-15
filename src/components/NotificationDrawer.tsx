import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';
import { X, CheckCheck, Bell, Info } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { theme } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      id="notification-drawer-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
    >
      <div
        id="notification-card"
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-gray-700" />
            <h2 className="text-sm font-bold text-gray-900">Notifikasi</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="btn-mark-all-read"
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-100"
              title="Tandai Semua Dibaca"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-0.5" />
              <span>Baca Semua</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400">Memuat notifikasi...</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">Tidak ada notifikasi</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition-colors ${
                  n.read ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-gray-900 leading-snug">{n.title}</h4>
                  {!n.read && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 ml-2"
                      style={{ backgroundColor: theme?.accent || '#C97A3A' }}
                    />
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">{n.message}</p>
                <p className="mt-2 text-[10px] text-gray-400">
                  {new Date(n.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
