import {
  User,
  BusinessUnit,
  BusinessUnitTheme,
  Customer,
  Product,
  Order,
  DashboardData,
  AttendanceRecord,
  NotificationItem,
  ActivityItem,
  AdminOverviewData,
} from '../types';

let authToken: string | null = localStorage.getItem('sfa_auth_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('sfa_auth_token', token);
  } else {
    localStorage.removeItem('sfa_auth_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || json.message || 'Request failed');
  }

  return json.data;
}

export const api = {
  // Auth
  getDemoAccounts: () =>
    request<any[]>('/api/auth/demo-accounts'),

  login: (credentials: { email?: string; userId?: string; password?: string }) =>
    request<{
      token: string;
      user: User;
      businessUnit: BusinessUnit;
      theme: BusinessUnitTheme;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getCurrentUser: () =>
    request<{
      user: User;
      businessUnit: BusinessUnit;
      theme: BusinessUnitTheme;
    }>('/api/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  // Dashboard
  getDashboard: () =>
    request<DashboardData>('/api/dashboard'),

  getAdminOverview: () =>
    request<AdminOverviewData>('/api/dashboard/admin-overview'),

  // Customers
  getCustomers: (params?: { q?: string; segment?: string }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.segment) sp.set('segment', params.segment);
    return request<Customer[]>(`/api/customers?${sp.toString()}`);
  },

  getCustomerDetail: (id: string) =>
    request<Customer>(`/api/customers/${id}`),

  // Products
  getProducts: () =>
    request<Product[]>('/api/products'),

  // Attendance
  getTodayAttendance: () =>
    request<AttendanceRecord | null>('/api/attendance/today'),

  checkIn: (payload?: { accuracy?: number; latitude?: number; longitude?: number }) =>
    request<AttendanceRecord>('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),

  checkOut: () =>
    request<AttendanceRecord>('/api/attendance/check-out', {
      method: 'POST',
    }),

  // Visits
  getActiveVisit: () =>
    request<any | null>('/api/visits/active'),

  startVisit: (customerId: string) =>
    request<any>('/api/visits/start', {
      method: 'POST',
      body: JSON.stringify({ customerId }),
    }),

  endVisit: (payload: {
    visitId: string;
    purpose: string;
    outcome: string;
    notes?: string;
    hasPhoto?: boolean;
  }) =>
    request<any>('/api/visits/end', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Orders
  getOrders: (params?: { status?: string; customerId?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.customerId) sp.set('customerId', params.customerId);
    return request<Order[]>(`/api/orders?${sp.toString()}`);
  },

  createOrder: (payload: {
    customerId: string;
    items: Record<string, number>;
    discountPct: number;
    visitId?: string;
  }) =>
    request<{
      id: string;
      orderNumber: string;
      customerId: string;
      total: number;
      totalQty: number;
      needsApproval: boolean;
      status: string;
      createdAt: number;
    }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  approveOrder: (id: string, notes?: string) =>
    request<{ success: boolean; message: string }>(`/api/orders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  rejectOrder: (id: string, reason: string) =>
    request<{ success: boolean; message: string }>(`/api/orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Targets
  getTargets: () =>
    request<{
      periodLabel: string;
      targetAmount: number;
      achievedAmount: number;
      achievementPct: number;
      remaining: number;
      weeklyProgression: number[];
    }>('/api/targets/me'),

  // Insights
  getInsights: () =>
    request<any[]>('/api/insights'),

  // Notifications
  getNotifications: () =>
    request<NotificationItem[]>('/api/notifications'),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'PUT',
    }),

  // Activity Feed
  getActivityFeed: () =>
    request<ActivityItem[]>('/api/activity-feed'),

  // Business Units & Theme
  updateTheme: (buId: string, colors: { accentColor?: string; accentSoftColor?: string; primaryColor?: string }) =>
    request<{ success: boolean }>('/api/business-units/' + buId + '/theme', {
      method: 'PUT',
      body: JSON.stringify(colors),
    }),

  // Dev Tools
  setupDatabase: () =>
    request<{ success: boolean; tables: string[]; message: string }>('/api/dev/setup', {
      method: 'POST',
    }),

  migrateDatabase: () =>
    request<{ success: boolean; tables: string[]; message: string }>('/api/dev/migrate', {
      method: 'POST',
    }),

  getDbStatus: () =>
    request<{ success: boolean; migrated: boolean; tables: string[]; userCount: number }>(
      '/api/dev/db-status'
    ),

  resetDatabase: () =>
    request<{ success: boolean; message: string }>('/api/dev/reset', {
      method: 'POST',
    }),

  verifyDatabase: () =>
    request<{ success: boolean; data: { test: string; passed: boolean }[] }>('/api/dev/verify'),
};
