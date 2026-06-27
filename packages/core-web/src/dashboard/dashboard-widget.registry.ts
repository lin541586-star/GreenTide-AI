import { DashboardWidget, WidgetInstance } from './types';

/**
 * Dashboard Widget Registry
 *
 * 這是一個全域的 Widget 註冊中心。
 * - 內建 Widget 在應用程式啟動時註冊
 * - 插件可以呼叫 `registerWidget()` 來註冊自己的 Widget
 * - Dashboard 頁面根據使用者設定決定顯示哪些 Widget
 *
 * 使用方式（插件中）：
 * ```ts
 * import { dashboardWidgetRegistry } from '../../dashboard/dashboard-widget.registry';
 *
 * dashboardWidgetRegistry.registerWidget({
 *   id: 'my-plugin-widget',
 *   title: '我的插件',
 *   defaultEnabled: true,
 *   layout: { sortOrder: 50, desktopColumns: 4 },
 *   component: MyWidgetComponent,
 * });
 * ```
 */
class DashboardWidgetRegistry {
  private widgets = new Map<string, DashboardWidget>();
  private listeners: Array<() => void> = [];

  /** 註冊一個 Widget */
  registerWidget(widget: DashboardWidget): void {
    if (this.widgets.has(widget.id)) {
      console.warn(`[DashboardWidgetRegistry] Widget "${widget.id}" 已存在，將被覆蓋`);
    }
    this.widgets.set(widget.id, widget);
    this.notify();
  }

  /** 批量註冊 Widget */
  registerWidgets(widgets: DashboardWidget[]): void {
    for (const w of widgets) {
      this.registerWidget(w);
    }
  }

  /** 取得所有已註冊的 Widget */
  getAllWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values()).sort(
      (a, b) => a.layout.sortOrder - b.layout.sortOrder
    );
  }

  /** 取得某個 Widget 定義 */
  getWidget(id: string): DashboardWidget | undefined {
    return this.widgets.get(id);
  }

  /** 取消註冊 */
  unregisterWidget(id: string): void {
    this.widgets.delete(id);
    this.notify();
  }

  /** 訂閱註冊變更（支援 React 整合） */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /** 取得預設啟用的 Widget 列表 */
  getDefaultEnabledWidgets(): string[] {
    return this.getAllWidgets()
      .filter((w) => w.defaultEnabled)
      .map((w) => w.id);
  }

  /** 根據使用者設定過濾並排序 Widget */
  getActiveWidgets(instances: WidgetInstance[]): DashboardWidget[] {
    const enabledIds = new Set(
      instances.filter((i) => i.enabled).map((i) => i.widgetId)
    );
    return this.getAllWidgets()
      .filter((w) => enabledIds.has(w.id))
      .sort(
        (a, b) =>
          a.layout.sortOrder - b.layout.sortOrder
      );
  }
}

/** 全域單例 */
export const dashboardWidgetRegistry = new DashboardWidgetRegistry();
