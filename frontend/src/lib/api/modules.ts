import { api } from '@/lib/api-client';

export const moduleApi = {
  attendance: {
    today: () => api.get('/attendance/today'), week: () => api.get('/attendance/week'), monthly: (month?: string) => api.get(`/attendance/monthly${month ? `?month=${month}` : ''}`),
    clockIn: () => api.post('/attendance/clock-in'), clockOut: () => api.post('/attendance/clock-out'),
  },
  payslips: { list: () => api.get('/payslips'), detail: (id: string) => api.get(`/payslips/${id}`), pdf: (id: string) => api.get(`/payslips/${id}/pdf`) },
  documents: { list: (category?: string) => api.get(`/documents${category ? `?category=${encodeURIComponent(category)}` : ''}`), download: (id: string) => api.get(`/documents/${id}/download`), remove: (id: string) => api.delete(`/documents/${id}`) },
  expenses: { list: () => api.get('/expenses'), create: (body: unknown) => api.post('/expenses', body), approve: (id: string) => api.put(`/expenses/${id}/approve`), reject: (id: string, reason: string) => api.put(`/expenses/${id}/reject`, { reason }) },
  helpdesk: { list: () => api.get('/helpdesk/tickets'), create: (body: unknown) => api.post('/helpdesk/tickets', body), update: (id: string, body: unknown) => api.put(`/helpdesk/tickets/${id}`, body) },
  feed: { list: () => api.get('/feed'), create: (body: unknown) => api.post('/feed', body), react: (id: string) => api.post(`/feed/${id}/react`) },
  directory: { list: (search?: string) => api.get(`/directory${search ? `?search=${encodeURIComponent(search)}` : ''}`), chart: () => api.get('/org-chart') },
  employees: { list: (query = '') => api.get(`/employees${query ? `?${query}` : ''}`), get: (id: string) => api.get(`/employees/${id}`), create: (body: unknown) => api.post('/employees', body), update: (id: string, body: unknown) => api.put(`/employees/${id}`, body), status: (id: string, status: string) => api.put(`/employees/${id}/status`, { status }) },
  recruitment: { jobs: () => api.get('/hr/recruitment/jobs'), candidates: () => api.get('/hr/recruitment/candidates'), createJob: (body: unknown) => api.post('/hr/recruitment/jobs', body), createCandidate: (body: unknown) => api.post('/hr/recruitment/candidates', body), move: (id: string, stage: string) => api.put(`/hr/recruitment/candidates/${id}/stage`, { stage }) },
  onboarding: { list: () => api.get('/hr/onboarding'), tasks: (employeeId: string) => api.get(`/hr/onboarding/${employeeId}/tasks`), updateTask: (employeeId: string, taskId: string, body: unknown) => api.put(`/hr/onboarding/${employeeId}/tasks/${taskId}`, body) },
  payroll: { runs: () => api.get('/hr/payroll/runs'), createRun: (body: unknown) => api.post('/hr/payroll/runs', body), process: (id: string) => api.post(`/hr/payroll/runs/${id}/process`), markPaid: (id: string) => api.post(`/hr/payroll/runs/${id}/paid`) },
  analytics: { headcount: () => api.get('/hr/analytics/headcount'), attrition: () => api.get('/hr/analytics/attrition'), kpis: () => api.get('/hr/analytics/kpis') },
  admin: { roles: () => api.get('/admin/roles'), departments: () => api.get('/admin/org/departments'), locations: () => api.get('/admin/org/locations'), audit: () => api.get('/admin/audit-logs'), settings: () => api.get('/admin/settings'), workflows: () => api.get('/admin/workflows') },
};
