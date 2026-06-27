import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth-store';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './dashboard/DashboardPage';
import { PluginSettings } from './pages/PluginSettings';
import { TenantSettings } from './pages/TenantSettings';
import { PluginRouteRenderer } from './plugin-system/PluginRouteRenderer';
import { BookingPage } from './pages/BookingPage';
import { StaffSettings } from './pages/StaffSettings';
import { ServicesSettings } from './pages/ServicesSettings';
import { BusinessHoursSettings } from './pages/BusinessHoursSettings';
import { UsersSettings } from './pages/UsersSettings';
import { ThemeSettings } from './pages/ThemeSettings';
import { CrmPage } from './pages/CrmPage';
import { NotificationPage } from './pages/NotificationPage';
import { InventoryPage } from './pages/InventoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export default function App() {
  const { isLoggedIn } = useAuthStore();

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/settings/plugins" element={<PluginSettings />} />
        <Route path="/settings/tenant" element={<TenantSettings />} />
        <Route path="/settings/staff" element={<StaffSettings />} />
        <Route path="/settings/services" element={<ServicesSettings />} />
        <Route path="/settings/business-hours" element={<BusinessHoursSettings />} />
        <Route path="/settings/users" element={<UsersSettings />} />
        <Route path="/settings/theme" element={<ThemeSettings />} />
        {/* 預約日曆 */}
        <Route path="/app/calendar-booking" element={<BookingPage />} />
        {/* 新工具模組 */}
        <Route path="/app/crm" element={<CrmPage />} />
        <Route path="/app/notifications" element={<NotificationPage />} />
        <Route path="/app/inventory" element={<InventoryPage />} />
        <Route path="/app/analytics" element={<AnalyticsPage />} />
        {/* Plugin 路由動態載入 */}
        <Route path="/app/*" element={<PluginRouteRenderer />} />
      </Routes>
    </Layout>
  );
}
