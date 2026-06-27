import React, { useEffect, useState, useRef } from 'react';
import client from '../api/client';

interface Plugin {
  id: string; name: string; version?: string; description?: string;
  enabled: boolean; registryId: string | null;
}

/** 問號 tooltip 組件 — 滑鼠懸停或點擊顯示說明 */
function InfoTip({ description }: { description: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [show]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="w-5 h-5 rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] flex items-center justify-center transition-colors shrink-0"
        aria-label="查看說明"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="#86868b" strokeWidth="0.8"/>
          <text x="5" y="6.5" textAnchor="middle" fontSize="7" fill="#86868b" fontWeight="600">?</text>
        </svg>
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-50 pointer-events-none">
          <div className="bg-[#1d1d1f] text-white text-[11px] leading-relaxed rounded-xl px-3.5 py-2.5 shadow-apple-lg text-center">
            {description}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1d1d1f]" />
        </div>
      )}
    </div>
  );
}

export function PluginSettings() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  const load = async () => {
    try { setPlugins((await client.get('/plugins/admin')).data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id: string, enabled: boolean) => {
    await client.post(`/plugins/admin/${id}/${enabled ? 'disable' : 'enable'}`);
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled: !enabled } : p));
  };

  if (loading) return <div className="p-8 text-[#86868b] text-sm">載入中…</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">小工具</h1>
        <p className="text-sm text-[#86868b] mt-0.5">啟用或停用功能，為您的店家打造專屬工具組合</p>
      </div>

      <div className="space-y-3">
        {plugins.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-apple p-12 text-center text-sm text-[#86868b]">
            尚未安裝任何小工具
          </div>
        ) : (
          plugins.map((plugin, idx) => (
            <div
              key={plugin.id}
              className={`bg-white rounded-2xl shadow-apple p-5 flex items-center justify-between animate-slide-up transition-all duration-200 ${
                plugin.enabled ? 'ring-1 ring-[#1d1d1f]/5' : ''
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  plugin.enabled ? 'bg-[#1d1d1f]' : 'bg-[#f5f5f7]'
                }`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2l2 4 4 .5-3 3L12 14l-4-2.5L4 14l1-4.5-3-3 4-.5L8 2z" 
                      stroke={plugin.enabled ? 'white' : '#aeaeb2'} strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[#1d1d1f]">{plugin.name}</h3>
                    <InfoTip description={plugin.description || '暫無說明'} />
                  </div>
                  {plugin.description && (
                    <p className="text-xs text-[#86868b] mt-0.5 line-clamp-1">{plugin.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {plugin.version && (
                  <span className="text-[10px] text-[#aeaeb2] font-mono">v{plugin.version}</span>
                )}
                <button
                  onClick={() => toggle(plugin.id, plugin.enabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                    plugin.enabled ? 'bg-[#1d1d1f]' : 'bg-[#d2d2d7]'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    plugin.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-[#f5f5f7] text-xs text-[#86868b]">
        開發提示：將小工具放入 <span className="font-mono text-[#636366]">packages/plugins/</span> 目錄即可自動載入。
      </div>
    </div>
  );
}
