import React, { useEffect, useState } from 'react';
import { AiAssistantPanel } from './AiAssistantPanel';

const navItems = [
  { path: '/', icon: '▦', label: '儀表板' },
  { path: '/app/calendar-booking', icon: '◷', label: '預約管理' },
  // 高優先工具（可在小工具頁面啟用/停用）
  { path: '/app/crm', icon: '◉', label: '客戶管理' },
  { path: '/app/notifications', icon: '◎', label: '通知系統' },
  { path: '/app/inventory', icon: '▣', label: '庫存管理' },
  { path: '/app/analytics', icon: '◈', label: '營運報表' },
  // 設定
  { path: '/settings/plugins', icon: '⊞', label: '小工具' },
  { path: '/settings/services', icon: '⚙', label: '服務項目' },
  { path: '/settings/staff', icon: '◉', label: '服務人員' },
  { path: '/settings/business-hours', icon: '◐', label: '營業時間' },
  { path: '/settings/users', icon: '◈', label: '員工管理' },
  { path: '/settings/theme', icon: '♢', label: '佈景主題' },
  { path: '/settings/tenant', icon: '☰', label: '店家設定' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 偵測目前頁面決定 AI context
  const aiContext = (() => {
    if (currentPath.startsWith('/app/crm')) return 'crm';
    if (currentPath.startsWith('/app/inventory')) return 'inventory';
    if (currentPath.startsWith('/app/notifications')) return 'notifications';
    if (currentPath.startsWith('/app/analytics')) return 'analytics';
    if (currentPath === '/' || currentPath === '') return 'dashboard';
    return undefined;
  })();

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('tenant');
    if (u) setUser(JSON.parse(u));
    if (t) setTenant(JSON.parse(t));
    // 載入主題
    const saved = localStorage.getItem('app_theme');
    if (saved) {
      try {
        const theme = JSON.parse(saved);
        Object.entries(theme).forEach(([key, val]) => {
          document.documentElement.style.setProperty(`--${key}`, val as string);
        });
      } catch {}
    }
    const handlePop = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // 手機切換路由時自動關閉側邊欄
  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setSidebarOpen(false);
    if (path.startsWith('/app')) { window.location.href = path; return; }
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen lg:flex" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* ===== 頂部導航列（手機 + 平板顯示） ===== */}
      <header className="lg:hidden sticky top-0 z-30 glass border-b border-[#d2d2d7]/50">
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0] transition-colors"
            aria-label="選單"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {sidebarOpen ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              ) : (
                <React.Fragment>
                  <path d="M3 5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </React.Fragment>
              )}
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 4h4.5l-3.5 2.5L11 12 7 9 3 12l1.5-4.5L1 5h4.5L7 1z" fill="var(--accent-text)"/></svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{tenant?.name || '管理系統'}</span>
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[#e8e8ed] flex items-center justify-center">
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{user?.name?.charAt(0) || '?'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ===== 手機側邊欄 Overlay ===== */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== 側邊欄（電腦固定 / 手機滑出） ===== */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-0 left-0 z-50
        w-64 h-full lg:h-screen
        glass border-r
        flex flex-col shrink-0
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        {/* Logo — 電腦顯示 */}
        <div className="hidden lg:block px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l1.5 4h4.5l-3.5 2.5L11 12 7 9 3 12l1.5-4.5L1 5h4.5L7 1z" fill="var(--accent-text)"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{tenant?.name || '管理系統'}</h2>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{user?.role === 'owner' ? '店家管理員' : user?.role}</span>
            </div>
          </div>
        </div>

        {/* 手機側邊欄關閉鈕 */}
        <div className="lg:hidden flex justify-end px-3 pt-3">
          <button onClick={() => setSidebarOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* 導航 */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentPath === item.path ||
              (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <a key={item.path} href={item.path} onClick={(e) => handleNav(e, item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'font-medium shadow-sm'
                    : 'text-[#8a8885] hover:text-[#1d1d1f] hover:bg-white/50'
                }`}
                style={isActive ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' } : undefined}
              >
                <span className="w-5 text-center text-base shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* 底部使用者 */}
        <div className="px-4 py-3.5 border-t border-[#d2d2d7]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#e8e8ed] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{user?.name?.charAt(0) || '?'}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
                <div className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              className="text-[10px] transition-colors shrink-0 px-2 py-1 rounded-md hover:bg-white/50"
              style={{ color: 'var(--text-secondary)' }}>
              登出
            </button>
          </div>
        </div>
      </aside>

      {/* ===== 主內容 ===== */}
      <main className="flex-1 min-w-0">
        <div className="animate-fade-in max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* AI 智慧助手浮動面板 */}
      <AiAssistantPanel context={aiContext} />
    </div>
  );
}
