import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default client;

// ============ Auth API ============
export const authApi = {
  login: (data: { email: string; password: string }) =>
    client.post('/auth/login', data).then((r) => r.data),
  register: (data: { email: string; password: string; name: string; tenantName?: string }) =>
    client.post('/auth/register', data).then((r) => r.data),
};

// ============ Tenant API ============
export const tenantApi = {
  get: () => client.get('/tenant').then((r) => r.data),
  update: (data: { name?: string; industry?: string }) =>
    client.patch('/tenant', data).then((r) => r.data),
  getAiConfig: () => client.get('/tenant/ai-config').then((r) => r.data),
  updateAiConfig: (data: any) => client.put('/tenant/ai-config', data).then((r) => r.data),
};

// ============ Services API ============
export const servicesApi = {
  list: () => client.get('/services').then((r) => r.data),
  create: (data: { name: string; duration: number; price?: number; color?: string }) =>
    client.post('/services', data).then((r) => r.data),
  update: (id: string, data: any) =>
    client.patch(`/services/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    client.delete(`/services/${id}`).then((r) => r.data),
};

// ============ Staff API ============
export const staffApi = {
  list: () => client.get('/staff').then((r) => r.data),
  create: (data: { name: string; title?: string; color?: string }) =>
    client.post('/staff', data).then((r) => r.data),
  update: (id: string, data: any) =>
    client.patch(`/staff/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    client.delete(`/staff/${id}`).then((r) => r.data),
};

// ============ Booking API ============
export const bookingApi = {
  list: (params?: { date?: string; staffId?: string }) =>
    client.get('/bookings', { params }).then((r) => r.data),
  findByDate: (date: string) =>
    client.get('/bookings/by-date', { params: { date } }).then((r) => r.data),
  create: (data: {
    staffId: string;
    serviceId?: string;
    customerName: string;
    customerContact?: string;
    date: string;
    startTime: string;
    endTime: string;
    note?: string;
  }) => client.post('/bookings', data).then((r) => r.data),
  cancel: (id: string) =>
    client.post(`/bookings/${id}/cancel`).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    client.patch(`/bookings/${id}/status`, { status }).then((r) => r.data),
};

// ============ Business Hours API ============
export const businessHoursApi = {
  list: () => client.get('/business-hours').then((r) => r.data),
  update: (hours: { dayOfWeek: number; openTime?: string | null; closeTime?: string | null; isOpen?: boolean }[]) =>
    client.put('/business-hours', { hours }).then((r) => r.data),
};

// ============ Roles API ============
export const rolesApi = {
  list: () => client.get('/roles').then((r) => r.data),
  getPermissions: () => client.get('/roles/permissions').then((r) => r.data),
  create: (data: { name: string; level: number; permissions: string[] }) =>
    client.post('/roles', data).then((r) => r.data),
  update: (id: string, data: { name?: string; level?: number; permissions?: string[] }) =>
    client.put(`/roles/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    client.delete(`/roles/${id}`).then((r) => r.data),
};

// ============ AI 應答規則 API ============
export const aiRuleApi = {
  list: () => client.get('/ai-rules').then((r) => r.data),
  create: (data: { rule: string }) =>
    client.post('/ai-rules', data).then((r) => r.data),
  update: (id: string, data: { rule?: string; enabled?: boolean; sortOrder?: number }) =>
    client.put(`/ai-rules/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    client.delete(`/ai-rules/${id}`).then((r) => r.data),
  /** AI 優化規則文案 */
  refine: (data: { rule: string }) =>
    client.post('/ai-assistant/refine-rule', data).then((r) => r.data),
  /** 與 AI 討論規則 */
  chat: (data: { messages: { role: 'user' | 'assistant'; content: string }[] }) =>
    client.post('/ai-assistant/chat-rule', data).then((r) => r.data),
};

// ============ Users Admin API ============
export const usersAdminApi = {
  list: () => client.get('/users-admin').then((r) => r.data),
  create: (data: { email: string; password: string; name: string; roleId?: string }) =>
    client.post('/users-admin', data).then((r) => r.data),
  update: (id: string, data: { name?: string; roleId?: string | null; active?: boolean; password?: string }) =>
    client.put(`/users-admin/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    client.delete(`/users-admin/${id}`).then((r) => r.data),
};
