import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useRole();
  const location = useLocation();
  if (isLoading) return <div role="status" className="min-h-screen grid place-items-center">Restoring your session…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  return <>{children}</>;
}
