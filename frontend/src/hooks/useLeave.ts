import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useRole } from '@/context/RoleContext';

export interface LeaveBalance {
  id: string; total: number; used: number;
  leaveType: { id: string; name: string; color: string; isActive: boolean };
}
export interface LeaveRequest {
  id: string; code: string; employeeId: string; fromDate: string; toDate: string;
  days: number; reason: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  leaveType: { id: string; name: string };
  employee: { id: string; firstName: string; lastName: string };
}
export interface ApplyLeave {
  leaveTypeId: string; fromDate: string; toDate: string; reason: string;
}
export const balanceView = (value: LeaveBalance) => ({ ...value, type: value.leaveType.name, balance: value.total - value.used, color: value.leaveType.color });
export const requestView = (value: LeaveRequest) => ({ ...value, type: value.leaveType.name, from: value.fromDate.slice(0, 10), to: value.toDate.slice(0, 10), status: value.status[0] + value.status.slice(1).toLowerCase() });
export function useLeaveBalances() {
  const { user } = useRole();
  return useQuery({ queryKey: ['leave', user?.id, 'balances'], queryFn: ({ signal }) => api.get<LeaveBalance[]>('/leave/balances', signal), enabled: !!user });
}
export function useLeaveRequests(status = '', page = 1) {
  const { user } = useRole();
  return useQuery({ queryKey: ['leave', user?.id, 'requests', status, page], queryFn: ({ signal }) => api.get<LeaveRequest[]>(`/leave/requests?page=${page}&limit=20${status ? `&status=${status}` : ''}`, signal), enabled: !!user });
}
export function useTeamLeave() {
  const { user, role } = useRole();
  return useQuery({ queryKey: ['leave', user?.id, 'team'], queryFn: ({ signal }) => api.get<LeaveRequest[]>('/leave/team-calendar', signal), enabled: !!user && role !== 'employee' });
}
export function useLeaveMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { action: 'apply'; data: ApplyLeave } | { action: 'cancel' | 'approve' | 'reject'; id: string; reason?: string }) => input.action === 'apply'
      ? api.post('/leave/requests', input.data)
      : api.put(`/leave/requests/${input.id}/${input.action}`, input.action === 'reject' ? { reason: input.reason } : {}),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['leave'] }); toast.success('Leave request saved'); },
    onError: (error: Error) => toast.error(error.message),
  });
}
