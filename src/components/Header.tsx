import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Bell, Palette, User as UserIcon, CheckCheck, RefreshCw, LayoutDashboard } from 'lucide-react';
import { NotificationItem } from '../types';

interface HeaderProps {
  onOpenThemeModal: () => void;
  onOpenNotifications: () => void;
  onOpenUserSwitcher: () => void;
  onSwitchToWebAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenThemeModal,
  onOpenNotifications,
  onOpenUserSwitcher,
  onSwitchToWebAdmin,
}) => {
  const { user, businessUnit, theme } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const notifs = await api.getNotifications();
      const unread = notifs.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 w-full px-4 py-3 bg-white border-b shadow-xs transition-colors"
      style={{ borderColor: theme?.borderColor || '#E5E7EB' }}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Left: BU branding */}
        <div className="flex items-center space-x-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs"
            style={{ backgroundColor: theme?.accent || '#C97A3A' }}
          >
            {theme?.initials || 'AG'}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {businessUnit?.name || 'Amanda Group'}
              </span>
            </div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">
              SFA Mobile
            </h1>
          </div>
        </div>

        {/* Right actions: Web Admin Switcher, Theme, Notification, User Switcher */}
        <div className="flex items-center space-x-1.5">
          {/* Switch to Web Dashboard Button */}
          {onSwitchToWebAdmin && (
            <button
              id="btn-switch-to-web-dashboard"
              onClick={onSwitchToWebAdmin}
              className="flex items-center space-x-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-md text-[11px] font-semibold transition-colors"
              title="Buka Web Dashboard Admin / Eksekutif"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web Admin</span>
            </button>
          )}

          {/* Theme customizer button */}
          <button
            id="btn-theme-customizer"
            onClick={onOpenThemeModal}
            className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
            title="Kustomisasi Tema Branding BU"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Notifications button */}
          <button
            id="btn-notifications-toggle"
            onClick={onOpenNotifications}
            className="relative p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white rounded-full"
                style={{ backgroundColor: theme?.accent || '#C97A3A' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* User profile & Quick Switcher button */}
          <button
            id="btn-user-switcher-trigger"
            onClick={onOpenUserSwitcher}
            className="flex items-center space-x-1.5 pl-2 pr-2.5 py-1 text-xs font-medium rounded-full border transition-all"
            style={{
              backgroundColor: theme?.accentSoft || '#F5E7DA',
              borderColor: theme?.accent || '#C97A3A',
              color: '#1F2937',
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: theme?.accent || '#C97A3A' }}
            >
              {user?.initials || 'U'}
            </span>
            <span className="font-semibold">{user?.name.split(' ')[0]}</span>
            <span className="text-[10px] uppercase px-1 py-0.2 bg-white/80 rounded text-gray-700 font-bold">
              {user?.role === 'supervisor' ? 'Spv' : 'Sales'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
