import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';

interface Product {
  id: string; name: string; sku?: string; category: string;
  quantity: number; minStock: number; unit: string;
  price?: number; cost?: number; active: boolean;
}

interface Movement {
  id: string; type: string; quantity: number; note?: string; createdAt: string;
}

const PRESET_CATEGORIES = ['general', '原料', '商品', '耗材', '包裝'];

const CATEGORY_LABELS: Record<string, string> = {
  general: '一般', 原料: '原料', 商品: '商品', 耗材: '耗材', 包裝: '包裝',
};

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', category: 'general', quantity: 0, minStock: 5, unit: '個', price: 0, cost: 0 });
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('inventory_custom_categories') || '[]'); } catch { return []; }
  });
  const [hiddenPresets, setHiddenPresets] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('inventory_hidden_preset_categories') || '[]'); } catch { return []; }
  });

  const availablePresets = PRESET_CATEGORIES.filter(c => !hiddenPresets.includes(c));
  const allCategories = [...availablePresets, ...customCategories];

  const persistCategories = (custom: string[], hidden: string[]) => {
    setCustomCategories(custom);
    setHiddenPresets(hidden);
    localStorage.setItem('inventory_custom_categories', JSON.stringify(custom));
    localStorage.setItem('inventory_hidden_preset_categories', JSON.stringify(hidden));
  };

  const addCustomCategory = () => {
    const name = newCatName.trim();
    if (!name || allCategories.includes(name)) return;
    persistCategories([...customCategories, name], hiddenPresets);
    setNewCatName('');
  };

  const removeCategory = (name: string) => {
    if (PRESET_CATEGORIES.includes(name)) {
      persistCategories(customCategories, [...hiddenPresets, name]);
    } else {
      persistCategories(customCategories.filter(c => c !== name), hiddenPresets);
    }
  };

  const restorePreset = (name: string) => {
    persistCategories(customCategories, hiddenPresets.filter(c => c !== name));
  };
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [movementForm, setMovementForm] = useState({ type: 'in', quantity: 1, note: '' });
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ raw: string; items: any[] } | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await client.post('/ai-assistant/chat', {
        message: '分析目前庫存狀況，指出需要注意的項目並給出補貨建議',
        context: 'inventory',
      });
      setAiResult(res.data.reply);
    } catch (e) { console.error(e); setAiResult('AI 分析失敗'); }
    finally { setAiLoading(false); }
  };

  const load = useCallback(async () => {
    try {
      const params = category ? `?category=${encodeURIComponent(category)}` : '';
      setProducts((await client.get(`/inventory${params}`)).data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', sku: '', category: allCategories[0] || 'general', quantity: 0, minStock: 5, unit: '個', price: 0, cost: 0 });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p.id);
    setForm({
      name: p.name, sku: p.sku || '', category: p.category,
      quantity: p.quantity, minStock: p.minStock, unit: p.unit,
      price: p.price || 0, cost: p.cost || 0,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await client.put(`/inventory/${editing}`, form);
      } else {
        await client.post('/inventory', form);
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此商品？')) return;
    await client.delete(`/inventory/${id}`);
    load();
  };

  const showMovements = async (p: Product) => {
    setMovementProduct(p);
    try {
      setMovements((await client.get(`/inventory/${p.id}/movements`)).data);
    } catch (e) { console.error(e); }
  };

  const handleMovement = async () => {
    if (!movementProduct) return;
    try {
      await client.post(`/inventory/${movementProduct.id}/movements`, movementForm);
      setMovementForm({ type: 'in', quantity: 1, note: '' });
      showMovements(movementProduct);
      load();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-8 text-[#8a8885] text-sm">載入中…</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">庫存管理</h1>
          <p className="text-sm text-[#8a8885] mt-0.5">管理商品庫存與進出貨記錄</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScanOpen(true)}
            className="h-9 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 hover:opacity-80"
            style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--text-secondary)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 8V5a1 1 0 011-1h3M2 16v3a1 1 0 001 1h3M22 8V5a1 1 0 00-1-1h-3M22 16v3a1 1 0 01-1 1h-3" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            AI 掃描
          </button>
          <button onClick={handleAiAnalysis} disabled={aiLoading}
            style={{
              backgroundColor: aiLoading ? 'var(--btn-secondary-bg)' : 'var(--btn-secondary-bg)',
              color: aiLoading ? 'var(--text-secondary)' : 'var(--text-secondary)',
            }}
            className="h-9 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 hover:opacity-80">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a4 4 0 014 4c0 2-2 3-2 4v1h-4v-1c0-1-2-2-2-4a4 4 0 014-4z" />
              <path d="M8 16h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
            </svg>
            {aiLoading ? '分析中…' : 'AI 分析'}
          </button>
          <button onClick={openNew}
            className="px-4 h-9 rounded-xl text-xs font-medium transition-colors"
            style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--accent-text)' }}>
            + 新增商品
          </button>
        </div>
      </div>

      {/* AI 分析結果 */}
      {aiResult && (
        <div className="mb-5 rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
          style={{ backgroundColor: 'var(--section-bg)', color: 'var(--text-primary)' }}>
          {aiResult}
        </div>
      )}

      {/* 分類篩選 */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button onClick={() => setCategory('')}
          style={{
            backgroundColor: !category ? 'var(--btn-primary-bg)' : 'var(--btn-secondary-bg)',
            color: !category ? 'var(--accent-text)' : 'var(--text-secondary)',
          }}
          className="px-3 py-1.5 rounded-lg text-xs transition-all">全部</button>
        {[...new Set([...availablePresets, ...customCategories, ...products.map(p => p.category)])].map(c => (
          <button key={c} onClick={() => setCategory(c)}
            style={{
              backgroundColor: category === c ? 'var(--btn-primary-bg)' : 'var(--btn-secondary-bg)',
              color: category === c ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
            className="px-3 py-1.5 rounded-lg text-xs transition-all">
            {CATEGORY_LABELS[c] || c}
          </button>
        ))}
        <button onClick={() => setCatManagerOpen(true)}
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
          className="px-3 py-1.5 rounded-lg text-xs transition-all border border-dashed hover:opacity-80">
          + 管理分類
        </button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl shadow-apple p-12 text-center text-sm"
          style={{ backgroundColor: 'var(--section-bg)', color: 'var(--text-secondary)' }}>尚未建立任何商品</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map(p => {
            const lowStock = p.quantity <= p.minStock;
            return (
              <div key={p.id} className="rounded-2xl shadow-apple p-5"
                style={{ backgroundColor: 'var(--section-bg)' }}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                      {p.sku && <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{p.sku}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                        style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--hover-bg)' }}>
                        {CATEGORY_LABELS[p.category] || p.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className={`text-lg font-semibold ${lowStock ? 'text-amber-600' : ''}`}
                      style={{ color: lowStock ? undefined : 'var(--text-primary)' }}>
                      {p.quantity}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{p.unit}</div>
                    {lowStock && <div className="text-[10px] text-amber-600 font-medium mt-0.5">⚠ 低庫存</div>}
                  </div>
                </div>
                {(p.price || p.cost) && (
                  <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {p.price && <span>售價 NT${p.price}</span>}
                    {p.cost && <span>成本 NT${p.cost}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t"
                  style={{ borderColor: 'var(--border-light)' }}>
                  <button onClick={() => showMovements(p)}
                    className="flex-1 py-1.5 rounded-lg text-xs transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>出入庫</button>
                  <button onClick={() => openEdit(p)}
                    className="flex-1 py-1.5 rounded-lg text-xs transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>編輯</button>
                  <button onClick={() => handleDelete(p.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs transition-colors hover:text-red-500"
                    style={{ color: 'var(--text-secondary)' }}>刪除</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowForm(false)}>
          <div className="rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[460px] animate-scale-in md:mb-0 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--modal-bg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{editing ? '編輯商品' : '新增商品'}</h3>
              <button onClick={() => setShowForm(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-5">{editing ? '修改商品資訊' : '新增一項商品或物料'}</p>
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">商品名稱</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. 洗髮精"
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">商品編號</label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001"
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">分類</label>
                  <select value={form.category === '_custom' ? customCat || form.category : form.category} onChange={e => { setForm({ ...form, category: e.target.value }); }}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm bg-white focus:outline-none focus:border-[#1d1d1f] appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=12 height=12 viewBox=0 0 12 12 fill=none xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M3 5l3 3 3-3%27 stroke=%27%238a8885%27 strokeWidth=%271.5%27 strokeLinecap=%27round%27 strokeLinejoin=%27round%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                    {allCategories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">單位</label>
                  <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">目前庫存</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">低庫存警戒</label>
                  <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">售價 (NT$)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">成本 (NT$)</label>
                  <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#f4f3f0]">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-[#8a8885] hover:bg-[#f4f3f0]">取消</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e]">{editing ? '儲存變更' : '新增商品'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {catManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setCatManagerOpen(false)}>
          <div className="rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[420px] animate-scale-in md:mb-0 max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--modal-bg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>管理分類</h3>
              <button onClick={() => setCatManagerOpen(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-4">在此新增或刪除分類</p>

            {/* 新增分類 */}
            <div className="flex items-center gap-2 mb-4">
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
                placeholder="輸入新分類名稱"
                className="flex-1 h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" />
              <button onClick={addCustomCategory}
                className="h-9 px-4 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e] transition-colors">新增</button>
            </div>

            {/* 目前分類清單 */}
            <div className="border-t border-[#f4f3f0] pt-3">
              <div className="text-[10px] font-medium text-[#aeaeb2] uppercase tracking-wider mb-2">目前分類</div>
              {allCategories.length === 0 ? (
                <div className="text-xs text-[#8a8885] py-4 text-center text-[#1d1d1f]">尚無分類，請在上方新增</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {allCategories.map(c => (
                    <div key={c} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white border border-[#d2d2d7] hover:border-[#c7c7cc] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#1d1d1f]">{CATEGORY_LABELS[c] || c}</span>
                        {PRESET_CATEGORIES.includes(c) && <span className="text-[10px] text-[#aeaeb2]">（預設）</span>}
                      </div>
                      <button onClick={() => removeCategory(c)}
                        className="px-2.5 py-1.5 rounded-md text-xs text-red-500 hover:bg-red-50 transition-colors font-medium">
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 已隱藏的預設分類 — 可還原 */}
            {hiddenPresets.length > 0 && (
              <div className="border-t border-[#f4f3f0] pt-3 mt-3">
                <div className="text-[10px] font-medium text-[#aeaeb2] uppercase tracking-wider mb-2">已隱藏的分類（點擊還原）</div>
                <div className="flex flex-wrap gap-1.5">
                  {hiddenPresets.map(c => (
                    <button key={c} onClick={() => restorePreset(c)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-[#f4f3f0] text-[#8a8885] hover:bg-[#e8e8ed] hover:text-[#1d1d1f] transition-colors line-through">
                      {CATEGORY_LABELS[c] || c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4 pt-3 border-t border-[#f4f3f0]">
              <button onClick={() => setCatManagerOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e] transition-colors">完成</button>
            </div>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {movementProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => { setMovementProduct(null); setMovements([]); }}>
          <div className="rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[440px] animate-scale-in md:mb-0 max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--modal-bg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-[#1d1d1f]">{movementProduct.name} - 出入庫</h3>
              <button onClick={() => { setMovementProduct(null); setMovements([]); }} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-4">目前庫存：{movementProduct.quantity} {movementProduct.unit}</p>

            {/* 新增異動 */}
            <div className="flex items-center gap-2 mb-4">
              <select value={movementForm.type} onChange={e => setMovementForm({ ...movementForm, type: e.target.value })}
                className="h-9 px-2.5 rounded-lg border border-[#d2d2d7] text-xs bg-white focus:outline-none focus:border-[#1d1d1f]">
                <option value="in">進貨 +</option>
                <option value="out">出貨 -</option>
              </select>
              <input type="number" value={movementForm.quantity} min={1}
                onChange={e => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value) || 1 })}
                className="w-16 h-9 px-2.5 rounded-lg border border-[#d2d2d7] text-xs text-center focus:outline-none focus:border-[#1d1d1f]" />
              <input value={movementForm.note} onChange={e => setMovementForm({ ...movementForm, note: e.target.value })}
                placeholder="備註" className="flex-1 h-9 px-2.5 rounded-lg border border-[#d2d2d7] text-xs focus:outline-none focus:border-[#1d1d1f]" />
              <button onClick={handleMovement}
                className="h-9 px-3 rounded-lg bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e]">確定</button>
            </div>

            {/* 異動記錄 */}
            <div className="border-t border-[#f4f3f0] pt-3">
              <div className="text-[10px] font-medium text-[#aeaeb2] uppercase tracking-wider mb-2">歷史記錄</div>
              {movements.length === 0 ? (
                <div className="text-xs text-[#8a8885] py-4 text-center">尚無記錄</div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {movements.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${m.type === 'in' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {m.type === 'in' ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                        {m.note && <span className="text-[11px] text-[#8a8885]">{m.note}</span>}
                      </div>
                      <span className="text-[10px] text-[#aeaeb2]">{new Date(m.createdAt).toLocaleString('zh-TW')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI 掃描對話框 */}
      {scanOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => { setScanOpen(false); setScanResult(null); setCapturedImage(null); }}>
          <div className="rounded-t-2xl md:rounded-2xl w-full md:w-[540px] max-h-[85vh] flex flex-col shadow-apple-xl"
            style={{ backgroundColor: 'var(--container-bg)' }}
            onClick={e => e.stopPropagation()}>
            {/* 標題 */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>📷 AI 庫存掃描</h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>用手機拍照或上傳圖片，AI 自動辨識物品與數量</p>
              </div>
              <button onClick={() => { setScanOpen(false); setScanResult(null); setCapturedImage(null); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 圖片預覽 */}
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-light)', backgroundColor: capturedImage ? '#000' : 'var(--hover-bg)' }}>
                {capturedImage ? (
                  <img src={capturedImage} alt="拍攝" className="w-full h-48 object-contain" />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="1.5">
                      <path d="M2 8V5a1 1 0 011-1h3M2 16v3a1 1 0 001 1h3M22 8V5a1 1 0 00-1-1h-3M22 16v3a1 1 0 01-1 1h-3" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              {!capturedImage && !scanLoading && (
                <div className="flex gap-2">
                  {/* 拍照按鈕 — 使用 capture，PWA 與瀏覽器皆相容 */}
                  <label className="flex-1 h-10 rounded-xl text-xs font-medium transition-colors flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--accent-text)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    拍照
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setCapturedImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                  <label className="flex-1 h-10 rounded-xl text-xs font-medium transition-colors flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--text-secondary)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    選擇圖片
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setCapturedImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                </div>
              )}

              {/* AI 掃描按鈕 */}
              {capturedImage && !scanResult && !scanLoading && (
                <button onClick={async () => {
                  setScanLoading(true);
                  try {
                    const base64 = capturedImage.split(',')[1];
                    const res = await client.post('/inventory/ai-scan', { imageBase64: base64, mimeType: 'image/jpeg' });
                    setScanResult(res.data);
                  } catch { alert('AI 掃描失敗，請確認 AI 設定是否正確'); }
                  setScanLoading(false);
                }}
                  className="w-full h-10 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--accent-text)' }}>
                  {scanLoading ? (
                    <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 辨識中…</>
                  ) : '🤖 AI 辨識物品'}
                </button>
              )}
              {capturedImage && !scanResult && !scanLoading && (
                <button onClick={() => { setCapturedImage(null); }}
                  className="w-full h-9 rounded-xl text-[11px] transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
                  重新拍攝
                </button>
              )}

              {/* 掃描結果 */}
              {scanLoading && (
                <div className="text-center py-6">
                  <div className="w-8 h-8 border-2 border-[#d2d2d7] border-t-[#1d1d1f] rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>AI 正在辨識圖片中的物品…</p>
                </div>
              )}
              {scanResult && scanResult.items.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                    ✅ 辨識到 {scanResult.items.length} 項物品
                  </h4>
                  <div className="space-y-2">
                    {scanResult.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl"
                        style={{ backgroundColor: 'var(--hover-bg)' }}>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                          <div className="text-[10px] flex items-center gap-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            <span>{item.category || '一般'}</span>
                            <span>× {item.quantity || 1}{item.unit || '個'}</span>
                            {item.price && <span>NT${item.price}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={async () => {
                    try {
                      await client.post('/inventory/ai-scan/create', { items: scanResult.items });
                      setScanOpen(false);
                      setScanResult(null);
                      setCapturedImage(null);
                      load();
                    } catch { alert('新增失敗'); }
                  }}
                    className="w-full h-10 rounded-xl text-xs font-medium mt-3 transition-colors"
                    style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--accent-text)' }}>
                    📦 一鍵新增全部到庫存
                  </button>
                </div>
              )}
              {scanResult && scanResult.items.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>AI 無法從圖片中辨識出物品</p>
                  <button onClick={() => { setCapturedImage(null); setScanResult(null); }}
                    className="text-xs underline" style={{ color: 'var(--text-secondary)' }}>重新拍攝</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
