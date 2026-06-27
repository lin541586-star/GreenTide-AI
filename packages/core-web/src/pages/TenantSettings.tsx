import React, { useEffect, useState, useRef } from 'react';
import { tenantApi, aiRuleApi } from '../api/client';

interface AiConfig {
  provider: string;
  geminiApiKey: string;
  geminiModel: string;
  deepseekApiKey: string;
  deepseekModel: string;
  deepseekBaseUrl: string;
  tone: string;
  allowEmoji: boolean;
  lineChannelSecret: string;
  lineAccessToken: string;
  _hasGeminiKey?: boolean;
  _hasDeepSeekKey?: boolean;
}

export function TenantSettings() {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    provider: 'gemini', geminiApiKey: '', geminiModel: 'gemini-2.0-flash',
    deepseekApiKey: '', deepseekModel: 'deepseek-chat', deepseekBaseUrl: 'https://api.deepseek.com/v1',
    tone: 'professional', allowEmoji: false,
  });
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [deepseekKeyInput, setDeepseekKeyInput] = useState('');

  // 自訂應答規則
  const [rules, setRules] = useState<any[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [editRule, setEditRule] = useState<{ id: string; rule: string } | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 自動儲存 editRule（debounce 600ms）
  useEffect(() => {
    if (!editRule || !editRule.rule.trim()) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      try {
        await aiRuleApi.update(editRule.id, { rule: editRule.rule });
        await loadRules();
      } catch {}
    }, 600);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [editRule?.rule]);

  const [savingEdit, setSavingEdit] = useState(false);
  const [refiningRule, setRefiningRule] = useState<string | null>(null);
  const [ruleChatOpen, setRuleChatOpen] = useState(false);
  const [ruleChatMsgs, setRuleChatMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [ruleChatInput, setRuleChatInput] = useState('');
  const [ruleChatLoading, setRuleChatLoading] = useState(false);
  const ruleChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ruleChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ruleChatMsgs]);

  const loadRules = async () => {
    try { setRules(await aiRuleApi.list()); } catch {}
  };

  const addRule = async () => {
    if (!newRule.trim()) return;
    try {
      await aiRuleApi.create({ rule: newRule.trim() });
      setNewRule('');
      await loadRules();
    } catch {}
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    try {
      await aiRuleApi.update(id, { enabled: !enabled });
      await loadRules();
    } catch {}
  };

  const removeRule = async (id: string) => {
    try {
      await aiRuleApi.remove(id);
      await loadRules();
    } catch {}
  };

  const saveEditRule = async () => {
    if (!editRule || !editRule.rule.trim()) return;
    try {
      await aiRuleApi.update(editRule.id, { rule: editRule.rule });
      setEditRule(null);
      await loadRules();
    } catch {}
  };

  const handleRefineRule = async (id: string, rule: string) => {
    setRefiningRule(id);
    try {
      const { refined } = await aiRuleApi.refine({ rule });
      await aiRuleApi.update(id, { rule: refined });
      await loadRules();
    } catch {}
    setRefiningRule(null);
  };

  const handleRuleChat = async () => {
    const text = ruleChatInput.trim();
    if (!text || ruleChatLoading) return;
    const newMsgs = [...ruleChatMsgs, { role: 'user' as const, content: text }];
    setRuleChatMsgs(newMsgs);
    setRuleChatInput('');
    setRuleChatLoading(true);
    try {
      const { reply } = await aiRuleApi.chat({ messages: newMsgs });
      setRuleChatMsgs(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {}
    setRuleChatLoading(false);
  };

  // AI 預約對話測試
  const [testOpen, setTestOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [chatMsg, setChatMsg] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai'; text: string; qr?: { label: string; text: string }[] }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleTestChat = async (msg?: string) => {
    const text = msg || chatMsg;
    if (!text.trim() || chatLoading) return;
    setChatLog(prev => [...prev, { role: 'user', text }]);
    setChatMsg('');
    setChatLoading(true);
    try {
      const { default: client } = await import('../api/client');
      const res = await client.post('/ai-assistant/test-agent', { message: text, sessionId });
      const { reply, quickReply } = res.data;
      setChatLog(prev => [...prev, { role: 'ai', text: reply, qr: quickReply }]);
    } catch (e: any) {
      setChatLog(prev => [...prev, { role: 'ai', text: `❌ 錯誤：${e?.response?.data?.message || e.message || '連線失敗'}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const t = localStorage.getItem('tenant');
    if (t) setName(JSON.parse(t).name || '');
    // 載入 AI 設定
    tenantApi.getAiConfig().then((cfg: any) => {
      setAiConfig(cfg);
      // 如果有金鑰但只顯示末4碼，輸入框留空
    }).catch(() => {});
    loadRules();
  }, []);

  const handleSave = async () => {
    await tenantApi.update({ name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAi = async () => {
    setSavingAi(true);
    try {
      // ⚠️ 只送使用者實際填寫的欄位，不要送遮罩後的金鑰
      const payload: any = {
        provider: aiConfig.provider,
        geminiModel: aiConfig.geminiModel,
        deepseekModel: aiConfig.deepseekModel,
        deepseekBaseUrl: aiConfig.deepseekBaseUrl,
        tone: aiConfig.tone,
        allowEmoji: aiConfig.allowEmoji,
        lineChannelSecret: aiConfig.lineChannelSecret,
        lineAccessToken: aiConfig.lineAccessToken,
      };
      if (geminiKeyInput) payload.geminiApiKey = geminiKeyInput;
      if (deepseekKeyInput) payload.deepseekApiKey = deepseekKeyInput;

      await tenantApi.updateAiConfig(payload);
      setAiSaved(true);
      setGeminiKeyInput('');
      setDeepseekKeyInput('');
      // 重新載入（取得新的末4碼）
      const cfg = await tenantApi.getAiConfig();
      setAiConfig(cfg);
      setTimeout(() => setAiSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSavingAi(false); }
  };

  const handleTestAi = async () => {
    try {
      const { default: client } = await import('../api/client');
      const res = await client.post('/ai-assistant/chat', {
        message: '你好，請簡單回覆一句話確認連線正常。',
        context: 'general',
      });
      alert(`✅ AI 連線成功！\n\n回應：${res.data.reply}`);
    } catch (e: any) {
      alert(`❌ AI 連線失敗：${e?.response?.data?.message || e.message}`);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">店家設定</h1>
        <p className="text-sm text-[#86868b] mt-0.5">管理您店家的基本資訊與 AI 設定</p>
      </div>

      {/* 基本資訊 */}
      <div className="bg-white rounded-2xl shadow-apple p-6 mb-4">
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4">基本資訊</h2>
        <div className="mb-5">
          <label className="text-xs font-medium text-[#86868b] mb-1.5 block">店家名稱</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full max-w-xs h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm
                       focus:outline-none focus:border-[#1d1d1f] transition-colors"
          />
        </div>
        <button
          onClick={handleSave}
          className={`px-5 h-9 rounded-xl text-xs font-medium transition-all duration-200 ${
            saved
              ? 'bg-[#f5f5f7] text-[#86868b]'
              : 'bg-[#1d1d1f] text-white hover:bg-[#2c2c2e]'
          }`}
        >
          {saved ? '✓ 已儲存' : '儲存變更'}
        </button>
      </div>

      {/* AI 設定 */}
      <div className="bg-white rounded-2xl shadow-apple p-6">
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-1">AI 智慧設定</h2>
        <p className="text-xs text-[#86868b] mb-5">設定 API Key 後即可啟用 AI 智慧助手功能</p>

        {/* LLM 供應商選擇 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[#86868b] mb-1.5 block">AI 供應商</label>
          <div className="flex gap-2">
            {[
              { value: 'gemini', label: 'Gemini (Google)' },
              { value: 'deepseek', label: 'DeepSeek' },
            ].map(opt => (
              <button key={opt.value}
                onClick={() => setAiConfig({ ...aiConfig, provider: opt.value })}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  aiConfig.provider === opt.value
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI 語氣情緒設定 */}
        <div className="mb-5">
          <label className="text-xs font-medium text-[#86868b] mb-2 block">AI 客服語氣</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { value: 'professional', label: '專業正式', icon: '💼', desc: '信賴感強，類似銀行客服' },
              { value: 'friendly', label: '親切友善', icon: '😊', desc: '像朋友聊天般自然' },
              { value: 'casual', label: '輕鬆隨性', icon: '😄', desc: '簡短明快，年輕化用詞' },
              { value: 'luxury', label: '高貴優雅', icon: '✨', desc: '精緻從容，高級服務感' },
            ].map(opt => (
              <button key={opt.value}
                onClick={() => setAiConfig({ ...aiConfig, tone: opt.value })}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                  aiConfig.tone === opt.value
                    ? 'bg-[#1d1d1f] text-white shadow-sm'
                    : 'bg-[#f5f5f7] text-[#636366] hover:bg-[#e8e8ed]'
                }`}
                title={opt.desc}>
                <span className="mr-1">{opt.icon}</span>{opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiConfig({ ...aiConfig, allowEmoji: !aiConfig.allowEmoji })}
              className={`relative w-9 h-5 rounded-full transition-colors ${aiConfig.allowEmoji ? 'bg-[#34c759]' : 'bg-[#d2d2d7]'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${aiConfig.allowEmoji ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {aiConfig.allowEmoji ? '✅ 允許使用表情符號' : '❌ 禁止使用表情符號'}
            </span>
          </div>
        </div>

        {/* Gemini 設定 */}
        {aiConfig.provider === 'gemini' && (
          <div className="space-y-3.5 mb-4">
            <div>
              <label className="text-xs font-medium text-[#86868b] mb-1.5 block">
                Gemini API Key {aiConfig._hasGeminiKey && <span className="text-emerald-600">（已設定）</span>}
              </label>
              <input
                value={geminiKeyInput}
                onChange={e => setGeminiKeyInput(e.target.value)}
                placeholder={aiConfig._hasGeminiKey ? '輸入新金鑰以覆蓋，留空保持不變' : '輸入 Gemini API Key'}
                type="password"
                className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
              />
              <p className="text-[10px] text-[#aeaeb2] mt-1">申請位置：https://aistudio.google.com/apikey</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[#86868b] mb-1.5 block">模型</label>
              <input
                value={aiConfig.geminiModel}
                onChange={e => setAiConfig({ ...aiConfig, geminiModel: e.target.value })}
                className="w-full max-w-xs h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
              />
            </div>
          </div>
        )}

        {/* DeepSeek 設定 */}
        {aiConfig.provider === 'deepseek' && (
          <div className="space-y-3.5 mb-4">
            <div>
              <label className="text-xs font-medium text-[#86868b] mb-1.5 block">
                DeepSeek API Key {aiConfig._hasDeepSeekKey && <span className="text-emerald-600">（已設定）</span>}
              </label>
              <input
                value={deepseekKeyInput}
                onChange={e => setDeepseekKeyInput(e.target.value)}
                placeholder={aiConfig._hasDeepSeekKey ? '輸入新金鑰以覆蓋，留空保持不變' : '輸入 DeepSeek API Key'}
                type="password"
                className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#86868b] mb-1.5 block">模型</label>
              <input
                value={aiConfig.deepseekModel}
                onChange={e => setAiConfig({ ...aiConfig, deepseekModel: e.target.value })}
                className="w-full max-w-xs h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
              />
            </div>
          </div>
        )}

        {/* LINE 串接設定 */}
        <div className="mb-5">
          <label className="text-xs font-medium text-[#86868b] mb-2 block flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#06C755"><path d="M12 2C6.477 2 2 5.925 2 10.667c0 3.067 1.823 5.815 4.667 7.33L6 22l4.667-2.333c.43.1.873.157 1.333.166 5.523 0 10-3.925 10-8.666C22 5.925 17.523 2 12 2zm0 2c4.418 0 8 3.142 8 6.667s-3.582 6.666-8 6.666c-.38 0-.76-.03-1.14-.08L8 20v-3.105C5.26 15.444 4 13.198 4 10.667 4 7.142 7.582 4 12 4z"/></svg>
            即時通訊串接
          </label>
          <div className="space-y-3 p-4 rounded-2xl border" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--section-bg)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiConfig.lineAccessToken ? 'bg-emerald-500' : 'bg-[#d2d2d7]'}`} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>LINE</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: aiConfig.lineAccessToken ? '#dcfce7' : '#f4f3f0', color: aiConfig.lineAccessToken ? '#166534' : '#86868b' }}>
                  {aiConfig.lineAccessToken ? '已連線' : '未連線'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1d1d1f]">LINE Developers</a>
              </div>
            </div>
            {aiConfig.lineAccessToken && (
              <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Webhook URL：<code className="font-mono bg-[#f4f3f0] px-1 rounded">https://你的網域/api/channels/line/webhook</code>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Channel Secret</label>
                <input value={aiConfig.lineChannelSecret}
                  onChange={e => setAiConfig({ ...aiConfig, lineChannelSecret: e.target.value })}
                  placeholder="輸入 LINE Channel Secret"
                  className="w-full h-8 px-2.5 rounded-lg border text-xs focus:outline-none"
                  style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--section-bg)' }} />
              </div>
              <div>
                <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Access Token</label>
                <input value={aiConfig.lineAccessToken}
                  onChange={e => setAiConfig({ ...aiConfig, lineAccessToken: e.target.value })}
                  placeholder="輸入 LINE Channel Access Token"
                  className="w-full h-8 px-2.5 rounded-lg border text-xs focus:outline-none"
                  style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--section-bg)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center gap-2 pt-4 border-t border-[#f4f3f0]">
          <button
            onClick={handleSaveAi}
            disabled={savingAi}
            className={`px-5 h-9 rounded-xl text-xs font-medium transition-all duration-200 ${
              aiSaved
                ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]'
                : savingAi
                  ? 'bg-[#f5f5f7] text-[#86868b]'
                  : 'bg-[#1d1d1f] text-white hover:bg-[#2c2c2e]'
            }`}
          >
            {aiSaved ? '✓ 已儲存' : savingAi ? '儲存中…' : '儲存 AI 設定'}
          </button>
          <button
            onClick={handleTestAi}
            className="px-4 h-9 rounded-xl text-xs font-medium bg-[#f5f5f7] text-[#636366] hover:bg-[#e8e8ed] transition-colors"
          >
            測試連線
          </button>
        </div>
      </div>

      {/* 自訂應答規則 */}
      <div className="bg-white rounded-2xl shadow-apple p-6 mt-4">
        <button onClick={() => setRulesOpen(!rulesOpen)} className="w-full flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#1d1d1f]">📜 自訂應答規則</h2>
            <p className="text-xs text-[#86868b] mt-0.5">自行撰寫規則讓 AI 遵守，例如「客人如果是第一次來要主動介紹招牌服務」</p>
          </div>
          <span className="text-xs text-[#86868b]">{rulesOpen ? '收合' : `已啟用 ${rules.filter(r => r.enabled).length} 條`}</span>
        </button>

        {rulesOpen && (
          <div className="mt-4">
            {/* 新增規則 */}
            <div className="flex items-center gap-2 mb-3">
              <input value={newRule} onChange={e => setNewRule(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRule()}
                placeholder="輸入應答規則…"
                className="flex-1 h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" />
              <button onClick={addRule} disabled={!newRule.trim()}
                className="h-9 px-4 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e] disabled:opacity-40 transition-colors">新增</button>
              <button onClick={() => { setRuleChatOpen(true); setRuleChatMsgs([]); }}
                className="h-9 px-3 rounded-xl border border-[#d2d2d7] text-xs font-medium text-[#636366] hover:bg-[#f4f3f0] transition-colors flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1a7 7 0 017 7c0 1.5-.5 2.9-1.3 4L15 15l-3-.3A7 7 0 118 1z" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                AI 規則討論
              </button>
            </div>

            {/* 規則列表 */}
            {rules.length === 0 && (
              <div className="text-center py-6 text-xs text-[#aeaeb2]">
                尚無自訂規則，AI 會使用預設行為應答
              </div>
            )}

            <div className="space-y-1.5">
              {rules.map((r) => (
                <div key={r.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${r.enabled ? 'bg-white border-[#d2d2d7]' : 'bg-[#fafafa] border-[#e8e8ed]'}`}>
                  {/* 啟用開關 */}
                  <button onClick={() => toggleRule(r.id, r.enabled)}
                    className={`shrink-0 w-8 h-4 rounded-full transition-colors ${r.enabled ? 'bg-[#34c759]' : 'bg-[#d2d2d7]'}`}>
                    <span className={`block w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${r.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>

                  {/* 內容 */}
                  <div className="flex-1 min-w-0">
                    {editRule?.id === r.id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input value={editRule.rule} onChange={e => setEditRule({ ...editRule, rule: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditRule(); if (e.key === 'Escape') setEditRule(null); }}
                          onBlur={saveEditRule}
                          className="flex-1 h-7 px-2 rounded-lg border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]"
                          autoFocus />
                        <span className="text-[10px] text-[#aeaeb2] animate-pulse">自動儲存</span>
                      </div>
                    ) : (
                      <div>
                        <span className={`text-sm block truncate ${r.enabled ? 'text-[#1d1d1f]' : 'text-[#aeaeb2] line-through'}`}
                          onDoubleClick={() => { setEditRule({ id: r.id, rule: r.rule }); setSavingEdit(false); }}>
                          {r.rule}
                        </span>
                        {r.refinedRule && (
                          <span className="text-[10px] block truncate mt-0.5 text-[#7a7299] flex items-center gap-1">
                            <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                              <path d="M8 1l1.5 3 3 .5L11 7l.5 3-3.5-1.5L4.5 10 5 7 2 4.5l3-.5L8 1z" fill="#6c5ce7"/>
                            </svg>
                            {r.refinedRule}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 刪除 */}
                  <button onClick={() => handleRefineRule(r.id, r.rule)}
                    disabled={refiningRule === r.id}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[#aeaeb2] hover:text-[#6c5ce7] hover:bg-purple-50 transition-colors"
                    title="AI 優化規則">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={refiningRule === r.id ? 'animate-spin' : ''}>
                      <path d="M8 1l1.5 3 3 .5L11 7l.5 3-3.5-1.5L4.5 10 5 7 2 4.5l3-.5L8 1z" fill="currentColor"/>
                    </svg>
                  </button>
                  <button onClick={() => removeRule(r.id)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[#aeaeb2] hover:text-red-500 hover:bg-red-50 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 3l7 7M9.5 3l-7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-[#aeaeb2] mt-2">雙擊規則可編輯內容，關閉開關可暫時停用規則</p>
          </div>
        )}
      </div>

      {/* AI 預約對話測試 */}
      <div className="bg-white rounded-2xl shadow-apple p-6 mt-4">
        <button onClick={() => setTestOpen(!testOpen)} className="w-full flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">🤖 AI 預約對話測試</h2>
          <span className="text-xs text-[#86868b]">{testOpen ? '收合' : '展開'}</span>
        </button>
        <p className="text-xs text-[#86868b] mt-0.5">模擬顧客在 LINE 上與 AI 對話，測試預約流程</p>

        {testOpen && (
          <div className="mt-4">
            {/* 對話區 */}
            <div className="h-72 overflow-y-auto rounded-xl p-3 space-y-3 border" style={{ backgroundColor: 'var(--chat-bg)', borderColor: 'var(--border-light)', backdropFilter: 'blur(var(--panel-blur))', WebkitBackdropFilter: 'blur(var(--panel-blur))' }}>
              {chatLog.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-xs text-[#aeaeb2]">輸入訊息開始測試 AI 預約</p>
                    <p className="text-[10px] text-[#aeaeb2] mt-1">試試看：「我想要預約明天下午剪頭髮」</p>
                  </div>
                </div>
              )}
              {chatLog.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-md'
                      : 'rounded-bl-md shadow-sm'
                  }`}
                  style={{
                    backgroundColor: m.role === 'user' ? 'var(--chat-bubble-user)' : 'var(--chat-bubble-ai)',
                    color: m.role === 'user' ? 'var(--chat-bubble-user-text)' : 'var(--chat-bubble-ai-text)',
                    border: m.role === 'user' ? 'none' : '1px solid var(--border-light)',
                  }}>
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    {m.qr?.length ? (
                      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[#e8e8ed]">
                        {m.qr.map((q, j) => (
                          <button key={j} onClick={() => handleTestChat(q.text)}
                            className="px-2.5 py-1 text-[11px] rounded-full transition-colors"
                            style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-secondary)' }}>
                            {q.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm" style={{ backgroundColor: 'var(--chat-bubble-ai)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{backgroundColor:'var(--text-secondary)', animationDelay:'0ms'}}></span>
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{backgroundColor:'var(--text-secondary)', animationDelay:'150ms'}}></span>
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{backgroundColor:'var(--text-secondary)', animationDelay:'300ms'}}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 輸入區 */}
            <div className="flex items-center gap-2 mt-3">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTestChat()}
                placeholder="輸入顧客對話內容…"
                className="flex-1 h-10 px-4 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors" />
              <button onClick={() => handleTestChat()}
                disabled={chatLoading}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#1d1d1f] text-white hover:bg-[#2c2c2e] disabled:opacity-50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8l12-6-4 6 4 6-12-6z" fill="currentColor"/>
                </svg>
              </button>
              <button onClick={() => { setChatLog([]); setChatMsg(''); setSessionId(crypto.randomUUID()); }}
                title="重置對話（新的顧客身份）"
                className="h-10 px-2.5 flex items-center gap-1 rounded-xl border border-[#d2d2d7] text-[#aeaeb2] hover:text-[#1d1d1f] hover:border-[#1d1d1f] transition-colors text-xs">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2v5h5M14 14V9H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.5 6.5A6.5 6.5 0 003.5 13M2.5 9.5A6.5 6.5 0 0012.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:inline">重置</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI 規則討論對話框 */}
      {ruleChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setRuleChatOpen(false)}>
          <div className="rounded-t-2xl md:rounded-2xl shadow-apple-xl w-full md:w-[480px] animate-scale-in md:mb-0 max-h-[80vh] flex flex-col"
            style={{ backgroundColor: 'var(--container-bg)' }}
            onClick={e => e.stopPropagation()}>
            {/* 標題 */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>🤖 AI 規則討論</h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>跟 AI 討論如何寫出更好的應答規則</p>
              </div>
              <button onClick={() => setRuleChatOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0] transition-colors">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* 對話區 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px] max-h-[50vh]">
              {ruleChatMsgs.length === 0 && (
                <div className="flex items-center justify-center h-full py-8">
                  <div className="text-center">
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>你可以問 AI 這些問題：</p>
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                      {[
                        { label: '「幫我寫規則」', txt: '幫我寫一條規則：當客人說不確定要做什麼的時候，要推薦最受歡迎的服務' },
                        { label: '「這樣寫好嗎？」', txt: '請幫我分析這條規則夠清楚嗎：「客人不喜歡就換一個推薦」' },
                        { label: '「規則撰寫技巧」', txt: '寫應答規則有什麼技巧可以讓 AI 比較聽得懂？請舉例說明好的和不好的規則' },
                      ].map(q => (
                        <button key={q.label} onClick={() => {
                          setRuleChatMsgs([{ role: 'user', content: q.txt }]);
                          setRuleChatLoading(true);
                          aiRuleApi.chat({ messages: [{ role: 'user', content: q.txt }] })
                            .then(r => setRuleChatMsgs(prev => [...prev, { role: 'assistant', content: r.reply }]))
                            .catch(() => setRuleChatLoading(false));
                        }}
                          className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                          style={{ borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {ruleChatMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                  }`}
                  style={{
                    backgroundColor: m.role === 'user' ? 'var(--btn-primary-bg)' : 'var(--chat-bubble-ai)',
                    color: m.role === 'user' ? 'var(--accent-text)' : 'var(--chat-bubble-ai-text)',
                    border: m.role === 'user' ? 'none' : '1px solid var(--border-light)',
                  }}>
                    <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                    {m.role === 'assistant' && m.content.length > 5 && i === ruleChatMsgs.length - 1 && !ruleChatLoading && (
                      <button onClick={async () => {
                        // 從 AI 回覆中提取乾淨的規則文字
                        let ruleText = m.content;
                        // 嘗試提取【條件】~【動作】區塊
                        const condMatch = ruleText.match(/【條件】(.+?)(?:\n|$)/);
                        const actMatch = ruleText.match(/【動作】(.+?)(?:\n|$)/);
                        if (condMatch && actMatch) {
                          ruleText = `當${condMatch[1].trim()}時，${actMatch[1].trim()}`;
                        } else {
                          // fallback: 取第一個有意義的句子
                          ruleText = ruleText.replace(/^[【#*\-\d.]+\s*/, '').split('\n')[0].trim().substring(0, 120);
                        }
                        try {
                          await aiRuleApi.create({ rule: ruleText });
                          await loadRules();
                        } catch {}
                      }}
                        className="mt-2 text-[11px] px-2.5 py-1 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-secondary)' }}>
                        + 新增為規則
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {ruleChatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm text-sm"
                    style={{ backgroundColor: 'var(--chat-bubble-ai)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{backgroundColor:'var(--text-secondary)', animationDelay:'0ms'}}></span>
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{backgroundColor:'var(--text-secondary)', animationDelay:'150ms'}}></span>
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{backgroundColor:'var(--text-secondary)', animationDelay:'300ms'}}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={ruleChatEndRef} />
            </div>

            {/* 輸入區 */}
            <div className="flex items-center gap-2 p-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <input value={ruleChatInput} onChange={e => setRuleChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRuleChat()}
                placeholder="問 AI 關於規則的問題…"
                className="flex-1 h-9 px-3 rounded-xl border text-sm focus:outline-none"
                style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--container-bg)' }} />
              <button onClick={handleRuleChat} disabled={ruleChatLoading || !ruleChatInput.trim()}
                className="h-9 w-9 flex items-center justify-center rounded-xl disabled:opacity-50 transition-colors"
                style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--accent-text)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8l12-6-4 6 4 6-12-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
