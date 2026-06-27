import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: any | null;
  tenant: any | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user: any, tenant: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  tenant: JSON.parse(localStorage.getItem('tenant') || 'null'),
  isLoggedIn: !!localStorage.getItem('token'),
  setAuth: (token, user, tenant) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tenant', JSON.stringify(tenant));
    set({ token, user, tenant, isLoggedIn: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    set({ token: null, user: null, tenant: null, isLoggedIn: false });
  },
}));
