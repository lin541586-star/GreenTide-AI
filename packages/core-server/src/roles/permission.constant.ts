/** 系統權限定義 */
export const PERMISSIONS = {
  BOOKING: {
    VIEW: 'booking.view',
    CREATE: 'booking.create',
    EDIT: 'booking.edit',
    DELETE: 'booking.delete',
  },
  SERVICES: {
    VIEW: 'services.view',
    CREATE: 'services.create',
    EDIT: 'services.edit',
    DELETE: 'services.delete',
  },
  STAFF: {
    VIEW: 'staff.view',
    CREATE: 'staff.create',
    EDIT: 'staff.edit',
    DELETE: 'staff.delete',
  },
  BUSINESS_HOURS: {
    VIEW: 'business-hours.view',
    EDIT: 'business-hours.edit',
  },
  PLUGINS: {
    VIEW: 'plugins.view',
    ENABLE: 'plugins.enable',
  },
  TENANT: {
    VIEW: 'tenant.view',
    EDIT: 'tenant.edit',
  },
  USERS: {
    VIEW: 'users.view',
    CREATE: 'users.create',
    EDIT: 'users.edit',
    DELETE: 'users.delete',
    PERMISSIONS: 'users.permissions',
  },
  REPORTS: {
    VIEW: 'reports.view',
  },
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];

/** 所有權限列表（用於 UI 呈現） */
export const PERMISSION_LIST = [
  { code: 'booking.view', label: '檢視預約', category: '預約管理' },
  { code: 'booking.create', label: '新增預約', category: '預約管理' },
  { code: 'booking.edit', label: '編輯預約', category: '預約管理' },
  { code: 'booking.delete', label: '刪除預約', category: '預約管理' },
  { code: 'services.view', label: '檢視服務項目', category: '服務項目' },
  { code: 'services.create', label: '新增服務項目', category: '服務項目' },
  { code: 'services.edit', label: '編輯服務項目', category: '服務項目' },
  { code: 'services.delete', label: '刪除服務項目', category: '服務項目' },
  { code: 'staff.view', label: '檢視服務人員', category: '服務人員' },
  { code: 'staff.create', label: '新增服務人員', category: '服務人員' },
  { code: 'staff.edit', label: '編輯服務人員', category: '服務人員' },
  { code: 'staff.delete', label: '刪除服務人員', category: '服務人員' },
  { code: 'business-hours.view', label: '檢視營業時間', category: '營業時間' },
  { code: 'business-hours.edit', label: '編輯營業時間', category: '營業時間' },
  { code: 'plugins.view', label: '檢視小工具', category: '小工具' },
  { code: 'plugins.enable', label: '啟用/停用小工具', category: '小工具' },
  { code: 'tenant.view', label: '檢視店家設定', category: '店家設定' },
  { code: 'tenant.edit', label: '編輯店家設定', category: '店家設定' },
  { code: 'users.view', label: '檢視員工帳號', category: '員工管理' },
  { code: 'users.create', label: '新增員工帳號', category: '員工管理' },
  { code: 'users.edit', label: '編輯員工帳號', category: '員工管理' },
  { code: 'users.delete', label: '刪除員工帳號', category: '員工管理' },
  { code: 'users.permissions', label: '設定權限角色', category: '員工管理' },
  { code: 'reports.view', label: '檢視報表', category: '報表' },
] as const;
