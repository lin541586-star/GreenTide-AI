import React from 'react';

export function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');

  const stats = [
    { value: '0', label: '今日預約', sub: '尚無預約', color: '#1d1d1f' },
    { value: '3', label: '服務人員', sub: '小美 · 阿豪 · 婷婷', color: '#1d1d1f' },
    { value: '3', label: '服務項目', sub: '剪髮 · 染髮 · 按摩', color: '#1d1d1f' },
    { value: '—', label: '本月營收', sub: '尚無資料', color: '#1d1d1f' },
  ];

  const quickLinks = [
    { title: '查看今日預約', path: '/app/calendar-booking', desc: '管理與檢視預約時段' },
    { title: '管理服務項目', path: '/settings/services', desc: '新增或編輯服務內容' },
    { title: '管理小工具', path: '/settings/plugins', desc: '啟用/停用店家功能' },
    { title: '店家設定', path: '/settings/tenant', desc: '修改店家資訊' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* 問候 */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
          早安，{user.name}
        </h1>
        <p className="text-sm text-[#86868b] mt-1">{tenant.name}</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl shadow-apple p-5 card-hover animate-scale-in"
          >
            <div className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">{stat.value}</div>
            <div className="text-sm font-medium text-[#86868b] mt-1">{stat.label}</div>
            <div className="text-[11px] text-[#aeaeb2] mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#86868b] uppercase tracking-wider mb-3">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className="bg-white rounded-2xl shadow-apple p-5 card-hover animate-slide-up
                         flex items-center justify-between group"
              onClick={(e) => {
                if (link.path.startsWith('/app')) { return; }
                e.preventDefault();
                window.history.pushState({}, '', link.path);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
            >
              <div>
                <div className="text-sm font-medium text-[#1d1d1f] group-hover:text-[#1d1d1f]">{link.title}</div>
                <div className="text-xs text-[#86868b] mt-0.5">{link.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#aeaeb2] group-hover:text-[#1d1d1f] transition-colors">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* 系統資訊 */}
      <div>
        <h2 className="text-sm font-semibold text-[#86868b] uppercase tracking-wider mb-3">系統資訊</h2>
        <div className="bg-white rounded-2xl shadow-apple p-5">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[#86868b] text-xs">方案</div>
              <div className="text-[#1d1d1f] font-medium mt-0.5">免費版</div>
            </div>
            <div>
              <div className="text-[#86868b] text-xs">行業</div>
              <div className="text-[#1d1d1f] font-medium mt-0.5 capitalize">{tenant.industry || '未設定'}</div>
            </div>
            <div>
              <div className="text-[#86868b] text-xs">小工具</div>
              <div className="text-[#1d1d1f] font-medium mt-0.5">1 個已啟用</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
