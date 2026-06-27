import React, { useEffect, useState } from 'react';
import { servicesApi } from '../api/client';

interface Service {
  id: string; name: string; duration: number; price?: number; priceTiers?: { label: string; price: number }[] | null; color: string; active: boolean;
}

const PRESET_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#6366F1', '#14B8A6'];

export function ServicesSettings() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', duration: 60, price: 0, color: '#3B82F6', useTiers: false, tiers: [{ label: '', price: 0 } as { label: string; price: number }] });

  const load = async () => {
    try { setServices(await servicesApi.list()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', duration: 60, price: 0, color: '#3B82F6', useTiers: false, tiers: [{ label: '', price: 0 }] });
    setShowForm(true);
  };

  const openEdit = (svc: Service) => {
    setEditing(svc.id);
    const hasTiers = !!svc.priceTiers && svc.priceTiers.length > 0;
    setForm({
      name: svc.name, duration: svc.duration, price: svc.price || 0, color: svc.color,
      useTiers: hasTiers,
      tiers: hasTiers ? svc.priceTiers! : [{ label: '', price: 0 }],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      const payload: any = { name: form.name, duration: form.duration, color: form.color };
      if (form.useTiers) {
        payload.price = form.price || undefined;
        payload.priceTiers = form.tiers.filter(t => t.label.trim() && t.price > 0);
      } else {
        payload.price = form.price || undefined;
        payload.priceTiers = null;
      }
      if (editing) {
        await servicesApi.update(editing, payload);
      } else {
        await servicesApi.create(payload);
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    await servicesApi.remove(id);
    load();
  };

  if (loading) return <div className="p-8 text-[#8a8885] text-sm">載入中…</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">服務項目</h1>
          <p className="text-sm text-[#8a8885] mt-0.5">管理您的服務內容與價格</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 h-9 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium
                     hover:bg-[#2c2c2e] transition-colors"
        >
          + 新增服務
        </button>
      </div>

      {services.length === 0 && (
        <div className="rounded-2xl shadow-apple p-12 text-center text-sm text-[#8a8885]" style={{ backgroundColor: 'var(--section-bg)' }}>
          尚未建立任何服務項目
        </div>
      )}

      <div className="space-y-2 animate-fade-in">
        {services.map((svc, idx) => (
          <div
            key={svc.id}
            className="rounded-2xl shadow-apple p-5 flex items-center justify-between animate-slide-up"
            style={{ backgroundColor: 'var(--section-bg)', animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: svc.color }} />
              <div>
                <h3 className="text-sm font-medium text-[#1d1d1f]">{svc.name}</h3>
                <p className="text-xs text-[#8a8885] mt-0.5">
                  {svc.duration} 分鐘
                  {svc.priceTiers?.length
                    ? ` · 起 NT$${Math.min(...svc.priceTiers.map(t => t.price))}`
                    : svc.price
                      ? ` · NT$${svc.price}`
                      : ' · 未設定價格'}
                </p>
                {svc.priceTiers?.length ? (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {svc.priceTiers.map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f4f3f0] text-[#636366]">
                        {t.label} NT${t.price}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(svc)}
                className="text-xs text-[#8a8885] hover:text-[#1d1d1f] px-2.5 py-1.5 rounded-lg hover:bg-[#f4f3f0] transition-colors">
                編輯
              </button>
              <button onClick={() => handleDelete(svc.id)}
                className="text-xs text-[#8a8885] hover:text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowForm(false)}>
          <div className="rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[380px] animate-scale-in md:mb-0 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--section-bg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-[#1d1d1f]">
                {editing ? '編輯服務' : '新增服務'}
              </h3>
              <button onClick={() => setShowForm(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-5">
              {editing ? '修改服務項目內容' : '為您的店家新增一項服務'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">服務名稱</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 剪髮、全身按摩"
                  className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">所需時間（分）</label>
                  <input type="number" value={form.duration}
                    onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">
                    價格（NT$）{form.useTiers ? '（起）' : ''}
                  </label>
                  <input type="number" value={form.price}
                    onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
                  />
                </div>
              </div>

              {/* 階梯價格開關 */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-sm text-[#1d1d1f]">階梯價格</div>
                  <div className="text-[11px] text-[#86868b]">例如短/中/長髮不同價格</div>
                </div>
                <button onClick={() => setForm({ ...form, useTiers: !form.useTiers })}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.useTiers ? 'bg-[#34c759]' : 'bg-[#e8e8ed]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.useTiers ? 'translate-x-4' : ''}`} />
                </button>
              </div>

              {form.useTiers && (
                <div className="border border-[#e8e8ed] rounded-xl p-3 space-y-2 bg-[#fafafa]">
                  <div className="text-[10px] font-medium text-[#aeaeb2] uppercase tracking-wider">價格階層</div>
                  {form.tiers.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input value={tier.label} onChange={e => {
                        const t = [...form.tiers]; t[idx] = { ...t[idx], label: e.target.value }; setForm({ ...form, tiers: t });
                      }} placeholder="標籤 e.g. 短髮"
                        className="flex-1 h-8 px-2.5 rounded-lg border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" />
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#aeaeb2]">NT$</span>
                        <input type="number" value={tier.price || ''} onChange={e => {
                          const t = [...form.tiers]; t[idx] = { ...t[idx], price: parseInt(e.target.value) || 0 }; setForm({ ...form, tiers: t });
                        }} placeholder="0"
                          className="w-24 h-8 pl-9 pr-2.5 rounded-lg border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" />
                      </div>
                      {form.tiers.length > 1 && (
                        <button onClick={() => setForm({ ...form, tiers: form.tiers.filter((_, i) => i !== idx) })}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-[#aeaeb2] hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 3l7 7M9.5 3l-7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {form.tiers.length < 6 && (
                    <button onClick={() => setForm({ ...form, tiers: [...form.tiers, { label: '', price: 0 }] })}
                      className="w-full h-7 rounded-lg border border-dashed border-[#d2d2d7] text-[11px] text-[#aeaeb2] hover:border-[#8a8885] hover:text-[#636366] transition-colors">
                      + 新增階層
                    </button>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">顏色</label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-[#1d1d1f] ring-offset-2 scale-110' : 'hover:scale-110'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#f4f3f0]">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#8a8885] hover:bg-[#f4f3f0] transition-colors">
                取消
              </button>
              <button onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e] transition-colors">
                {editing ? '儲存變更' : '新增服務'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
