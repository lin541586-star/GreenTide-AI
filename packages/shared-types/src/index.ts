// ============ 店家/租戶 ============
export interface Tenant {
  id: string;
  name: string;
  industry: Industry;
  plan: SubscriptionTier;
  active: boolean;
  createdAt: Date;
}

export type Industry =
  | 'restaurant'    // 餐飲
  | 'retail'        // 零售
  | 'beauty'        // 美容
  | 'fitness'       // 健身
  | 'clinic'        // 診所
  | 'education'     // 教育
  | 'other';

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

// ============ 使用者/員工 ============
export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'staff';

// ============ Plugin 定義 ============
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  category: PluginCategory;
  /** 適用行業 */
  industries: Industry[];
  /** 後端模組路徑 (相對於 plugin 目錄) */
  serverEntry?: string;
  /** 前端路由 */
  routes: PluginRoute[];
  /** 所需權限 */
  permissions: string[];
  /** 訂閱等級要求 */
  minTier: SubscriptionTier;
}

export interface PluginRoute {
  path: string;
  label: string;
  icon?: string;
  /** 前端組件路徑 (相對路徑) */
  component: string;
}

export type PluginCategory =
  | 'booking'       // 預約類
  | 'inventory'     // 庫存類
  | 'sales'         // 銷售類
  | 'hr'            // 人事類
  | 'marketing'     // 行銷類
  | 'analytics'     // 分析類
  | 'customer'      // 客戶類
  | 'other';

// ============ Plugin Registry ============
export interface PluginRegistry {
  tenantId: string;
  pluginId: string;
  enabled: boolean;
  config: Record<string, unknown>;
  installedAt: Date;
  updatedAt: Date;
}

// ============ API 通用型別 ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============ Auth ============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
  tenant: Tenant;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ============ 日曆預約 - 服務人員 ============
export interface Staff {
  id: string;
  tenantId: string;
  name: string;
  title?: string;
  bio?: string;
  color: string;
  active: boolean;
  createdAt: Date;
}

// ============ 日曆預約 - 服務項目（商家自訂） ============
export interface Service {
  id: string;
  tenantId: string;
  name: string;
  duration: number;   // 分鐘
  price?: number;     // 元
  color: string;
  active: boolean;
  createdAt: Date;
}

// ============ 日曆預約 - 預約記錄 ============
export interface Booking {
  id: string;
  tenantId: string;
  staffId: string;
  serviceId?: string;
  customerName: string;
  customerContact?: string;
  source: 'manual' | 'line' | 'fb' | 'ig';
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  note?: string;
  createdAt: Date;
}
