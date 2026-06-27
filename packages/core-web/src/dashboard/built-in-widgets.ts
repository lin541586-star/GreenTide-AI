import { DashboardWidget } from './types';
import { dashboardWidgetRegistry } from './dashboard-widget.registry';
import { KpiRowWidget } from './widgets/KpiRowWidget';
import { RevenueChartWidget } from './widgets/RevenueChartWidget';
import { WeeklyChartWidget } from './widgets/WeeklyChartWidget';
import { TodayScheduleWidget } from './widgets/TodayScheduleWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { SystemInfoWidget } from './widgets/SystemInfoWidget';

/** 註冊所有內建 Widget */
export function registerBuiltInWidgets(): void {
  const builtInWidgets: DashboardWidget[] = [
    {
      id: 'kpi-row',
      title: 'KPI 指標',
      description: '今日預約、服務人員、營收等關鍵指標',
      defaultEnabled: true,
      layout: { sortOrder: 0, desktopColumns: 12 },
      component: KpiRowWidget,
    },
    {
      id: 'weekly-bookings',
      title: '本週預約圖表',
      description: '近 7 日預約數量長條圖',
      defaultEnabled: true,
      layout: { sortOrder: 1, desktopColumns: 6 },
      component: WeeklyChartWidget,
    },
    {
      id: 'revenue-chart',
      title: '營收趨勢',
      description: '近 7 日營業額趨勢圖',
      defaultEnabled: true,
      layout: { sortOrder: 2, desktopColumns: 6 },
      component: RevenueChartWidget,
    },
    {
      id: 'today-schedule',
      title: '今日預約',
      description: '今日預約清單',
      defaultEnabled: true,
      layout: { sortOrder: 3, desktopColumns: 4 },
      component: TodayScheduleWidget,
    },
    {
      id: 'quick-actions',
      title: '快速操作',
      description: '常用功能快速連結',
      defaultEnabled: true,
      layout: { sortOrder: 4, desktopColumns: 4 },
      component: QuickActionsWidget,
    },
    {
      id: 'system-info',
      title: '系統資訊',
      description: '店家基本資訊',
      defaultEnabled: true,
      layout: { sortOrder: 5, desktopColumns: 4 },
      component: SystemInfoWidget,
    },
  ];

  dashboardWidgetRegistry.registerWidgets(builtInWidgets);
}
