import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { dashboardWidgetRegistry } from './dashboard-widget.registry';
import { registerBuiltInWidgets } from './built-in-widgets';
import { DashboardWidget, WidgetInstance, DashboardStats } from './types';
import { useDashboardStats } from './use-dashboard-stats';
import client from '../api/client';

/** 把 widget grid columns 轉成 Tailwind class */
function gridClass(columns: number): string {
  switch (columns) {
    case 12: return 'col-span-full';
    case 8: return 'md:col-span-8';
    case 6: return 'md:col-span-6';
    case 5: return 'md:col-span-5';
    case 4: return 'md:col-span-4';
    case 3: return 'md:col-span-3';
    default: return 'md:col-span-6';
  }
}

/** Widget 包裝卡片（加入通用邊框、標題列） */
function WidgetWrapper({ widget, children }: { widget: DashboardWidget; children: React.ReactNode }) {
  return (
    <div className={`${gridClass(widget.layout.desktopColumns)}`}>
      {children}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return '早安';
  if (h < 18) return '午安';
  return '晚安';
}

export function DashboardPage() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [instances, setInstances] = useState<WidgetInstance[]>([]);
  const [greeting, setGreeting] = useState(getGreeting);
  const { stats, loading } = useDashboardStats();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');

  // 更新問候語
  useEffect(() => {
    const timer = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 註冊內建 Widget + 從 localStorage 讀取使用者設定
  useEffect(() => {
    registerBuiltInWidgets();

    // 嘗試從 localStorage 讀取 widget 設定
    const saved = localStorage.getItem('dashboard-widgets');
    let widgetInstances: WidgetInstance[];
    if (saved) {
      try {
        widgetInstances = JSON.parse(saved);
      } catch {
        widgetInstances = dashboardWidgetRegistry
          .getDefaultEnabledWidgets()
          .map((id) => ({ widgetId: id, enabled: true }));
      }
    } else {
      widgetInstances = dashboardWidgetRegistry
        .getDefaultEnabledWidgets()
        .map((id) => ({ widgetId: id, enabled: true }));
    }

    setInstances(widgetInstances);
    setWidgets(dashboardWidgetRegistry.getActiveWidgets(widgetInstances));
  }, []);

  // 當 stats 載入完成，更新 widget configs
  const getWidgetConfig = useCallback(
    (widgetId: string): Record<string, any> | undefined => {
      if (loading) return undefined;

      switch (widgetId) {
        case 'kpi-row':
          return {
            items: [
              {
                title: '今日預約',
                value: stats.todayBookings,
                subtitle: stats.todayBookings > 0 ? `${stats.recentBookings?.length || 0} 位顧客` : '尚無預約',
                delta: stats.todayBookingsDelta,
                deltaType: stats.todayBookings > 0 ? 'moderateIncrease' : 'unchanged',
              },
              { title: '服務人員', value: stats.totalStaff, subtitle: stats.totalStaff > 0 ? '上線中' : '尚無人員' },
              { title: '服務項目', value: stats.activeServices, subtitle: stats.activeServices > 0 ? '可預約' : '尚無項目' },
              {
                title: '本月營收',
                value: stats.monthlyRevenue > 0 ? `$${stats.monthlyRevenue.toLocaleString()}` : '—',
                subtitle: stats.monthlyRevenue > 0 ? '本月累計' : '尚無資料',
                delta: stats.monthlyRevenueDelta,
                deltaType: 'moderateIncrease',
              },
            ],
          };
        case 'weekly-bookings':
          return {
            data: stats.weeklyBookings,
            total: stats.weeklyBookings.reduce((sum, d) => sum + d.count, 0),
          };
        case 'revenue-chart':
          return {
            data: stats.revenueByDay,
          };
        case 'today-schedule':
          return {
            bookings: stats.recentBookings,
          };
        default:
          return undefined;
      }
    },
    [stats, loading]
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* 問候列 */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
          {greeting}，{user.name || '管理員'}
        </h1>
        <p className="text-sm text-[#8a8885] mt-1">
          {tenant.name || '店家管理系統'}
        </p>
      </div>

      {/* Widget 網格 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {widgets.map((widget) => {
          const config = getWidgetConfig(widget.id);
          const WidgetComponent = widget.component;

          return (
            <WidgetWrapper key={widget.id} widget={widget}>
              <div className="animate-scale-in">
                <WidgetComponent config={config} />
              </div>
            </WidgetWrapper>
          );
        })}
      </div>
    </div>
  );
}
