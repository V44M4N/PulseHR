import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { useRole } from "@/context/RoleContext";
import { QueryState } from "@/components/QueryState";
import { balanceView, requestView, useLeaveBalances, useLeaveRequests, useTeamLeave, useLeaveMutation } from "@/hooks/useLeave";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Filter, Download } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Leave() {
  const { user, role } = useRole();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' });
  const balances = useLeaveBalances();
  const requests = useLeaveRequests(status, page);
  const team = useTeamLeave();
  const mutation = useLeaveMutation();
  const leaveBalances = (balances.data?.data ?? []).map(balanceView);
  const recentLeaves = (requests.data?.data ?? []).map(requestView);
  const teamLeaves = (team.data?.data ?? []).map(item => ({ ...requestView(item), name: `${item.employee.firstName} ${item.employee.lastName}` }));
  const submit = () => mutation.mutate({ action: 'apply', data: form }, { onSuccess: () => { setOpen(false); setForm({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' }); } });
  if (balances.isPending || requests.isPending || balances.error || requests.error) return <QueryState loading={balances.isPending || requests.isPending} error={balances.error || requests.error} retry={() => { void balances.refetch(); void requests.refetch(); }} />;

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Leave management" description="Apply, track and manage your time off." actions={
        <>
          <Button variant="outline" onClick={() => { const blob = new Blob([JSON.stringify(requests.data?.data ?? [], null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "leave-requests-page.json"; link.click(); URL.revokeObjectURL(url); }}><Download className="h-4 w-4" /> Export</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> Apply leave</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply for leave</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Leave type</Label>
                  <Select value={form.leaveTypeId} onValueChange={leaveTypeId => setForm({ ...form, leaveTypeId })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {leaveBalances.map(l => <SelectItem key={l.id} value={l.leaveType.id} disabled={!l.leaveType.isActive}>{l.type} ({l.balance} left)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>From</Label><Input type="date" className="mt-1" value={form.fromDate} onChange={e => setForm({ ...form, fromDate: e.target.value })} /></div>
                  <div><Label>To</Label><Input type="date" className="mt-1" min={form.fromDate} value={form.toDate} onChange={e => setForm({ ...form, toDate: e.target.value })} /></div>
                </div>
                <div><Label>Reason</Label><Textarea value={form.reason} maxLength={500} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Brief description" className="mt-1" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={mutation.isPending || !form.leaveTypeId || !form.fromDate || !form.toDate || form.toDate < form.fromDate || form.reason.trim().length < 5} onClick={submit} className="bg-accent text-accent-foreground">{mutation.isPending ? "Submitting…" : "Submit"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveBalances.map(lb => (
          <div key={lb.type} className="card-surface p-5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{lb.type}</div>
            <div className="flex items-baseline gap-1 mt-2"><span className="text-3xl font-display font-bold">{lb.balance}</span><span className="text-sm text-muted-foreground">/ {lb.total}</span></div>
            <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(lb.total ? lb.balance/lb.total : 0)*100}%`, background: lb.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Recent requests</h2>
            <Select value={status || "ALL"} onValueChange={value => { setStatus(value === "ALL" ? "" : value); setPage(1); }}><SelectTrigger className="w-36"><SelectValue placeholder="Filter" /></SelectTrigger><SelectContent>{["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr><th className="text-left py-3 font-medium">ID</th><th className="text-left font-medium">Type</th><th className="text-left font-medium">Dates</th><th className="text-left font-medium">Days</th><th className="text-left font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentLeaves.map(l => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="py-3 font-mono text-xs text-muted-foreground">{l.code}</td>
                    <td className="font-medium">{l.type}</td>
                    <td className="text-muted-foreground text-xs">{l.from} → {l.to}</td>
                    <td>{l.days}</td>
                    <td><Badge variant="outline" className={
                      l.status === "Approved" ? "border-success/40 text-success bg-success/5" :
                      l.status === "Pending" ? "border-warning/40 text-warning bg-warning/5" :
                      "border-destructive/40 text-destructive bg-destructive/5"
                    }>{l.status}</Badge>
                      {l.status === 'Pending' && l.employeeId === user?.employeeId && <Button variant="ghost" size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'cancel', id: l.id })}>Cancel</Button>}
                    </td>
                  </tr>
                ))}
                {!recentLeaves.length && <tr><td colSpan={5} className="py-6 text-muted-foreground">No leave requests found.</td></tr>}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4"><Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-xs">Page {page} of {Math.max(1, requests.data?.meta?.totalPages ?? 1)}</span><Button variant="outline" disabled={page >= (requests.data?.meta?.totalPages ?? 1)} onClick={() => setPage(page + 1)}>Next</Button></div>
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Team on leave</h2>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {role === 'employee' && <p className="text-sm text-muted-foreground">Team calendar is available to managers and HR.</p>}
            {role !== 'employee' && <QueryState loading={team.isPending} error={team.error} retry={team.refetch} />}
            {role !== 'employee' && !team.isPending && !team.error && !teamLeaves.length && <p className="text-sm text-muted-foreground">No team leave this month.</p>}
            {teamLeaves.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.from} – {p.to}</div>
                </div>
                <Badge className="bg-accent/10 text-accent border-0">{p.type}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}