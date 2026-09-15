import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { ThemeEditorModal } from './components/ThemeEditorModal';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { DevToolsBar } from './components/DevToolsBar';

import { DashboardView } from './views/DashboardView';
import { CustomersView } from './views/CustomersView';
import { VisitsView } from './views/VisitsView';
import { OrdersView } from './views/OrdersView';
import { AttendanceView } from './views/AttendanceView';
import { AdminWebDashboard } from './views/AdminWebDashboard';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'web_admin' | 'mobile_sales'>(() => {
    const saved = localStorage.getItem('sfa_view_mode');
    if (saved === 'web_admin' || saved === 'mobile_sales') return saved;
    return 'web_admin';
  });

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Cross-view context
  const [targetCustomerIdForVisit, setTargetCustomerIdForVisit] = useState<string | null>(null);
  const [targetCustomerIdForOrder, setTargetCustomerIdForOrder] = useState<string | null>(null);

  // Auto-adapt mode on user role change if user has not explicitly locked preference
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem('sfa_view_mode');
    if (!saved) {
      if (user.role === 'admin' || user.role === 'supervisor') {
        setViewMode('web_admin');
      } else {
        setViewMode('mobile_sales');
      }
    }
  }, [user?.role]);

  const handleSetViewMode = (mode: 'web_admin' | 'mobile_sales') => {
    setViewMode(mode);
    localStorage.setItem('sfa_view_mode', mode);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-700">Menghubungkan ke PostgreSQL Amanda SFA...</p>
      </div>
    );
  }

  const handleStartVisitCustomer = (customerId: string) => {
    setTargetCustomerIdForVisit(customerId);
    setActiveTab('visits');
  };

  const handleCreateOrderCustomer = (customerId: string) => {
    setTargetCustomerIdForOrder(customerId);
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-900 font-sans antialiased">
      {/* 1. Full Desktop Web Dashboard Mode */}
      {viewMode === 'web_admin' ? (
        <div className="w-full min-h-screen flex flex-col">
          <AdminWebDashboard
            onSwitchToMobileView={() => handleSetViewMode('mobile_sales')}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
          />

          {/* Floating Dev Tools */}
          <DevToolsBar />
        </div>
      ) : (
        /* 2. Mobile Smartphone Mockup Mode */
        <div className="min-h-screen bg-gray-200/90 flex justify-center py-0 sm:py-6">
          <div className="w-full max-w-md bg-gray-50 min-h-screen sm:min-h-[840px] sm:max-h-[90vh] flex flex-col shadow-2xl relative sm:rounded-3xl overflow-hidden border border-gray-300">
            {/* Header with Switch to Web Admin */}
            <Header
              onOpenThemeModal={() => setIsThemeModalOpen(true)}
              onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
              onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
              onSwitchToWebAdmin={() => handleSetViewMode('web_admin')}
            />

            {/* Main Mobile View Area */}
            <main className="flex-1 p-4 overflow-y-auto">
              {activeTab === 'dashboard' && (
                <DashboardView
                  onStartVisitCustomer={handleStartVisitCustomer}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersView
                  onStartVisit={handleStartVisitCustomer}
                  onCreateOrder={handleCreateOrderCustomer}
                />
              )}

              {activeTab === 'visits' && (
                <VisitsView
                  initialCustomerId={targetCustomerIdForVisit}
                  onOrderForCustomer={handleCreateOrderCustomer}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersView initialCustomerId={targetCustomerIdForOrder} />
              )}

              {activeTab === 'attendance' && <AttendanceView />}
            </main>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

            {/* Floating Dev Tools Bar for Scenario Verification & Reset */}
            <DevToolsBar />
          </div>
        </div>
      )}

      {/* Global Modals and Drawers */}
      <ThemeEditorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      <UserSwitcherModal
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
