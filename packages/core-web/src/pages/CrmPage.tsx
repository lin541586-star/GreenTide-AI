import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';

interface Customer {
  id: string; name: string; phone?: string; email?: string;
  notes?: string; tags: string; totalVisits: number; totalSpent: number;
  lastVisitAt?: string; createdAt: string;
}

const TAG_PRESETS = ['熟客', '新客', 'VIP', '常客', '流失風險'];

export function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '', tags: [] as string[] });
  const [aiSearch, setAiSearch] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const load = useCallback(async () => {
    try {
      if (aiSearch && search.trim()) {
        setAiResult('AI 分析中…');
        const res = await client.post('/ai-assistant/chat', {
          message: `搜尋客戶：${search}，列出符合的客戶並簡短分析`,
          context: 'crm',
        });
        setAiResult(res.data.reply);
        return;
      }
      setAiResult('');
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      setCustomers((await client.get(`/crm${params}`)).data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, aiSearch]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', phone: '', email: '', notes: '', tags: [] });
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c.id);
    setForm({
      name: c.name, phone: c.phone || '', email: c.email || '', notes: c.notes || '',
      tags: JSON.parse(c.tags || '[]'),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await client.put(`/crm/${editing}`, form);
      } else {
        await client.post('/crm', form);
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此客戶？')) return;
    await client.delete(`/crm/${id}`);
    load();
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  if (loading) return <div className="p-8 text-[#8a8885] text-sm">載入中…</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">客戶管理</h1>
          <p className="text-sm text-[#8a8885] mt-0.5">管理顧客資訊與消費記錄</p>
        </div>
        <button onClick={openNew}
          className="px-4 h-9 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e] transition-colors">
          + 新增客戶
        </button>
      </div>

      {/* 搜尋 */}
      <div className="mb-5 flex items-center gap-2">
        <input value={search} onChange={e => { setSearch(e.target.value); setAiResult(''); }}
          placeholder={aiSearch ? '用自然語言搜尋，例如：上個月來超過3次的客人' : '搜尋客戶姓名、電話或 Email…'}
          className="w-full max-w-md h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm  focus:outline-none focus:border-[#1d1d1f] transition-colors" style={{ backgroundColor: 'var(--section-bg)' }}
        />
        <button onClick={() => { setAiSearch(!aiSearch); setAiResult(''); }}
          className={`h-9 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
            aiSearch ? 'bg-[#1d1d1f] text-white' : 'bg-[#f4f3f0] text-[#636366] hover:bg-[#e8e8ed]'
          }`}>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a4 4 0 014 4c0 2-2 3-2 4v1h-4v-1c0-1-2-2-2-4a4 4 0 014-4z" />
              <path d="M8 16h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
            </svg>
            AI 搜尋
          </span>
        </button>
      </div>

      {/* AI 搜尋結果 */}
      {aiResult && (
        <div className="mb-5 bg-[#f5f5f7] rounded-2xl p-4 text-sm text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">
          {aiResult}
        </div>
      )}

      {customers.length === 0 && !search && (
        <div className="rounded-2xl shadow-apple p-12 text-center text-sm text-[#8a8885]" style={{ backgroundColor: 'var(--section-bg)' }}>
          尚未建立任何客戶資料
        </div>
      )}
      {customers.length === 0 && search && (
        <div className="rounded-2xl shadow-apple p-12 text-center text-sm text-[#8a8885]" style={{ backgroundColor: 'var(--section-bg)' }}>
          找不到符合的客戶
        </div>
      )}

      <div className="space-y-2">
        {customers.map((c, idx) => (
          <div key={c.id} className="rounded-2xl shadow-apple p-5 animate-slide-up" style={{ backgroundColor: 'var(--section-bg)', animationDelay: `${idx * 30}ms` }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-[#e8e8ed] flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[#86868b]">{c.name.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-[#1d1d1f]">{c.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#8a8885]">
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && <span className="truncate">{c.email}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(JSON.parse(c.tags || '[]') as string[]).map(tag => (
                      <span key={tag} className="text-[10px] text-[#636366] bg-[#f4f3f0] px-2 py-0.5 rounded-md">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden md:block">
                  <div className="text-xs text-[#1d1d1f] font-medium">{c.totalVisits} 次</div>
                  <div className="text-[10px] text-[#8a8885]">到店</div>
                </div>
                <button onClick={() => openEdit(c)}
                  className="text-xs text-[#8a8885] hover:text-[#1d1d1f] px-2 py-1.5 rounded-lg hover:bg-[#f4f3f0]">編輯</button>
                <button onClick={() => handleDelete(c.id)}
                  className="text-xs text-[#8a8885] hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50">刪除</button>
              </div>
            </div>
            {c.notes && (
              <p className="text-xs text-[#8a8885] mt-3 pt-3 border-t border-[#f4f3f0]">{c.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowForm(false)}>
          <div className="rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[420px] animate-scale-in md:mb-0 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--section-bg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-[#1d1d1f]">{editing ? '編輯客戶' : '新增客戶'}</h3>
              <button onClick={() => setShowForm(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-5">{editing ? '修改客戶資訊' : '新增一位客戶'}</p>
            <div className="space-y-3.5">
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">姓名 *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="客戶姓名" className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">電話</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="0912-345-678" className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">Email</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="customer@mail.com" className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              </div>
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">備註</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="客戶喜好、注意事項等…"
                  className="w-full h-20 px-3 py-2 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] resize-none" /></div>
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">標籤</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_PRESETS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        form.tags.includes(tag) ? 'bg-[#1d1d1f] text-white' : 'bg-[#f4f3f0] text-[#636366] hover:bg-[#e8e8ed]'
                      }`}>{tag}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#f4f3f0]">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#8a8885] hover:bg-[#f4f3f0]">取消</button>
              <button onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e]">{editing ? '儲存變更' : '新增客戶'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
