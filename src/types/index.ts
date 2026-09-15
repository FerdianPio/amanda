export interface BusinessUnitTheme {
  primaryColor: string;
  primaryDarkColor: string;
  accent: string;
  accentSoft: string;
  backgroundColor: string;
  surfaceColor: string;
  surfaceSunkenColor: string;
  textPrimaryColor: string;
  textMutedColor: string;
  textFaintColor: string;
  borderColor: string;
  initials: string;
}

export interface BusinessUnit {
  id: string;
  code: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'sales' | 'supervisor' | 'admin';
  businessUnitId: string;
  area: string;
  initials: string;
}

export interface Customer {
  id: string;
  name: string;
  segment: string;
  address: string;
  pic?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  area?: string;
  status: 'active' | 'at_risk' | 'inactive';
  lastVisitDaysAgo: number;
  totalOrders: number;
  visits?: CustomerVisit[];
  orders?: CustomerOrderSummary[];
}

export interface CustomerVisit {
  id: string;
  purpose: string;
  outcome?: string;
  notes?: string;
  hasPhoto: boolean;
  status: string;
  startTime: number;
  endTime?: number;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  needsApproval: boolean;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  sku: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  userId: string;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
  totalQty: number;
  needsApproval: boolean;
  status: 'draft' | 'pending_approval' | 'submitted' | 'approved' | 'rejected' | 'delivered';
  approvalReason?: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id?: string;
  status: 'not_checked_in' | 'on_time' | 'late' | 'completed' | 'outside_geofence';
  checkInTime?: number | null;
  checkOutTime?: number | null;
  accuracy?: number;
  late?: boolean;
  notes?: string;
}

export interface DashboardData {
  target: {
    periodLabel: string;
    targetAmount: number;
    achievedAmount: number;
    achievementPct: number;
  };
  attendance: AttendanceRecord | null;
  stats: {
    customerCount: number;
    todaysVisits: number;
    todaysOrders: number;
    followUpsCount: number;
  };
  priorityCustomers: {
    id: string;
    name: string;
    segment: string;
    address: string;
    lastVisitDaysAgo: number;
    status: string;
  }[];
  insights: {
    id: string;
    type: string;
    text: string;
    severity: string;
  }[];
  teamOverview?: {
    id: string;
    name: string;
    achievementPct: number;
    status: string;
  }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  timestamp: number;
}

export interface ActivityItem {
  id: string;
  type: 'checkin' | 'checkout' | 'visit' | 'order';
  description: string;
  timestamp: number;
}

export interface AdminSummary {
  totalRevenue: number;
  totalTarget: number;
  overallPct: number;
  totalCustomers: number;
  totalOrders: number;
  activeSalesCount: number;
  checkedInTodayCount: number;
  pendingApprovalsCount: number;
}

export interface AdminBusinessUnitMetric {
  id: string;
  code: string;
  name: string;
  description: string;
  accent: string;
  accentSoft: string;
  primaryColor: string;
  salesCount: number;
  customerCount: number;
  monthRevenue: number;
  monthOrdersCount: number;
  totalTarget: number;
  achievementPct: number;
}

export interface AdminSalesMember {
  id: string;
  name: string;
  email: string;
  role: 'sales' | 'supervisor';
  area: string;
  initials: string;
  businessUnitId: string;
  businessUnitName: string;
  attendanceStatus: 'not_checked_in' | 'on_time' | 'late' | 'completed' | 'outside_geofence';
  checkInTime: number | null;
  checkOutTime: number | null;
  isLate: boolean;
  todaysVisits: number;
  todaysOrders: number;
  targetAmount: number;
  achievedAmount: number;
  achievementPct: number;
}

export interface AdminPendingApproval {
  id: string;
  orderNumber: string;
  total: number;
  totalQty: number;
  discountPct: number;
  discountAmount: number;
  approvalReason?: string;
  customerName: string;
  customerArea?: string;
  salesName: string;
  businessUnitName: string;
  createdAt: number;
}

export interface AdminRecentActivity {
  id: string;
  action: string;
  details: string;
  userName: string;
  userInitials: string;
  businessUnitName: string;
  createdAt: number;
}

export interface AdminOverviewData {
  summary: AdminSummary;
  businessUnits: AdminBusinessUnitMetric[];
  salesTeam: AdminSalesMember[];
  pendingApprovals: AdminPendingApproval[];
  recentActivity: AdminRecentActivity[];
}
