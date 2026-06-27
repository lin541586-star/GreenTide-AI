import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../stores/auth-store';

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', tenantName: '' });
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authApi.register(form);
      setAuth(res.accessToken, res.user, res.tenant);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '註冊失敗');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3f0] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#1d1d1f] flex items-center justify-center mx-auto mb-4 shadow-apple-md">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2l2.5 6.5L20 11l-6.5 2.5L11 20l-2.5-6.5L2 11l6.5-2.5L11 2z" fill="white"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">建立新店家</h1>
        <p className="text-sm text-[#86868b] mt-1.5">註冊您的管理帳號</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-apple-lg p-7 animate-scale-in">
        {error && (
          <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs rounded-lg px-3.5 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-[#86868b] mb-1.5 block">您的姓名</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="王小明"
              className="w-full h-10 px-3 rounded-xl border border-[#d2d2d7] text-sm
                         focus:outline-none focus:border-[#1d1d1f] transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#86868b] mb-1.5 block">電子郵件</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full h-10 px-3 rounded-xl border border-[#d2d2d7] text-sm
                         focus:outline-none focus:border-[#1d1d1f] transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#86868b] mb-1.5 block">密碼</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="至少 6 碼"
              className="w-full h-10 px-3 rounded-xl border border-[#d2d2d7] text-sm
                         focus:outline-none focus:border-[#1d1d1f] transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#86868b] mb-1.5 block">店家名稱（選填）</label>
            <input
              value={form.tenantName}
              onChange={e => setForm({ ...form, tenantName: e.target.value })}
              placeholder="王小明的店舖"
              className="w-full h-10 px-3 rounded-xl border border-[#d2d2d7] text-sm
                         focus:outline-none focus:border-[#1d1d1f] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full h-10 rounded-xl bg-[#1d1d1f] text-white text-sm font-medium
                       hover:bg-[#2c2c2e] active:bg-[#3a3a3c] transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1f] focus-visible:ring-offset-2"
          >
            註冊
          </button>
        </form>

        <div className="mt-5 text-center">
          <span className="text-xs text-[#86868b]">已經有帳號？</span>{' '}
          <Link to="/login" className="text-xs font-medium text-[#1d1d1f] hover:underline">登入</Link>
        </div>
      </div>
    </div>
  );
}
