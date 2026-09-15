import React from 'react';
import { LayoutDashboard, Users, Navigation, ShoppingBag, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'dashboard' | 'customers' | 'visits' | 'orders' | 'attendance';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  hasActiveVisit?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  hasActiveVisit,
}) => {
  const { theme } = useAuth();
  const accentColor = theme?.accent || '#C97A3A';

  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'customers', label: 'Pelanggan', icon: <Users className="w-5 h-5" /> },
    {
      id: 'visits',
      label: 'Kunjungan',
      icon: <Navigation className="w-5 h-5" />,
      badge: hasActiveVisit,
    },
    { id: 'orders', label: 'Order', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'attendance', label: 'Absensi', icon: <Clock className="w-5 h-5" /> },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t safe-area-pb shadow-md"
      style={{ borderColor: theme?.borderColor || '#E5E7EB' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1 px-3 min-w-[60px] text-xs transition-colors rounded-lg"
              style={{
                color: isActive ? accentColor : '#6B7280',
              }}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white animate-pulse"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </div>
              <span
                className={`mt-1 text-[11px] leading-tight ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="w-4 h-0.5 mt-0.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
