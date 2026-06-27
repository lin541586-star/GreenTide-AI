import React, { useEffect, useState } from 'react';
import { staffApi } from '../api/client';

interface Staff {
  id: string; name: string; title?: string; bio?: string; color: string; active: boolean;
}

const PRESET_COLORS = ['#F59E0B', '#6366F1', '#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4'];

export function StaffSettings() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', title: '', bio: '', color: '#6366F1' });

  const load = async () => {
    try { setStaffList(await staffApi.list()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', title: '', bio: '', color: '#6366F1' });
    setShowForm(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s.id);
    setForm({ name: s.name, title: s.title || '', bio: s.bio || '', color: s.color });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await staffApi.update(editing, form);
      } else {
        await staffApi.create(form);
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    await staffApi.remove(id);
    load();
  };

  if (loading) return <div className="p-8 text-[#8a8885] text-sm">載入中…</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">服務人員</h1>
          <p className="text-sm text-[#8a8885] mt-0.5">管理您的團隊成員與日曆顏色</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 h-9 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium
                     hover:bg-[#2c2c2e] transition-colors"
        >
          + 新增人員
        </button>
      </div>

      {staffList.length === 0 && (
        <div className="rounded-2xl shadow-apple p-12 text-center text-sm text-[#8a8885]" style={{ backgroundColor: 'var(--section-bg)' }}>
          尚未建立任何服務人員
        </div>
      )}

      <div className="space-y-2 animate-fade-in">
        {staffList.map((s, idx) => (
          <div
            key={s.id}
            className="rounded-2xl shadow-apple p-5 flex items-center justify-between animate-slide-up"
            style={{ backgroundColor: 'var(--section-bg)', animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                style={{ background: s.color }}>
                {s.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#1d1d1f]">{s.name}</h3>
                  {s.title && (
                    <span className="text-[10px] text-[#8a8885] bg-[#f4f3f0] px-1.5 py-0.5 rounded-md">{s.title}</span>
                  )}
                </div>
                {s.bio && <p className="text-xs text-[#8a8885] mt-0.5">{s.bio}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-[#f4f3f0]" style={{ background: s.color }} />
              <button onClick={() => openEdit(s)}
                className="text-xs text-[#8a8885] hover:text-[#1d1d1f] px-2.5 py-1.5 rounded-lg hover:bg-[#f4f3f0] transition-colors">
                編輯
              </button>
              <button onClick={() => handleDelete(s.id)}
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
                {editing ? '編輯人員' : '新增人員'}
              </h3>
              <button onClick={() => setShowForm(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-5">
              {editing ? '修改服務人員資料' : '新增一位服務人員'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">姓名</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 小美"
                  className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">職稱</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 資深設計師"
                  className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">簡介（選填）</label>
                <input value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="e.g. 8 年經驗，擅長日系剪髮"
                  className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">日曆顏色</label>
                <div className="flex gap-2 flex-wrap">
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
                {editing ? '儲存變更' : '新增人員'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
