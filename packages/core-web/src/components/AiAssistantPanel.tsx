import React, { useState, useRef, useEffect } from 'react';
import client from '../api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Action {
  label: string;
  action: string;
}

interface AiPanelProps {
  /** 當前頁面工具名稱，傳給 AI 作為 context */
  context?: string;
  /** 額外上下文資料 */
  contextData?: Record<string, any>;
}

export function AiAssistantPanel({ context, contextData }: AiPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setActions([]);

    try {
      const res = await client.post('/ai-assistant/chat', {
        message: text,
        context,
        contextData,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      if (res.data.actions) setActions(res.data.actions);
    } catch (e: any) {
      const errMsg = e?.response?.data?.message || '連線失敗，請稍後再試';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: string) => {
    if (action.startsWith('navigate:')) {
      window.location.href = action.replace('navigate:', '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 浮動按鈕 - 在右下角 */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed z-40 bottom-6 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 ${
          open ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 bg-gradient-to-br from-[#1d1d1f] to-[#2c2c2e]'
        }`}
        aria-label="開啟 AI 助手"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 014 4c0 2-2 3-2 4v1h-4v-1c0-1-2-2-2-4a4 4 0 014-4z" />
          <path d="M8 16h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
          <path d="M5 12a7 7 0 0114 0" strokeDasharray="2" />
        </svg>
      </button>

      {/* 側邊面板 */}
      <div className={`fixed inset-0 z-50 pointer-events-none ${open ? '' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" onClick={() => setOpen(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white shadow-2xl pointer-events-auto animate-slide-left flex flex-col ${expanded ? 'sm:w-[600px]' : ''}`}>
          {/* 標題列 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0efeb] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1d1d1f] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 014 4c0 2-2 3-2 4v1h-4v-1c0-1-2-2-2-4a4 4 0 014-4z" />
                  <path d="M8 16h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-[#1d1d1f]">AI 智慧助手</span>
                <span className="text-[10px] text-[#8a8885] ml-2">
                  {context ? toolName(context) : '通用模式'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setExpanded(!expanded)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0] text-[#8a8885] hidden sm:flex"
                title={expanded ? '縮小' : '放大'}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  {expanded
                    ? <path d="M8 1h5v5M6 13H1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    : <path d="M6 13H1V8M8 1h5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>}
                </svg>
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0] text-[#8a8885]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>

          {/* 提示區域 - 無訊息時顯示 */}
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-4">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M12 2a4 4 0 014 4c0 2-2 3-2 4v1h-4v-1c0-1-2-2-2-4a4 4 0 014-4z" />
                  <path d="M8 16h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">有什麼我可以幫你的？</h3>
              <p className="text-xs text-[#8a8885] leading-relaxed max-w-xs">
                {context === 'crm' && '我可以幫你分析客戶資料、推薦標籤、找出潛在流失客戶'}
                {context === 'inventory' && '我可以幫你分析庫存狀況、建議補貨時機、偵測異常'}
                {context === 'notifications' && '我可以幫你生成行銷文案、建議發送策略'}
                {context === 'analytics' && '我可以幫你解讀營運數據、提供經營建議'}
                {!context || context === 'dashboard' && '我可以回答關於營運管理的各種問題'}
              </p>
            </div>
          )}

          {/* 訊息列表 */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#f5f5f7] text-[#1d1d1f]'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f5f5f7] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#aeaeb2] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#aeaeb2] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#aeaeb2] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 建議操作按鈕 */}
          {actions.length > 0 && (
            <div className="px-5 pb-2 shrink-0">
              <div className="flex flex-wrap gap-2">
                {actions.map((a, idx) => (
                  <button key={idx} onClick={() => handleAction(a.action)}
                    className="px-3 py-1.5 rounded-lg bg-[#f0efeb] text-xs text-[#636366] hover:bg-[#e8e8ed] transition-colors">
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 輸入區域 */}
          <div className="border-t border-[#f0efeb] px-4 py-3 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="輸入訊息…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors min-h-[36px] max-h-[120px]"
                style={{ height: 'auto' }}
                onInput={e => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />
              <button onClick={handleSend} disabled={loading || !input.trim()}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  loading || !input.trim()
                    ? 'bg-[#f5f5f7] text-[#aeaeb2]'
                    : 'bg-[#1d1d1f] text-white hover:bg-[#2c2c2e]'
                }`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8l12-6-4 6 4 6-12-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <div className="text-[10px] text-[#aeaeb2] mt-1.5 text-center">
              Enter 發送 · Shift+Enter 換行
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-left {
          animation: slide-left 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

function toolName(ctx: string): string {
  const map: Record<string, string> = {
    crm: '客戶管理',
    inventory: '庫存管理',
    notifications: '通知系統',
    analytics: '營運報表',
    dashboard: '儀表板',
  };
  return map[ctx] || ctx;
}
