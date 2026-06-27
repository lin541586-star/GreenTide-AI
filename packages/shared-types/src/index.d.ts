export interface Tenant {
    id: string;
    name: string;
    industry: Industry;
    plan: SubscriptionTier;
    active: boolean;
    createdAt: Date;
}
export type Industry = 'restaurant' | 'retail' | 'beauty' | 'fitness' | 'clinic' | 'education' | 'other';
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
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
export type PluginCategory = 'booking' | 'inventory' | 'sales' | 'hr' | 'marketing' | 'analytics' | 'customer' | 'other';
export interface PluginRegistry {
    tenantId: string;
    pluginId: string;
    enabled: boolean;
    config: Record<string, unknown>;
    installedAt: Date;
    updatedAt: Date;
}
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
//# sourceMappingURL=index.d.ts.map