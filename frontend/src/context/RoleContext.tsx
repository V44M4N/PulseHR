import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Role } from '@/lib/roles';
import { ApiError, api, apiRequest, clearSession, onSessionExpired, restoreSession, setAccessToken } from '@/lib/api-client';

interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  employeeId: string;
  avatar?: string;
  designation?: string;
}
interface Me {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  employee: { id: string; firstName: string; lastName: string; avatarUrl?: string; designation: string } | null;
}
interface RoleContextValue {
  user: AuthUser | null;
  role: Role;
  isLoading: boolean;
  sessionError: string | null;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}
const RoleContext = createContext<RoleContextValue | undefined>(undefined);

async function loadUser(): Promise<AuthUser> {
  const { data } = await api.get<Me>('/auth/me');
  const role = data.role.toLowerCase();
  if (!['employee', 'manager', 'hr', 'admin'].includes(role) || !data.isActive || !data.employee) throw new Error('This account cannot access PulseHR');
  return { id: data.id, email: data.email, role: role as Role, employeeId: data.employee.id,
    name: `${data.employee.firstName} ${data.employee.lastName}`, avatar: data.employee.avatarUrl,
    designation: data.employee.designation };
}

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    const unsubscribe = onSessionExpired(() => { setUser(null); queryClient.clear(); });
    restoreSession().then(loadUser).then(value => { if (active) setUser(value); })
      .catch(error => {
        if (active) clearSession();
        if (active && !(error instanceof ApiError && error.status === 401)) {
          setSessionError('Unable to restore your session. Check the server connection and sign in again.');
        }
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; unsubscribe(); };
  }, [queryClient]);

  const login = async (email: string, password: string, mfaCode?: string) => {
    setSessionError(null);
    const { data } = await apiRequest<{ accessToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password, ...(mfaCode ? { mfaCode } : {}) }),
    }, false);
    setAccessToken(data.accessToken);
    try {
      const authenticatedUser = await loadUser();
      queryClient.clear();
      setUser(authenticatedUser);
    } catch (error) { clearSession(); throw error; }
  };
  const logout = async () => {
    setSessionError(null);
    try { await api.post('/auth/logout'); }
    catch { setSessionError('Server sign-out failed. Your local session was cleared; retry signing out when the server is available.'); }
    finally { clearSession(); }
  };
  return <RoleContext.Provider value={{ user, role: user?.role ?? 'employee', isLoading, sessionError, login, logout }}>{children}</RoleContext.Provider>;
};
export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within RoleProvider');
  return context;
};
