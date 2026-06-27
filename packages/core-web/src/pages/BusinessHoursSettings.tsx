import React, { useEffect, useState } from 'react';
import { businessHoursApi } from '../api/client';

const DAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

interface HourItem {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isOpen: boolean;
}

export function BusinessHoursSettings() {
  const [hours, setHours] = useState<HourItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    businessHoursApi.list().then(setHours).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggle = (dow: number) => {
    setHours(prev => prev.map(h => h.dayOfWeek === dow ? { ...h, isOpen: !h.isOpen } : h));
  };

  const setTime = (dow: number, field: 'openTime' | 'closeTime', val: string) => {
    setHours(prev => prev.map(h => h.dayOfWeek === dow ? { ...h, [field]: val || null } : h));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await businessHoursApi.update(hours);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-4 md:p-8 text-[#8a8885] text-sm">載入中…</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">營業時間</h1>
          <p className="text-sm text-[#8a8885] mt-0.5">設定店家的每日營業時段</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`px-5 h-9 rounded-xl text-xs font-medium transition-all duration-200 ${
            saved ? 'bg-[#f5f5f7] text-[#86868b]' : 'bg-[#1d1d1f] text-white hover:bg-[#2c2c2e]'
          }`}>
          {saved ? '✓ 已儲存' : saving ? '儲存中…' : '儲存變更'}
        </button>
      </div>

      <div className="rounded-2xl shadow-apple divide-y divide-[#f4f3f0]" style={{ backgroundColor: 'var(--section-bg)' }}>
        {hours.map((h) => (
          <div key={h.dayOfWeek} className="flex items-center justify-between p-4 md:p-5">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => toggle(h.dayOfWeek)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  h.isOpen ? 'bg-[#1d1d1f]' : 'bg-[#d2d2d7]'
                }`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  h.isOpen ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`} />
              </button>
              <span className={`text-sm font-medium ${h.isOpen ? 'text-[#1d1d1f]' : 'text-[#aeaeb2]'}`}>
                {DAYS[h.dayOfWeek]}
              </span>
              {!h.isOpen && (
                <span className="text-[10px] text-[#aeaeb2] bg-[#f5f5f7] px-2 py-0.5 rounded-md">公休</span>
              )}
            </div>
            {h.isOpen && (
              <div className="flex items-center gap-2">
                <input type="time" value={h.openTime || '09:00'}
                  onChange={e => setTime(h.dayOfWeek, 'openTime', e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#d2d2d7] text-xs md:text-sm focus:outline-none focus:border-[#1d1d1f] w-24 md:w-28" />
                <span className="text-[#aeaeb2] text-xs">—</span>
                <input type="time" value={h.closeTime || '20:00'}
                  onChange={e => setTime(h.dayOfWeek, 'closeTime', e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#d2d2d7] text-xs md:text-sm focus:outline-none focus:border-[#1d1d1f] w-24 md:w-28" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
