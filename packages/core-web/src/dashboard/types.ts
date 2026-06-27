import { ReactNode } from 'react';

/** Widget 尺寸 */
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

/** Widget 在網格中的位置設定 */
export interface WidgetLayout {
  /** 預設排序（數字越小越前面） */
  sortOrder: number;
  /** 桌機版網格欄數佔比（基於 12 欄網格） */
  desktopColumns: 3 | 4 | 6 | 8 | 12;
  /** 平板版網格欄數 */
  tabletColumns?: 3 | 4 | 6 | 8 | 12;
}

/** Dashboard Widget 定義 */
export interface DashboardWidget {
  /** 唯一識別碼 */
  id: string;
  /** 顯示名稱 */
  title: string;
  /** 簡短描述 */
  description?: string;
  /** 是否預設啟用 */
  defaultEnabled: boolean;
  /** 佈局設定 */
  layout: WidgetLayout;
  /** Widget 元件 */
  component: React.ComponentType<WidgetProps>;
}

/** Widget 收到的 Props */
export interface WidgetProps {
  /** Widget 設定（可由使用者在儀表板設定中調整） */
  config?: Record<string, any>;
}

/** Widget 實例（已啟用並帶有使用者設定的 Widget） */
export interface WidgetInstance {
  widgetId: string;
  enabled: boolean;
  config?: Record<string, any>;
}

/** 儀表板統計資料 */
export interface DashboardStats {
  todayBookings: number;
  todayBookingsDelta?: string;
  totalStaff: number;
  activeServices: number;
  monthlyRevenue: number;
  monthlyRevenueDelta?: string;
  weeklyBookings: { date: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
  recentBookings: {
    id: string;
    customerName: string;
    staffName: string;
    serviceName?: string;
    startTime: string;
    endTime: string;
    status: string;
  }[];
  todayBookingsByHour: { hour: string; count: number }[];
}

/** Widget 註冊函數型別 — 插件可透過此函數註冊自己的 Widget */
export type WidgetRegistryFunction = (widget: DashboardWidget) => void;
