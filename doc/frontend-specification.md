# PulseHR — Frontend Specification

**Version:** 1.0  
**Date:** 2026-06-21

---

## 1. Current State Summary

The frontend is a complete, pixel-perfect React 18 + TypeScript application with 26 pages and full RBAC navigation. All data currently comes from `src/lib/mock-data.ts`. The backend integration task is to replace those mock imports with real API calls while keeping the UI unchanged.

**Stack:** React 18 · TypeScript 5 · Vite 5 · shadcn/ui · Tailwind CSS · TanStack Query 5 · React Router 6

---

## 2. Required Changes to Integrate Backend

### 2.1 Add Axios

```bash
cd frontend
npm install axios
```

### 2.2 Create API Client

**File: `src/lib/api/client.ts`**
```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from memory or localStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulsehr.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — attempt token refresh
let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

client.interceptors.response.use(
  (res) => res.data,  // unwrap .data so callers get the payload directly
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(client(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { accessToken } = await refresh();
        localStorage.setItem('pulsehr.token', accessToken);
        queue.forEach((cb) => cb(accessToken));
        queue = [];
        original.headers.Authorization = `Bearer ${accessToken}`;
        return client(original);
      } catch {
        localStorage.removeItem('pulsehr.token');
        localStorage.removeItem('pulsehr.refreshToken');
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err.response?.data ?? err);
  }
);

async function refresh() {
  const refreshToken = localStorage.getItem('pulsehr.refreshToken');
  const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken });
  return res.data.data;
}

export default client;
```

### 2.3 Create Auth Context

Replace `RoleContext.tsx` with a full `AuthContext.tsx` that:
1. Stores the logged-in user and their role
2. Handles login / logout
3. Provides the role to the existing `useRole()` hook (keep backward compat)

**File: `src/context/AuthContext.tsx`**
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import client from '@/lib/api/client';

interface AuthUser {
  id: string;
  email: string;
  role: 'employee' | 'manager' | 'hr' | 'admin';
  name: string;
  employeeId: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pulsehr.token');
    if (token) {
      client.get('/auth/me').then((data: any) => {
        setUser({ ...data.user, role: data.user.role.toLowerCase() });
      }).catch(() => {
        localStorage.removeItem('pulsehr.token');
        localStorage.removeItem('pulsehr.refreshToken');
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data: any = await client.post('/auth/login', { email, password });
    localStorage.setItem('pulsehr.token', data.data.accessToken);
    localStorage.setItem('pulsehr.refreshToken', data.data.refreshToken);
    setUser({ ...data.data.user, role: data.data.user.role.toLowerCase() });
    // Keep pulsehr.role in sync for sidebar
    localStorage.setItem('pulsehr.role', data.data.user.role.toLowerCase());
  };

  const logout = async () => {
    await client.post('/auth/logout').catch(() => {});
    localStorage.removeItem('pulsehr.token');
    localStorage.removeItem('pulsehr.refreshToken');
    localStorage.removeItem('pulsehr.role');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

### 2.4 Add Login Page

Create `src/pages/Login.tsx` and add `/login` route (outside AppLayout) in `App.tsx`:
```typescript
<Route path="/login" element={<Login />} />
```

### 2.5 Add Protected Route Wrapper

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
```

Wrap `AppLayout` route with `<ProtectedRoute>`.

---

## 3. API Service Files

### Pattern
```typescript
// src/lib/api/leave.ts
import client from './client';

export const leaveApi = {
  getBalances: () => client.get('/leave/balances'),
  getRequests: (params?: { page?: number; limit?: number }) =>
    client.get('/leave/requests', { params }),
  applyLeave: (data: ApplyLeaveDTO) => client.post('/leave/requests', data),
  approveLeave: (id: string) => client.put(`/leave/requests/${id}/approve`),
  rejectLeave: (id: string, reason: string) =>
    client.put(`/leave/requests/${id}/reject`, { reason }),
  cancelLeave: (id: string) => client.put(`/leave/requests/${id}/cancel`),
  getTeamCalendar: () => client.get('/leave/team-calendar'),
};
```

### TanStack Query Hooks

```typescript
// src/hooks/useLeave.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/lib/api/leave';
import { toast } from 'sonner';

export const useLeaveBalances = () =>
  useQuery({ queryKey: ['leave', 'balances'], queryFn: leaveApi.getBalances });

export const useLeaveRequests = () =>
  useQuery({ queryKey: ['leave', 'requests'], queryFn: leaveApi.getRequests });

export const useApplyLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.applyLeave,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave'] });
      toast.success('Leave applied successfully');
    },
    onError: (err: any) => toast.error(err?.error?.message ?? 'Failed to apply leave'),
  });
};
```

### All API Files to Create
| File | Endpoints Used |
|------|---------------|
| `src/lib/api/auth.ts` | /auth/* |
| `src/lib/api/employees.ts` | /employees/* |
| `src/lib/api/leave.ts` | /leave/* |
| `src/lib/api/attendance.ts` | /attendance/* |
| `src/lib/api/payslips.ts` | /payslips/* |
| `src/lib/api/documents.ts` | /documents/* |
| `src/lib/api/expenses.ts` | /expenses/* |
| `src/lib/api/helpdesk.ts` | /helpdesk/* |
| `src/lib/api/feed.ts` | /feed/* |
| `src/lib/api/directory.ts` | /directory, /org-chart |
| `src/lib/api/recruitment.ts` | /hr/recruitment/* |
| `src/lib/api/onboarding.ts` | /hr/onboarding/* |
| `src/lib/api/payroll.ts` | /hr/payroll/* |
| `src/lib/api/analytics.ts` | /hr/analytics/* |
| `src/lib/api/admin.ts` | /admin/* |

---

## 4. Page-by-Page Integration Guide

For each page, replace the mock-data import with a TanStack Query hook. Keep all existing JSX intact — only the data source changes.

### Before (mock)
```typescript
import { leaveBalances, recentLeaves } from '@/lib/mock-data';

export default function Leave() {
  return <div>{leaveBalances.map(...)}</div>;
}
```

### After (API)
```typescript
import { useLeaveBalances, useLeaveRequests } from '@/hooks/useLeave';

export default function Leave() {
  const { data: balances, isLoading } = useLeaveBalances();
  const { data: requests } = useLeaveRequests();

  if (isLoading) return <LeavePageSkeleton />;
  return <div>{balances?.data.map(...)}</div>;
}
```

### Loading States
Use shadcn `Skeleton` component — create skeleton variants that match the page layout. Never show empty divs during loading.

### Error States
Use TanStack Query's `isError` + a reusable `<ErrorState message={...} onRetry={refetch} />` component.

---

## 5. Environment Variables

Create `.env` at project root (never commit):
```
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Create `.env.example`:
```
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Vite exposes only `VITE_` prefixed variables to the browser. No secrets ever go in frontend env.

---

## 6. Feature Flags (Optional)

Use `VITE_ENABLE_MOCK=true` during development to fall back to mock data when backend is down:
```typescript
export const leaveApi = {
  getBalances: () =>
    import.meta.env.VITE_ENABLE_MOCK === 'true'
      ? Promise.resolve({ data: leaveBalances })
      : client.get('/leave/balances'),
};
```

---

## 7. Type Safety

Create `src/types/api.ts` with shared types matching the Prisma schema exactly. These types replace the implicit types from mock-data. Example:

```typescript
export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  department: { id: string; name: string };
  location?: { id: string; name: string };
  status: 'ACTIVE' | 'PROBATION' | 'NOTICE' | 'INACTIVE' | 'TERMINATED';
  avatarUrl?: string;
  dateOfJoining: string;
}

export interface LeaveBalance {
  id: string;
  leaveType: { id: string; name: string; color: string };
  total: number;
  used: number;
  balance: number;
}

// ... all entities matching Prisma schema
```

---

## 8. TopBar Role Switcher (Development Only)

The existing role switcher in `TopBar.tsx` should only render when `import.meta.env.DEV === true`. In production, the role comes from the JWT and cannot be changed via UI:

```typescript
{import.meta.env.DEV && <RoleSwitcher />}
```

---

## 9. Pagination

All list pages that show tables (Employees, Leave, Attendance, Payslips, Expenses, Helpdesk, Audit Logs) need pagination. Use offset-based pagination:

```typescript
const [page, setPage] = useState(1);
const { data } = useQuery({
  queryKey: ['employees', page],
  queryFn: () => employeesApi.list({ page, limit: 20 }),
});
// data.meta.total, data.meta.page, data.meta.totalPages
```

Add a `<Pagination />` component at the bottom of each table.

---

## 10. File Uploads

For Documents and Expenses, use `multipart/form-data`:
```typescript
const uploadDocument = async (file: File, category: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  return client.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

Use the existing shadcn `Input type="file"` component. Show upload progress with the `onUploadProgress` axios option.
