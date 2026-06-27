import React, { useState, useEffect, useCallback } from 'react';
import { staffApi, servicesApi, bookingApi } from '../api/client';

interface Staff { id: string; name: string; title?: string; color: string }
interface Service { id: string; name: string; duration: number; price?: number; priceTiers?: { label: string; price: number }[] | null; color: string }
interface Booking { id: string; staffId: string; customerName: string; date: string; startTime: string; endTime: string; status: string }

const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
function getMonthDays(y: number, m: number) {
  const fd = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const d: (number | null)[] = Array(fd).fill(null);
  for (let i = 1; i <= dim; i++) d.push(i);
  return d;
}
function fmtDate(y: number, m: number, d: number) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

const TS: string[] = [];
for (let h = 8; h <= 20; h++) { TS.push(`${String(h).padStart(2, '0')}:00`); if (h < 20) TS.push(`${String(h).padStart(2, '0')}:30`); }

export function BookingPage() {
  const t = new Date();
  const [y, sy] = useState(t.getFullYear());
  const [m, sm] = useState(t.getMonth());
  const [sd, ssd] = useState<Date>(t);
  const [sf, ssf] = useState<string | null>(null);
  const [sl, ssl] = useState<Staff[]>([]);
  const [sv, ssv] = useState<Service[]>([]);
  const [bk, sbk] = useState<Booking[]>([]);
  const [ld, sld] = useState(true);
  const [modal, smodal] = useState(false);
  const [slot, sslot] = useState<any>(null);
  const [fm, sfm] = useState({ n: '', c: '', s: '', tier: '' });
  const [err, serr] = useState('');
  const [ok, sok] = useState('');
  const [viewMode, setViewMode] = useState<'A' | 'B' | 'C'>('A');
  const [showCal, setShowCal] = useState(false);
  const [selBk, sselBk] = useState<Booking | null>(null);
  const [bkModal, sbkModal] = useState(false);

  const load = useCallback(async () => {
    try { const [a, b] = await Promise.all([staffApi.list(), servicesApi.list()]); ssl(a); ssv(b); }
    catch (e) { console.error(e); } finally { sld(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const ds = fmtDate(sd.getFullYear(), sd.getMonth(), sd.getDate());
  const lb = useCallback(async (d: string) => { try { sbk(await bookingApi.findByDate(d)); } catch (e) { console.error(e); } }, []);
  useEffect(() => { lb(ds); sok(''); }, [ds, lb]);

  const days = getMonthDays(y, m);
  const prv = () => { if (m === 0) { sy(y => y - 1); sm(11); } else sm(m => m - 1); };
  const nxt = () => { if (m === 11) { sy(y => y + 1); sm(0); } else sm(m => m + 1); };

  const hc = (sid: string, st: string, et: string) => {
    sslot({ sid, d: ds, st, et }); sfm({ n: '', c: '', s: '', tier: '' }); serr(''); smodal(true);
  };

  const hb = async () => {
    if (!fm.n.trim()) { serr('請輸入姓名'); return; }
    if (!slot) return;
    try {
      await bookingApi.create({ staffId: slot.sid, date: slot.d, startTime: slot.st, endTime: slot.et, customerName: fm.n, customerContact: fm.c || undefined, serviceId: fm.s || undefined, note: fm.tier ? `價格方案: ${fm.tier}` : undefined });
      smodal(false); sok('✅ 預約成功'); lb(slot.d);
    } catch (err: any) { serr(err.response?.data?.error || '預約失敗'); }
  };

  const handleComplete = async (id: string) => {
    try {
      await bookingApi.updateStatus(id, 'completed');
      sbkModal(false); sselBk(null); sok('✅ 已標記為完成'); lb(ds);
    } catch (err: any) { serr(err.response?.data?.error || '操作失敗'); }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('確定取消此預約？')) return;
    try {
      await bookingApi.cancel(id);
      sbkModal(false); sselBk(null); sok('✅ 已取消預約'); lb(ds);
    } catch (err: any) { serr(err.response?.data?.error || '操作失敗'); }
  };

  const ds2 = sf ? sl.filter(x => x.id === sf) : sl;
  if (ld) return <div className="p-4 md:p-8 text-[#8a8885] text-sm">載入中…</div>;

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-5">
        <div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-[#1d1d1f]">📅 預約</h1>
          <p className="text-xs md:text-sm text-[#8a8885] mt-0.5 hidden md:block">查看與管理預約時段</p>
        </div>
        <button onClick={() => { const n = new Date(); sy(n.getFullYear()); sm(n.getMonth()); ssd(n); }}
          className="text-xs text-[#8a8885] hover:text-[#1d1d1f] px-2.5 md:px-3 py-1.5 rounded-lg hover:bg-white transition-colors">今天</button>
      </div>

      {ok && <div className="bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] text-xs rounded-xl px-4 py-2.5 mb-3 animate-slide-up">{ok}</div>}

      {/* 手機：切換月曆顯示 */}
      <button onClick={() => setShowCal(!showCal)} className="md:hidden w-full flex items-center justify-between bg-white rounded-xl shadow-apple px-4 py-2.5 mb-3 text-sm">
        <span>{y} 年 {m + 1} 月 · {sd.getDate()} 日</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${showCal ? 'rotate-180' : ''}`}>
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={`md:flex gap-5 ${showCal ? 'block' : 'hidden md:flex'}`}>
        {/* 月曆 */}
        <div className="w-full md:w-[264px] shrink-0 mb-3 md:mb-0">
          <div className="bg-white rounded-2xl shadow-apple p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={prv} className="w-7 h-7 rounded-lg text-[#8a8885] hover:bg-[#f4f3f0] transition-all flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span className="text-sm font-semibold text-[#1d1d1f]">{y} 年 {m + 1} 月</span>
              <button onClick={nxt} className="w-7 h-7 rounded-lg text-[#8a8885] hover:bg-[#f4f3f0] transition-all flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 text-center mb-1">
              {DAYS_ZH.map(d => <div key={d} className="text-[10px] text-[#aeaeb2] font-medium py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day, i) => {
                if (!day) return <div key={i} />;
                const sel = day === sd.getDate() && m === sd.getMonth() && y === sd.getFullYear();
                const td = day === t.getDate() && m === t.getMonth() && y === t.getFullYear();
                const hb = bk.some(b => parseInt(b.date.split('-')[2]) === day);
                return (
                  <button key={i} onClick={() => { ssd(new Date(y, m, day)); sok(''); setShowCal(false); }}
                    className={`relative text-center text-xs py-1.5 rounded-lg transition-all duration-150 ${sel ? 'bg-[#1d1d1f] text-white font-semibold shadow-sm' : td ? 'bg-[#f4f3f0] font-medium text-[#1d1d1f]' : 'text-[#1d1d1f] hover:bg-[#f4f3f0]'}`}>
                    {day}{hb && !sel && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1d1d1f]" />}
                  </button>
                );
              })}
            </div>
            {/* 人員 */}
            <div className="mt-3 pt-3 border-t border-[#f4f3f0]">
              <div className="text-[10px] font-medium text-[#aeaeb2] uppercase tracking-wider mb-2">人員</div>
              <div className="flex md:block gap-1.5 overflow-x-auto md:space-y-0.5 pb-1 md:pb-0">
                {sl.map(s => (
                  <button key={s.id} onClick={() => ssf(sf === s.id ? null : s.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap md:whitespace-normal transition-all ${sf === s.id ? 'bg-[#f4f3f0] font-medium' : 'hover:bg-[#f4f3f0]'}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[#1d1d1f]">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 時間表 — 手機可以左右滑 */}
        <div className="flex-1 min-w-0">
          {/* 日期標題：移到卡片外，與月曆頂部對齊（桌機） */}
          <div className="hidden md:flex items-center gap-2 mb-2 px-0.5">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">{sd.getMonth() + 1}月{sd.getDate()}日</h3>
            <span className="text-xs text-[#aeaeb2]">星期{DAYS_ZH[sd.getDay()]}</span>
            <span className="text-xs text-[#aeaeb2] ml-auto">{bk.length} 筆</span>
          </div>
          <div className="bg-[#edeae5] rounded-2xl shadow-apple p-3 md:p-4 overflow-x-auto">
            {/* 手機版才在卡片內顯示日期 */}
            <div className="md:hidden flex items-center gap-2 mb-3 px-1">
              <h3 className="text-sm font-semibold text-[#1d1d1f]">{sd.getMonth() + 1}月{sd.getDate()}日</h3>
              <span className="text-xs text-[#aeaeb2]">星期{DAYS_ZH[sd.getDay()]}</span>
              <span className="text-xs text-[#aeaeb2] ml-auto">{bk.length} 筆</span>
            </div>
            <div className="min-w-[500px] md:min-w-0">
              {TS.map((time) => {
                const isHour = time.endsWith(':00');
                const h = parseInt(time);
                const ea = time.endsWith(':00') ? `${String(h + 1).padStart(2, '0')}:00` : `${String(h).padStart(2, '0')}:30`;
                return (
                  <div key={time} className="flex items-start border-b border-[#e5e4e2] last:border-0">
                    <div className="w-12 md:w-14 shrink-0 pt-0.5"><span className={`text-[10px] ${isHour ? 'text-[#aeaeb2]' : 'text-transparent'}`}>{isHour ? time : '—'}</span></div>
                    <div className="flex-1 flex gap-1 py-0.5" style={{ minHeight: isHour ? 40 : 20 }}>
                      {ds2.map(staff => {
                        const booking = bk.find(b => b.staffId === staff.id && b.startTime === time);
                        if (booking) return (
                          <div key={staff.id} onClick={() => { sselBk(booking); sbkModal(true); }} className="flex-1 rounded-lg px-1.5 md:px-2.5 py-1 text-[10px] md:text-xs truncate flex items-center bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeft: `3px solid ${staff.color}` }}>
                            <span className="font-medium text-[#1d1d1f] truncate">{booking.customerName}</span>
                            {booking.status === 'completed' && <span className="ml-1 text-[#34c759] text-[9px] shrink-0">✓</span>}
                          </div>
                        );
                        return <div key={staff.id} onClick={() => hc(staff.id, time, ea)} className="flex-1 rounded-md bg-white/60 hover:bg-white cursor-pointer transition-colors" style={{ minHeight: isHour ? 36 : 16 }} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 預約詳情/操作 Modal */}
      {bkModal && selBk && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => { sbkModal(false); sselBk(null); }}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[380px] animate-scale-in md:mb-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-[#1d1d1f]">預約詳情</h3>
              <button onClick={() => { sbkModal(false); sselBk(null); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="space-y-2 mt-3 text-sm">
              <div className="flex justify-between"><span className="text-[#8a8885]">顧客</span><span className="font-medium text-[#1d1d1f]">{selBk.customerName}</span></div>
              <div className="flex justify-between"><span className="text-[#8a8885]">日期</span><span className="text-[#1d1d1f]">{selBk.date}</span></div>
              <div className="flex justify-between"><span className="text-[#8a8885]">時間</span><span className="text-[#1d1d1f]">{selBk.startTime} - {selBk.endTime}</span></div>
              <div className="flex justify-between"><span className="text-[#8a8885]">狀態</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${selBk.status === 'completed' ? 'bg-[#f0fdf4] text-[#166534]' : selBk.status === 'cancelled' ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#f4f3f0] text-[#8a8885]'}`}>
                  {selBk.status === 'completed' ? '已完成' : selBk.status === 'cancelled' ? '已取消' : '已確認'}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-[#f4f3f0]">
              {selBk.status === 'confirmed' && (
                <>
                  <button onClick={() => handleCancel(selBk.id)} className="flex-1 md:flex-none px-4 py-2.5 md:py-2 rounded-xl text-xs font-medium text-[#dc2626] hover:bg-[#fef2f2] transition-colors">取消預約</button>
                  <button onClick={() => handleComplete(selBk.id)} className="flex-1 md:flex-none px-5 py-2.5 md:py-2 rounded-xl bg-[#34c759] text-white text-xs font-medium hover:bg-[#2db84e] transition-colors">標記完成</button>
                </>
              )}
              {selBk.status !== 'confirmed' && (
                <button onClick={() => { sbkModal(false); sselBk(null); }} className="flex-1 md:flex-none px-4 py-2.5 md:py-2 rounded-xl text-xs font-medium text-[#8a8885] hover:bg-[#f4f3f0] transition-colors">關閉</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 新增預約 Modal — 手機全寬 */}
      {modal && slot && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => smodal(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[380px] animate-scale-in md:mb-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-[#1d1d1f]">新增預約</h3>
              <button onClick={() => smodal(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-4">{slot.d} · {slot.st} - {slot.et}</p>
            {err && <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs rounded-xl px-3.5 py-2.5 mb-3">{err}</div>}
            <div className="space-y-3.5">
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">姓名</label>
                <input value={fm.n} onChange={e => sfm({ ...fm, n: e.target.value })} placeholder="顧客姓名" className="w-full h-10 md:h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors" autoFocus /></div>
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">聯絡方式</label>
                <input value={fm.c} onChange={e => sfm({ ...fm, c: e.target.value })} placeholder="電話或 LINE" className="w-full h-10 md:h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f] transition-colors" /></div>
              {/* 模式切換 */}
              <div className="flex bg-[#f4f3f0] rounded-xl p-0.5">
                {(['A', 'B', 'C'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === mode ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#8a8885] hover:text-[#1d1d1f]'}`}>
                    方案 {mode}
                  </button>
                ))}
              </div>

              {/* 方案 A：下拉選單 + 階梯按鈕 */}
              {viewMode === 'A' && (
                <div>
                  <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">服務項目</label>
                  <select value={fm.s} onChange={e => sfm({ ...fm, s: e.target.value, tier: '' })}
                    className="w-full h-10 md:h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm bg-white focus:outline-none focus:border-[#1d1d1f] appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=12 height=12 viewBox=0 0 12 12 fill=none xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M3 5l3 3 3-3%27 stroke=%27%238a8885%27 strokeWidth=%271.5%27 strokeLinecap=%27round%27 strokeLinejoin=%27round%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                    <option value="">不指定</option>
                    {sv.map(s => <option key={s.id} value={s.id}>{s.name}（{s.duration}分{s.price ? ` NT$${s.price}` : ''}）</option>)}
                  </select>
                  {(() => {
                    const selSvc = sv.find(s => s.id === fm.s);
                    if (selSvc?.priceTiers?.length) {
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selSvc.priceTiers.map(t => (
                            <button key={t.label} onClick={() => sfm({ ...fm, tier: t.label })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${fm.tier === t.label ? 'bg-[#1d1d1f] text-white shadow-sm' : 'bg-[#f4f3f0] text-[#636366] hover:bg-[#e8e8ed]'}`}>
                              {t.label} NT${t.price}
                            </button>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* 方案 B：卡片清單 + 階梯按鈕 */}
              {viewMode === 'B' && (
                <div>
                  <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">服務項目</label>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {sv.map(s => {
                      const sel = fm.s === s.id;
                      return (
                        <div key={s.id} onClick={() => { sfm({ ...fm, s: s.id, tier: '' }); }}
                          className={`rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${sel ? 'border-[#1d1d1f] bg-[#fafafa]' : 'border-[#e8e8ed] hover:border-[#d2d2d7]'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#1d1d1f]">{s.name}</span>
                            <span className="text-xs text-[#8a8885]">
                              {s.priceTiers?.length ? `起 NT$${Math.min(...s.priceTiers.map(t => t.price))}` : s.price ? `NT$${s.price}` : ''}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#aeaeb2] mt-0.5">{s.duration} 分鐘</p>
                          {sel && s.priceTiers?.length ? (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[#e8e8ed]">
                              {s.priceTiers.map(t => (
                                <button key={t.label} onClick={e => { e.stopPropagation(); sfm({ ...fm, s: s.id, tier: t.label }); }}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${fm.tier === t.label ? 'bg-[#1d1d1f] text-white shadow-sm' : 'bg-[#f4f3f0] text-[#636366] hover:bg-[#e8e8ed]'}`}>
                                  {t.label} NT${t.price}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 方案 C：選項平鋪（每個價位獨立選項） */}
              {viewMode === 'C' && (
                <div>
                  <label className="text-xs font-medium text-[#8a8885] mb-1.5 block">服務項目</label>
                  <select value={fm.tier ? `${fm.s}::${fm.tier}` : fm.s} onChange={e => {
                    const v = e.target.value;
                    if (!v) { sfm({ ...fm, s: '', tier: '' }); return; }
                    const parts = v.split('::');
                    sfm({ ...fm, s: parts[0], tier: parts[1] || '' });
                  }}
                    className="w-full h-10 md:h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm bg-white focus:outline-none focus:border-[#1d1d1f] appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=12 height=12 viewBox=0 0 12 12 fill=none xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M3 5l3 3 3-3%27 stroke=%27%238a8885%27 strokeWidth=%271.5%27 strokeLinecap=%27round%27 strokeLinejoin=%27round%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                    <option value="">不指定</option>
                    {sv.map(s => {
                      if (s.priceTiers?.length) {
                        return s.priceTiers.map(t => (
                          <option key={`${s.id}::${t.label}`} value={`${s.id}::${t.label}`}>
                            {s.name} - {t.label} NT${t.price}（{s.duration}分）
                          </option>
                        ));
                      }
                      return <option key={s.id} value={s.id}>{s.name}（{s.duration}分{s.price ? ` NT$${s.price}` : ''}）</option>;
                    })}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-[#f4f3f0]">
              <button onClick={() => smodal(false)} className="flex-1 md:flex-none px-4 py-2.5 md:py-2 rounded-xl text-xs font-medium text-[#8a8885] hover:bg-[#f4f3f0] transition-colors">取消</button>
              <button onClick={hb} className="flex-1 md:flex-none px-5 py-2.5 md:py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e] transition-colors">確認預約</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
