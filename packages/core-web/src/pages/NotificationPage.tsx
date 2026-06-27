import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';

interface Template {
  id: string; name: string; channel: string; subject?: string;
  content: string; triggers: string; active: boolean;
}

interface Log {
  id: string; recipient: string; channel: string; subject?: string;
  content: string; status: string; sentAt?: string; createdAt: string;
}

const CHANNELS = ['line', 'email', 'both'];
const TRIGGER_OPTIONS = [
  { value: 'booking_confirmed', label: '預約確認時' },
  { value: 'booking_reminder', label: '預約前1小時提醒' },
  { value: 'low_stock', label: '庫存過低時' },
];

export function NotificationPage() {
  const [tab, setTab] = useState<'templates' | 'send' | 'logs'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', channel: 'line', subject: '', content: '', triggers: [] as string[] });
  const [sendForm, setSendForm] = useState({ recipient: '', channel: 'line', content: '' });
  const [sendResult, setSendResult] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAiGenerate = async (target: 'send' | 'template') => {
    setAiGenerating(true);
    try {
      const prompt = target === 'send' ? sendForm.content : form.content;
      const res = await client.post('/ai-assistant/chat', {
        message: `根據以下需求，幫我生成一段適合發送給客戶的通知文案：${prompt || '生成一段一般性的客戶通知文案'}`,
        context: 'notifications',
      });
      const reply = res.data.reply;
      if (target === 'send') setSendForm(prev => ({ ...prev, content: reply }));
      else setForm(prev => ({ ...prev, content: reply }));
    } catch (e) { console.error(e); }
    finally { setAiGenerating(false); }
  };

  const load = useCallback(async () => {
    try {
      const [t, l] = await Promise.all([
        client.get('/notifications/templates'),
        client.get('/notifications/logs'),
      ]);
      setTemplates(t.data);
      setLogs(l.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', channel: 'line', subject: '', content: '', triggers: [] });
    setShowForm(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t.id);
    setForm({ name: t.name, channel: t.channel, subject: t.subject || '', content: t.content, triggers: JSON.parse(t.triggers || '[]') });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    try {
      if (editing) {
        await client.put(`/notifications/templates/${editing}`, form);
      } else {
        await client.post('/notifications/templates', form);
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此模板？')) return;
    await client.delete(`/notifications/templates/${id}`);
    load();
  };

  const handleSend = async () => {
    if (!sendForm.recipient.trim() || !sendForm.content.trim()) return;
    try {
      await client.post('/notifications/send', sendForm);
      setSendResult('✅ 已成功發送');
      setSendForm({ recipient: '', channel: 'line', content: '' });
      setTimeout(() => setSendResult(''), 3000);
      load();
    } catch (e: any) {
      setSendResult('❌ 發送失敗');
    }
  };

  if (loading) return <div className="p-8 text-[#8a8885] text-sm">載入中…</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">智慧通知系統</h1>
        <p className="text-sm text-[#8a8885] mt-0.5">管理通知模板與發送訊息</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f5f7] rounded-xl p-1 mb-6 w-fit">
        {(['templates', 'send', 'logs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#8a8885] hover:text-[#1d1d1f]'
            }`}>
            {t === 'templates' ? '通知模板' : t === 'send' ? '發送通知' : '發送記錄'}
          </button>
        ))}
      </div>

      {/* Templates */}
      {tab === 'templates' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={openNew}
              className="px-4 h-9 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e]">+ 新增模板</button>
          </div>
          {templates.length === 0 ? (
            <div className="rounded-2xl shadow-apple p-12 text-center text-sm text-[#8a8885]" style={{ backgroundColor: 'var(--section-bg)' }}>尚未建立任何通知模板</div>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <div key={t.id} className="rounded-2xl shadow-apple p-5" style={{ backgroundColor: 'var(--section-bg)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-[#1d1d1f]">{t.name}</h3>
                        <span className="text-[10px] text-[#8a8885] bg-[#f4f3f0] px-1.5 py-0.5 rounded-md uppercase">{t.channel}</span>
                      </div>
                      <p className="text-xs text-[#8a8885] mt-1.5 whitespace-pre-wrap line-clamp-2">{t.content}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEdit(t)} className="text-xs text-[#8a8885] hover:text-[#1d1d1f] px-2 py-1 rounded-lg hover:bg-[#f4f3f0]">編輯</button>
                      <button onClick={() => handleDelete(t.id)} className="text-xs text-[#8a8885] hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50">刪除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Send */}
      {tab === 'send' && (
        <div className="rounded-2xl shadow-apple p-6 max-w-lg" style={{ backgroundColor: 'var(--section-bg)' }}>
          {sendResult && (
            <div className={`text-xs rounded-xl px-3.5 py-2.5 mb-4 ${sendResult.startsWith('✅') ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]' : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'}`}>
              {sendResult}
            </div>
          )}
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">收件人</label>
              <input value={sendForm.recipient} onChange={e => setSendForm({ ...sendForm, recipient: e.target.value })}
                placeholder="LINE ID 或 Email 地址"
                className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">發送管道</label>
              <select value={sendForm.channel} onChange={e => setSendForm({ ...sendForm, channel: e.target.value })}
                className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm  focus:outline-none focus:border-[#1d1d1f] appearance-none"
                style={{ backgroundColor: 'var(--section-bg)', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=12 height=12 viewBox=0 0 12 12 fill=none xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M3 5l3 3 3-3%27 stroke=%27%238a8885%27 strokeWidth=%271.5%27 strokeLinecap=%27round%27 strokeLinejoin=%27round%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                {CHANNELS.map(c => <option key={c} value={c}>{c === 'line' ? 'LINE' : c === 'email' ? 'Email' : 'LINE + Email'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">訊息內容</label>
              <div className="relative">
                <textarea value={sendForm.content} onChange={e => setSendForm({ ...sendForm, content: e.target.value })}
                  placeholder="輸入要發送的訊息…"
                  className="w-full h-28 px-3 py-2 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] resize-none" />
                <button onClick={() => handleAiGenerate('send')} disabled={aiGenerating}
                  className="absolute bottom-2 right-2 h-7 px-2.5 rounded-lg bg-[#1d1d1f] text-white text-[10px] font-medium flex items-center gap-1 hover:bg-[#2c2c2e] transition-colors disabled:opacity-50">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2a4 4 0 014 4c0 2-2 3-2 4v1h-4v-1c0-1-2-2-2-4a4 4 0 014-4z" />
                    <path d="M8 16h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
                  </svg>
                  {aiGenerating ? '生成中…' : 'AI 生成'}
                </button>
              </div>
            </div>
            <button onClick={handleSend}
              className="px-5 h-9 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e] transition-colors">
              發送通知
            </button>
          </div>
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="rounded-2xl shadow-apple p-12 text-center text-sm text-[#8a8885]" style={{ backgroundColor: 'var(--section-bg)' }}>尚無發送記錄</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="rounded-2xl shadow-apple p-4" style={{ backgroundColor: 'var(--section-bg)' }}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#1d1d1f]">{log.recipient}</span>
                      <span className="text-[10px] text-[#8a8885] bg-[#f4f3f0] px-1.5 py-0.5 rounded-md uppercase">{log.channel}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${log.status === 'sent' ? 'bg-[#f0fdf4] text-[#166534]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
                        {log.status === 'sent' ? '已發送' : '失敗'}
                      </span>
                    </div>
                    <p className="text-xs text-[#8a8885] mt-1 line-clamp-1">{log.content}</p>
                  </div>
                  {log.sentAt && (
                    <span className="text-[10px] text-[#aeaeb2] shrink-0 ml-3">{new Date(log.sentAt).toLocaleString('zh-TW')}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowForm(false)}>
          <div className="rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[460px] animate-scale-in md:mb-0 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--section-bg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-[#1d1d1f]">{editing ? '編輯模板' : '新增模板'}</h3>
              <button onClick={() => setShowForm(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-5">設定通知內容模板，支援 {{name}}、{{date}} 等變數</p>
            <div className="space-y-3.5">
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">模板名稱</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 預約提醒" className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">發送管道</label>
                  <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm  focus:outline-none focus:border-[#1d1d1f] appearance-none"
                    style={{ backgroundColor: 'var(--section-bg)', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=12 height=12 viewBox=0 0 12 12 fill=none xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M3 5l3 3 3-3%27 stroke=%27%238a8885%27 strokeWidth=%271.5%27 strokeLinecap=%27round%27 strokeLinejoin=%27round%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                    {CHANNELS.map(c => <option key={c} value={c}>{c === 'line' ? 'LINE' : c === 'email' ? 'Email' : 'LINE + Email'}</option>)}
                  </select></div>
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">Email 主旨</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="Email 專用" className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">自動觸發事件</label>
                <div className="flex flex-wrap gap-2">
                  {TRIGGER_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        triggers: prev.triggers.includes(opt.value)
                          ? prev.triggers.filter(t => t !== opt.value)
                          : [...prev.triggers, opt.value],
                      }));
                    }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        form.triggers.includes(opt.value) ? 'bg-[#1d1d1f] text-white' : 'bg-[#f4f3f0] text-[#636366] hover:bg-[#e8e8ed]'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#aeaeb2] mt-1.5">選擇後當事件發生時會自動發送此通知</p>
              </div>
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">訊息內容</label>
                <div className="relative">
                  <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                    placeholder="親愛的 {{name}}，您預約了 {{date}} 的服務…"
                    className="w-full h-28 px-3 py-2 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] resize-none" />
                  <button onClick={() => handleAiGenerate('template')} disabled={aiGenerating}
                    className="absolute bottom-2 right-2 h-7 px-2.5 rounded-lg bg-[#1d1d1f] text-white text-[10px] font-medium flex items-center gap-1 hover:bg-[#2c2c2e] transition-colors disabled:opacity-50">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2a4 4 0 014 4c0 2-2 3-2 4v1h-4v-1c0-1-2-2-2-4a4 4 0 014-4z" />
                      <path d="M8 16h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
                    </svg>
                    {aiGenerating ? '生成中…' : 'AI 生成'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#f4f3f0]">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-[#8a8885] hover:bg-[#f4f3f0]">取消</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e]">{editing ? '儲存變更' : '新增模板'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
