import React, { useEffect, useState } from 'react';
import { usersAdminApi, rolesApi } from '../api/client';

interface UserItem {
  id: string; email: string; name: string; role: string;
  roleId: string | null; active: boolean; createdAt: string;
  roleDef?: { id: string; name: string; level: number } | null;
}

interface RoleItem {
  id: string; name: string; level: number; permissions: string; isSystem: boolean;
}

const CATEGORY_ORDER = ['預約管理', '服務項目', '服務人員', '營業時間', '小工具', '店家設定', '員工管理', '報表'];

export function UsersSettings() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permDefs, setPermDefs] = useState<{ code: string; label: string; category: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'roles'>('users');

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ email: '', password: '', name: '', roleId: '' });

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<{ name: string; level: number; permissions: string[] }>({ name: '', level: 99, permissions: [] });

  const load = async () => {
    try {
      const [u, r, p] = await Promise.all([
        usersAdminApi.list(), rolesApi.list(), rolesApi.getPermissions(),
      ]);
      setUsers(u); setRoles(r); setPermDefs(p);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNewUser = () => {
    setEditingUser(null);
    setUserForm({ email: '', password: '', name: '', roleId: roles[0]?.id || '' });
    setShowUserForm(true);
  };

  const openEditUser = (u: UserItem) => {
    setEditingUser(u.id);
    setUserForm({ email: u.email, password: '', name: u.name, roleId: u.roleId || '' });
    setShowUserForm(true);
  };

  const saveUser = async () => {
    try {
      if (editingUser) {
        await usersAdminApi.update(editingUser, { name: userForm.name, roleId: userForm.roleId || null, password: userForm.password || undefined });
      } else {
        await usersAdminApi.create(userForm);
      }
      setShowUserForm(false); load();
    } catch (e: any) { alert(e.response?.data?.error || '操作失敗'); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('確定刪除此員工帳號？')) return;
    await usersAdminApi.remove(id); load();
  };

  const openNewRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', level: 99, permissions: [] });
    setShowRoleForm(true);
  };

  const openEditRole = (r: RoleItem) => {
    setEditingRole(r.id);
    setRoleForm({ name: r.name, level: r.level, permissions: JSON.parse(r.permissions) });
    setShowRoleForm(true);
  };

  const togglePerm = (code: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter(p => p !== code)
        : [...prev.permissions, code],
    }));
  };

  const saveRole = async () => {
    try {
      if (editingRole) {
        await rolesApi.update(editingRole, roleForm);
      } else {
        await rolesApi.create(roleForm);
      }
      setShowRoleForm(false); load();
    } catch (e: any) { alert(e.response?.data?.error || '操作失敗'); }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('確定刪除此角色？')) return;
    await rolesApi.remove(id); load();
  };

  if (loading) return <div className="p-4 md:p-8 text-[#8a8885] text-sm">載入中…</div>;

  const groupedPerms = CATEGORY_ORDER.map(cat => ({
    category: cat,
    items: permDefs.filter(p => p.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">員工管理</h1>
          <p className="text-sm text-[#8a8885] mt-0.5">管理帳號與操作權限</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f5f7] rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab('users')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'users' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#8a8885] hover:text-[#1d1d1f]'}`}>
          員工帳號
        </button>
        <button onClick={() => setTab('roles')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'roles' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#8a8885] hover:text-[#1d1d1f]'}`}>
          權限角色
        </button>
      </div>

      {/* ====== 員工帳號 Tab ====== */}
      {tab === 'users' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={openNewUser}
              className="px-4 h-9 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e] transition-colors">
              + 新增員工
            </button>
          </div>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="rounded-2xl shadow-apple p-4 md:p-5 flex items-center justify-between" style={{ backgroundColor: 'var(--section-bg)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#e8e8ed] flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-[#86868b]">{u.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1d1d1f]">{u.name}</span>
                      {!u.active && <span className="text-[10px] text-[#aeaeb2] bg-[#f5f5f7] px-1.5 py-0.5 rounded-md">停用</span>}
                    </div>
                    <p className="text-xs text-[#8a8885] truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-[#8a8885] bg-[#f4f3f0] px-2 py-1 rounded-md hidden md:inline">
                    {u.roleDef?.name || '未設定'}
                  </span>
                  <button onClick={() => openEditUser(u)}
                    className="text-xs text-[#8a8885] hover:text-[#1d1d1f] px-2 py-1 rounded-lg hover:bg-[#f4f3f0]">編輯</button>
                  <button onClick={() => deleteUser(u.id)}
                    className="text-xs text-[#8a8885] hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50">刪除</button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="rounded-2xl shadow-apple p-12 text-center text-sm text-[#8a8885]" style={{ backgroundColor: 'var(--section-bg)' }}>
                尚未建立任何員工帳號
              </div>
            )}
          </div>
        </>
      )}

      {/* ====== 權限角色 Tab ====== */}
      {tab === 'roles' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={openNewRole}
              className="px-4 h-9 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e] transition-colors">
              + 新增角色
            </button>
          </div>
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.id} className="rounded-2xl shadow-apple p-4 md:p-5" style={{ backgroundColor: 'var(--section-bg)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1d1d1f]">{r.name}</span>
                    <span className="text-[10px] text-[#8a8885]">Lv.{r.level}</span>
                    {r.isSystem && <span className="text-[10px] text-[#aeaeb2] bg-[#f5f5f7] px-1.5 py-0.5 rounded-md">系統</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditRole(r)}
                      className="text-xs text-[#8a8885] hover:text-[#1d1d1f] px-2 py-1 rounded-lg hover:bg-[#f4f3f0]">編輯</button>
                    {!r.isSystem && (
                      <button onClick={() => deleteRole(r.id)}
                        className="text-xs text-[#8a8885] hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50">刪除</button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(JSON.parse(r.permissions) as string[]).includes('*') ? (
                    <span className="text-[10px] text-[#10B981] bg-[#f0fdf4] px-2 py-0.5 rounded-md">全部權限</span>
                  ) : (
                    (JSON.parse(r.permissions) as string[]).map(p => {
                      const def = permDefs.find(d => d.code === p);
                      return <span key={p} className="text-[10px] text-[#636366] bg-[#f4f3f0] px-2 py-0.5 rounded-md">{def?.label || p}</span>;
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== User Form Modal ===== */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowUserForm(false)}>
          <div className="rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[400px] animate-scale-in" style={{ backgroundColor: 'var(--section-bg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-[#1d1d1f]">{editingUser ? '編輯員工' : '新增員工'}</h3>
              <button onClick={() => setShowUserForm(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-5">{editingUser ? '修改員工帳號資訊' : '新增一位可登入系統的員工'}</p>
            <div className="space-y-3.5">
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">姓名</label>
                <input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">Email</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">{editingUser ? '新密碼（留空不變）' : '密碼'}</label>
                <input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">權限角色</label>
                <select value={userForm.roleId} onChange={e => setUserForm({ ...userForm, roleId: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm  focus:outline-none focus:border-[#1d1d1f] appearance-none"
                  style={{ backgroundColor: 'var(--section-bg)', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=12 height=12 viewBox=0 0 12 12 fill=none xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M3 5l3 3 3-3%27 stroke=%27%238a8885%27 strokeWidth=%271.5%27 strokeLinecap=%27round%27 strokeLinejoin=%27round%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                  <option value="">不分配</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select></div>
            </div>
            <div className="flex gap-2 mt-5 pt-3 border-t border-[#f4f3f0]">
              <button onClick={() => setShowUserForm(false)}
                className="flex-1 md:flex-none px-4 py-2.5 md:py-2 rounded-xl text-xs font-medium text-[#8a8885] hover:bg-[#f4f3f0]">取消</button>
              <button onClick={saveUser}
                className="flex-1 md:flex-none px-5 py-2.5 md:py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e]">{editingUser ? '儲存' : '新增'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Role Form Modal ===== */}
      {showRoleForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowRoleForm(false)}>
          <div className="rounded-t-2xl md:rounded-2xl shadow-apple-xl p-5 md:p-6 w-full md:w-[500px] animate-scale-in max-h-[85vh] overflow-y-auto" style={{ backgroundColor: 'var(--section-bg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-[#1d1d1f]">{editingRole ? '編輯角色' : '新增角色'}</h3>
              <button onClick={() => setShowRoleForm(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f3f0]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#8a8885" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-[#8a8885] mb-5">設定角色名稱與可操作的功能權限</p>

            <div className="space-y-3.5 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">角色名稱</label>
                  <input value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
                <div><label className="text-xs font-medium text-[#8a8885] mb-1.5 block">權限等級</label>
                  <input type="number" value={roleForm.level} onChange={e => setRoleForm({ ...roleForm, level: parseInt(e.target.value) || 99 })}
                    className="w-full h-9 px-3 rounded-xl border border-[#d2d2d7] text-sm focus:outline-none focus:border-[#1d1d1f]" /></div>
              </div>
            </div>

            <div className="border-t border-[#f4f3f0] pt-4">
              <p className="text-xs font-medium text-[#8a8885] mb-3">權限設定（勾選即可操作的功能）</p>
              <div className="space-y-4">
                {groupedPerms.map(g => (
                  <div key={g.category}>
                    <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-2">{g.category}</p>
                    <div className="flex flex-wrap gap-2">
                      {g.items.map(p => (
                        <label key={p.code}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${
                            roleForm.permissions.includes(p.code) ? 'bg-[#1d1d1f] text-white' : 'bg-[#f4f3f0] text-[#636366] hover:bg-[#e8e8ed]'
                          }`}>
                          <input type="checkbox" checked={roleForm.permissions.includes(p.code)}
                            onChange={() => togglePerm(p.code)} className="hidden" />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-3 border-t border-[#f4f3f0]">
              <button onClick={() => setShowRoleForm(false)}
                className="flex-1 md:flex-none px-4 py-2.5 md:py-2 rounded-xl text-xs font-medium text-[#8a8885] hover:bg-[#f4f3f0]">取消</button>
              <button onClick={saveRole}
                className="flex-1 md:flex-none px-5 py-2.5 md:py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-medium hover:bg-[#2c2c2e]">{editingRole ? '儲存' : '新增'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
