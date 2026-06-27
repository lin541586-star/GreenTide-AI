import React, { useEffect, useState } from 'react';
import client from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DashboardStats {
  totalBookings: number; monthBookings: number; totalCustomers: number;
  totalRevenue: number; staffCount: number; serviceCount: number;
  productCount: number; lowStockCount: number;
}

const COLORS = ['#1d1d1f', '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6', '#14B8A6'];

export function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
  const [serviceRanking, setServiceRanking] = useState<{ id: string; name: string; count: number; revenue: number }[]>([]);
  const [staffPerf, setStaffPerf] = useState<{ id: string; name: string; bookings: number; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiAsk = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await client.post('/ai-assistant/chat', {
        message: aiQuery,
        context: 'analytics',
        contextData: { stats, revenueData, serviceRanking, staffPerf },
      });
      setAiResult(res.data.reply);
    } catch (e) { console.error(e); setAiResult('查詢失敗'); }
    finally { setAiLoading(false); }
  };

  useEffect(() => {
    Promise.all([
      client.get('/analytics/dashboard'),
      client.get('/analytics/revenue'),
      client.get('/analytics/services'),
      client.get('/analytics/staff'),
    ]).then(([s, r, sv, st]) => {
      setStats(s.data);
      setRevenueData(r.data);
      setServiceRanking(sv.data);
      setStaffPerf(st.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-[#8a8885] text-sm">載入中…</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">營運報表分析</h1>
        <p className="text-sm text-[#8a8885] mt-0.5">圖表化呈現關鍵營運數據</p>
      </div>

      {/* AI 自然語言查詢 */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <input value={aiQuery} onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAiAsk(); }}
            placeholder="用自然語言問數據相關問題，例如：上個月哪個服務最熱門？"
            className="flex-1 h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm  focus:outline-none focus:border-[#1d1d1f] transition-colors" style={{ backgroundColor: 'var(--section-bg)' }} />
          <button onClick={handleAiAsk} disabled={aiLoading || !aiQuery.trim()}
            className={`h-9 px-4 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              aiLoading || !aiQuery.trim() ? 'bg-[#f4f3f0] text-[#aeaeb2]' : 'bg-[#1d1d1f] text-white hover:bg-[#2c2c2e]'
            }`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a4 4 0 014 4c0 2-2 3-2 4v1h-4v-1c0-1-2-2-2-4a4 4 0 014-4z" />
              <path d="M8 16h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
            </svg>
            {aiLoading ? '查詢中…' : '問 AI'}
          </button>
        </div>
        {aiResult && (
          <div className="mt-3 bg-[#f5f5f7] rounded-2xl p-4 text-sm text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">
            {aiResult}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: '本月預約', value: stats.monthBookings },
            { label: '累積客戶', value: stats.totalCustomers },
            { label: '服務項目', value: stats.serviceCount },
            { label: '商品數量', value: stats.productCount },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-2xl shadow-apple p-5" style={{ backgroundColor: 'var(--section-bg)' }}>
              <div className="text-2xl font-semibold text-[#1d1d1f]">{kpi.value}</div>
              <div className="text-xs text-[#8a8885] mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 營收趨勢圖 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">營收趨勢</h2>
        <div className="rounded-2xl shadow-apple p-5" style={{ backgroundColor: 'var(--section-bg)' }}>
          {revenueData.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#8a8885]">尚無營收資料</div>
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0efeb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#aeaeb2' }} axisLine={{ stroke: '#f0efeb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#aeaeb2' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f0efeb', fontSize: 12 }} formatter={(val: number) => [`$${val}`, '營收']} />
                  <Bar dataKey="revenue" fill="#1d1d1f" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 服務排行 */}
        <div>
          <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">服務項目排行</h2>
          <div className="rounded-2xl shadow-apple p-5" style={{ backgroundColor: 'var(--section-bg)' }}>
            {serviceRanking.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#8a8885]">尚無服務資料</div>
            ) : (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={serviceRanking} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {serviceRanking.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* 簡易列表 */}
            <div className="mt-3 space-y-1.5">
              {serviceRanking.slice(0, 5).map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-[#8a8885]">{idx + 1}. {s.name}</span>
                  <span className="font-medium text-[#1d1d1f]">{s.count} 次</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 人員績效 */}
        <div>
          <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">人員績效</h2>
          <div className="rounded-2xl shadow-apple p-5" style={{ backgroundColor: 'var(--section-bg)' }}>
            {staffPerf.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#8a8885]">尚無人員資料</div>
            ) : (
              <div className="space-y-3">
                {staffPerf.map((s, idx) => (
                  <div key={s.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#1d1d1f] font-medium">{s.name}</span>
                      <span className="text-[#8a8885]">{s.bookings} 筆</span>
                    </div>
                    <div className="w-full bg-[#f4f3f0] rounded-full h-1.5">
                      <div className="bg-[#1d1d1f] h-1.5 rounded-full" style={{ width: `${Math.min((s.bookings / Math.max(...staffPerf.map(x => x.bookings))) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
