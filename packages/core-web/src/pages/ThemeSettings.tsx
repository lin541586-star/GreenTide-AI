import React, { useState } from 'react';

function hexFromColor(val: string | undefined): string {
  if (!val) return '#ffffff';
  if (val.startsWith('#')) return val;
  // 從 rgba 取出 hex 顏色（只保留色調）
  const m = val.match(/[\d.]+/g);
  if (!m || m.length < 3) return '#ffffff';
  const [r, g, b] = m.map(Number);
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2,'0')).join('');
}

// 預設主題
const PRESET_THEMES: { name: string; desc: string; vars: Record<string, string> }[] = [
  { name: '極簡白', desc: 'Apple 經典風格', vars: {
    'bg-main': '#f5f3f0',
    'bg-sidebar': 'rgba(255,255,255,0.72)',
    'accent': '#1d1d1f',
    'accent-text': '#ffffff',
    'text-primary': '#1d1d1f',
    'text-secondary': '#696969',
    'border-color': '#d2d2d7',
    'hover-bg': '#ececec',
    'selection-bg': 'rgba(0,0,0,0.85)',
    'chat-bg': '#f5f3f0',
    'chat-bubble-user': '#1d1d1f',
    'chat-bubble-user-text': '#ffffff',
    'chat-bubble-ai': '#ffffff',
    'chat-bubble-ai-text': '#1d1d1f',
    'btn-primary-bg': '#1d1d1f',
    'btn-secondary-bg': '#d6d6d6',
    'container-bg': '#ffffff',
  }},
  { name: '夜幕黑', desc: '深色沉穩風格', vars: {
    'bg-main': '#1a1a1e',
    'bg-sidebar': 'rgba(44,44,46,0.85)',
    'accent': '#0066cc',
    'accent-text': '#ffffff',
    'text-primary': '#f5f5f7',
    'text-secondary': '#aeaeb2',
    'border-color': '#48484a',
    'hover-bg': '#3a3a3c',
    'selection-bg': '#0066cc',
    'chat-bg': '#1c1c1e',
    'chat-bubble-user': '#0066cc',
    'chat-bubble-user-text': '#ffffff',
    'chat-bubble-ai': '#2c2c2e',
    'chat-bubble-ai-text': '#f5f5f7',
    'btn-primary-bg': '#0066cc',
    'btn-secondary-bg': '#3a3a3c',
    'container-bg': '#2c2c2e',
  }},
  { name: '暖木調', desc: '溫潤大地色系', vars: {
    'bg-main': '#f5efe6',
    'bg-sidebar': 'rgba(255,248,240,0.8)',
    'accent': '#7a5c10',
    'accent-text': '#ffffff',
    'text-primary': '#3a3226',
    'text-secondary': '#6b5d4e',
    'border-color': '#e0d6c8',
    'hover-bg': '#e4dacd',
    'selection-bg': '#7a5c10',
    'chat-bg': '#f5efe6',
    'chat-bubble-user': '#7a5c10',
    'chat-bubble-user-text': '#ffffff',
    'chat-bubble-ai': '#fffcf7',
    'chat-bubble-ai-text': '#3a3226',
    'btn-primary-bg': '#7a5c10',
    'btn-secondary-bg': '#dad0c0',
    'container-bg': '#fffcf7',
  }},
  { name: '海洋藍', desc: '清爽海島風格', vars: {
    'bg-main': '#e8f4f8',
    'bg-sidebar': 'rgba(255,255,255,0.75)',
    'accent': '#006699',
    'accent-text': '#ffffff',
    'text-primary': '#1a2a36',
    'text-secondary': '#4a6a7e',
    'border-color': '#c5dce8',
    'hover-bg': '#cee4ef',
    'selection-bg': '#006699',
    'chat-bg': '#e8f4f8',
    'chat-bubble-user': '#006699',
    'chat-bubble-user-text': '#ffffff',
    'chat-bubble-ai': '#ffffff',
    'chat-bubble-ai-text': '#1a2a36',
    'btn-primary-bg': '#006699',
    'btn-secondary-bg': '#c4dae6',
    'container-bg': '#ffffff',
  }},
  { name: '森綠意', desc: '自然清新風格', vars: {
    'bg-main': '#f0f7ee',
    'bg-sidebar': 'rgba(255,255,255,0.72)',
    'accent': '#265a42',
    'accent-text': '#ffffff',
    'text-primary': '#1b3628',
    'text-secondary': '#4a6b5a',
    'border-color': '#c8dccf',
    'hover-bg': '#d4e8d8',
    'selection-bg': '#265a42',
    'chat-bg': '#f0f7ee',
    'chat-bubble-user': '#265a42',
    'chat-bubble-user-text': '#ffffff',
    'chat-bubble-ai': '#ffffff',
    'chat-bubble-ai-text': '#1b3628',
    'btn-primary-bg': '#265a42',
    'btn-secondary-bg': '#c8dccf',
    'container-bg': '#ffffff',
  }},
  { name: '玫瑰粉', desc: '柔和優雅風格', vars: {
    'bg-main': '#fdf0f2',
    'bg-sidebar': 'rgba(255,248,248,0.75)',
    'accent': '#c0506a',
    'accent-text': '#ffffff',
    'text-primary': '#3a2630',
    'text-secondary': '#7a4a58',
    'border-color': '#edd6db',
    'hover-bg': '#f4dce2',
    'selection-bg': '#c0506a',
    'chat-bg': '#fdf0f2',
    'chat-bubble-user': '#c0506a',
    'chat-bubble-user-text': '#ffffff',
    'chat-bubble-ai': '#ffffff',
    'chat-bubble-ai-text': '#3a2630',
    'btn-primary-bg': '#c0506a',
    'btn-secondary-bg': '#eacbd0',
    'container-bg': '#ffffff',
  }},
  { name: '奢華金', desc: '金色點綴高貴風格', vars: {
    'bg-main': '#f5efe8',
    'bg-sidebar': 'rgba(45,35,25,0.88)',
    'accent': '#c8a45c',
    'accent-text': '#ffffff',
    'text-primary': '#f5f0eb',
    'text-secondary': '#a6957e',
    'border-color': '#5a4a3a',
    'hover-bg': '#4a3a2a',
    'selection-bg': '#c8a45c',
    'chat-bg': '#2a2218',
    'chat-bubble-user': '#c8a45c',
    'chat-bubble-user-text': '#1a1410',
    'chat-bubble-ai': '#3a3025',
    'chat-bubble-ai-text': '#f5f0eb',
    'btn-primary-bg': '#c8a45c',
    'btn-secondary-bg': '#3a3025',
    'container-bg': '#3a3025',
  }},
  { name: '毛玻璃', desc: '輕透朦朧質感', vars: {
    'bg-main': '#e0d8ee',
    'bg-sidebar': 'rgba(255,255,255,0.35)',
    'accent': '#6c5ce7',
    'accent-text': '#ffffff',
    'text-primary': '#2d2a3e',
    'text-secondary': '#7a7299',
    'border-color': 'rgba(255,255,255,0.45)',
    'hover-bg': 'rgba(255,255,255,0.25)',
    'selection-bg': '#6c5ce7',
    'chat-bg': 'rgba(255,255,255,0.35)',
    'chat-bubble-user': '#6c5ce7',
    'chat-bubble-user-text': '#ffffff',
    'chat-bubble-ai': 'rgba(255,255,255,0.50)',
    'chat-bubble-ai-text': '#2d2a3e',
    'btn-primary-bg': '#6c5ce7',
    'btn-secondary-bg': 'rgba(255,255,255,0.30)',
    'container-bg': 'rgba(255,255,255,0.50)',
    'panel-blur': '24px',
  }},
];

// 自訂顏色區塊
interface CustomColors {
  'bg-main': string;
  'bg-sidebar': string;
  'accent': string;
  'accent-text': string;
  'text-primary': string;
  'text-secondary': string;
  'border-color': string;
  'hover-bg': string;
  'selection-bg': string;
  'container-bg': string;
  'chat-bg': string;
  'chat-bubble-user': string;
  'chat-bubble-user-text': string;
  'chat-bubble-ai': string;
  'chat-bubble-ai-text': string;
  'btn-primary-bg': string;
  'btn-secondary-bg': string;
}

const DEFAULT_THEME = PRESET_THEMES[0].vars as CustomColors;

const CUSTOM_LABELS: Record<string, string> = {
  'bg-main': '頁面背景',
  'bg-sidebar': '側欄背景',
  'accent': '強調色（側欄 active）',
  'accent-text': '強調文字色',
  'text-primary': '主要文字',
  'text-secondary': '次要文字',
  'border-color': '邊框色',
  'hover-bg': '懸停背景',
  'selection-bg': '反白選取背景',
  'container-bg': '容器背景（卡片/彈窗/輸入框）',
  'chat-bg': '對話面板背景',
  'chat-bubble-user': '顧客訊息泡泡',
  'chat-bubble-user-text': '顧客訊息文字',
  'chat-bubble-ai': 'AI 訊息泡泡',
  'chat-bubble-ai-text': 'AI 訊息文字',
  'btn-primary-bg': '主要按鈕背景',
  'btn-secondary-bg': '次要按鈕背景',
};

function applyTheme(vars: Record<string, string>) {
  Object.entries(vars).forEach(([key, val]) => {
    document.documentElement.style.setProperty(`--${key}`, val);
  });
  localStorage.setItem('app_theme', JSON.stringify(vars));
}

export function ThemeSettings() {
  const [custom, setCustom] = useState<CustomColors>(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved) {
      try { return { ...DEFAULT_THEME, ...JSON.parse(saved) }; } catch {}
    }
    return DEFAULT_THEME;
  });
  const [saved, setSaved] = useState(false);

  const handlePreset = (vars: Record<string, string>) => {
    setCustom(vars as CustomColors);
    applyTheme(vars);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCustomChange = (key: string, val: string) => {
    const next = { ...custom, [key]: val };
    setCustom(next);
    applyTheme(next);
  };

  const currentVars = Object.values(custom).join('');
  const activePreset = PRESET_THEMES.find(p => Object.values(p.vars).join('') === currentVars);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">佈景主題</h1>
          <p className="text-sm text-[#8a8885] mt-0.5">自訂背景、側欄與整體配色</p>
        </div>
        {saved && (
          <span className="text-[11px] text-[#34c759] font-medium bg-[#f0fdf4] px-3 py-1.5 rounded-full animate-fade-in">
            已套用 ✓
          </span>
        )}
      </div>

      {/* 預設主題網格 */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-[#8a8885] uppercase tracking-wider mb-3">預設主題</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESET_THEMES.map(t => {
            const isActive = activePreset?.name === t.name;
            return (
              <button key={t.name} onClick={() => handlePreset(t.vars)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  isActive
                    ? 'border-[#1d1d1f] shadow-sm'
                    : 'border-transparent hover:border-[#d2d2d7]'
                }`}
                style={{ background: t.vars['container-bg'] }}
              >
                {/* 預覽色塊 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold"
                    style={{ background: t.vars['accent'], color: t.vars['accent-text'] }}>A</div>
                  <div className="flex-1 space-y-1">
                    <div className="h-2 rounded-full" style={{ background: t.vars['bg-main'] }} />
                    <div className="h-2 rounded-full" style={{ background: t.vars['border-color'] || t.vars['border-light'] }} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-0.5"
                  style={{ color: t.vars['text-primary'] }}>{t.name}</h3>
                <p className="text-[11px]"
                  style={{ color: t.vars['text-secondary'] }}>{t.desc}</p>
              </button>
            );
          })}
          {/* 自訂風格按鈕 */}
          <button onClick={() => {
            localStorage.setItem('custom_preset', JSON.stringify(custom));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
            className="rounded-2xl border-2 border-dashed p-4 text-left transition-all hover:border-[#1d1d1f] flex flex-col items-center justify-center min-h-[120px]"
            style={{ background: custom['container-bg'] }}
            title="儲存目前配色為自訂風格"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ background: custom['btn-primary-bg'], color: custom['accent-text'] }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-sm font-semibold mb-0.5"
              style={{ color: custom['text-primary'] }}>自訂風格</h3>
            <p className="text-[11px] text-center"
              style={{ color: custom['text-secondary'] }}>
              {localStorage.getItem('custom_preset') ? '已儲存·點此覆蓋' : '點擊儲存目前配色'}
            </p>
          </button>
          {/* 如果已儲存自訂風格，顯示載入按鈕 */}
          {localStorage.getItem('custom_preset') && (() => {
            try {
              const cp = JSON.parse(localStorage.getItem('custom_preset')!);
              return (
                <button onClick={() => {
                  handlePreset(cp);
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                }}
                  className="rounded-2xl border-2 p-4 text-left transition-all col-span-1 hover:border-[#1d1d1f] flex flex-col items-center justify-center min-h-[120px]"
                  style={{ background: cp['container-bg'] }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold mb-2"
                    style={{ background: cp['accent'], color: cp['accent-text'] }}>C</div>
                  <h3 className="text-sm font-semibold mb-0.5"
                    style={{ color: cp['text-primary'] }}>我的風格</h3>
                  <p className="text-[11px]"
                    style={{ color: cp['text-secondary'] }}>已儲存·點此套用</p>
                </button>
              );
            } catch { return null; }
          })()}
        </div>
      </section>

      {/* 自訂配色 */}
      <section>
        <h2 className="text-xs font-semibold text-[#8a8885] uppercase tracking-wider mb-3">自訂配色</h2>
        <div className="bg-white rounded-2xl shadow-apple p-4 md:p-6 space-y-4">
          {Object.entries(CUSTOM_LABELS).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">{label}</label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input type="color" value={hexFromColor(custom[key as keyof CustomColors])}
                    onChange={e => handleCustomChange(key, e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[#d2d2d7] cursor-pointer p-0.5"
                  />
                </div>
                <input type="text" value={custom[key as keyof CustomColors]}
                  onChange={e => handleCustomChange(key, e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl border border-[#d2d2d7] text-xs font-mono focus:outline-none focus:border-[#1d1d1f] transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 即時預覽提示 */}
      <div className="mt-6 p-4 rounded-2xl text-center text-xs text-[#8a8885]"
        style={{ background: 'var(--container-bg)', border: '1px solid var(--border-color)' }}>
        所有修改即時套用，無需儲存
      </div>
    </div>
  );
}
