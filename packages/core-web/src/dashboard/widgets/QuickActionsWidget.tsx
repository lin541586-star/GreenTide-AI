import { Card, Title, Text } from '@tremor/react';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  { title: '查看今日預約', path: '/app/calendar-booking', desc: '管理與檢視預約時段' },
  { title: '管理服務項目', path: '/settings/services', desc: '新增或編輯服務內容' },
  { title: '管理營業時間', path: '/settings/business-hours', desc: '設定營業時段' },
  { title: '員工管理', path: '/settings/users', desc: '管理帳號與權限' },
];

export function QuickActionsWidget() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl shadow-apple">
      <Title className="text-sm font-semibold text-[#1d1d1f] mb-3">快速操作</Title>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.path}
            onClick={() => {
              if (action.path.startsWith('/app')) {
                // App routes handled by react-router
                window.history.pushState({}, '', action.path);
                window.dispatchEvent(new PopStateEvent('popstate'));
              } else {
                navigate(action.path);
              }
            }}
            className="flex items-center justify-between p-3 rounded-xl bg-[#faf9f7] hover:bg-[#f4f3f0] transition-colors text-left group"
          >
            <div>
              <div className="text-xs font-medium text-[#1d1d1f] group-hover:text-[#1d1d1f]">{action.title}</div>
              <div className="text-[10px] text-[#8a8885] mt-0.5">{action.desc}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#aeaeb2] group-hover:text-[#1d1d1f] shrink-0">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </Card>
  );
}
