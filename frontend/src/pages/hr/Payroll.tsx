import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Users, FileText, Play, Lock, Download } from "lucide-react";
import { useModuleQuery } from "@/hooks/useModuleQuery";
import { QueryState } from "@/components/QueryState";

export default function Payroll() {
  const query = useModuleQuery<any>(['payroll', 'runs'], '/hr/payroll/runs?page=1&limit=100');
  const cycles = query.data?.data?.runs ?? [];
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Payroll" description="Run, audit and disburse payroll across cycles." actions={
        <>
          <Button variant="outline"><FileText className="h-4 w-4" /> Compliance reports</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Play className="h-4 w-4" /> Run payroll</Button>
        </>
      } />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Current cycle" value="₹6.42 Cr" delta="April 2026 — Draft" icon={Wallet} accent="primary" />
        <StatCard label="Headcount" value="489" icon={Users} accent="accent" />
        <StatCard label="TDS this month" value="₹78.4L" accent="warning" />
        <StatCard label="Compliance" value="100%" delta="PF, ESI, PT current" trend="up" accent="info" />
      </div>

      <div className="card-surface p-6">
        <QueryState loading={query.isPending} error={query.error} retry={query.refetch} />
        <h2 className="font-display font-semibold text-lg mb-4">Payroll cycles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <tr><th className="text-left py-3 font-medium">Cycle</th><th className="text-left font-medium">Employees</th><th className="text-left font-medium">Amount</th><th className="text-center font-medium">Status</th><th className="text-center font-medium">Lock</th><th></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cycles.map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="py-3 font-medium">{c.monthName ?? `${c.month ?? ''} ${c.year ?? ''}`}</td>
                  <td>{c.employeeCount ?? c.count ?? c._count?.payslips ?? 0}</td>
                  <td className="font-semibold">{c.totalNet ? `₹${Number(c.totalNet).toLocaleString('en-IN')}` : c.amount ?? '—'}</td>
                  <td className="text-center"><Badge variant="outline" className={c.status==="PAID"?"border-success/40 text-success bg-success/5":"border-warning/40 text-warning bg-warning/5"}>{c.status}</Badge></td>
                  <td className="text-center">{c.status === 'PAID' ? <Lock className="h-3.5 w-3.5 text-muted-foreground inline" /> : "—"}</td>
                  <td className="text-right"><Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-surface p-6">
          <h3 className="font-display font-semibold mb-3">Statutory</h3>
          {["PF challan generated","ESI challan generated","TDS Form 24Q","Form 16 distribution"].map(x => (
            <div key={x} className="flex items-center justify-between py-2 text-sm border-b border-border last:border-0">
              <span>{x}</span><Badge className="bg-success/10 text-success border-0">Done</Badge>
            </div>
          ))}
        </div>
        <div className="card-surface p-6">
          <h3 className="font-display font-semibold mb-3">Disbursement</h3>
          <div className="text-3xl font-display font-bold text-accent">₹6.38 Cr</div>
          <div className="text-xs text-muted-foreground">Transferred 31 Mar via NEFT</div>
          <Button variant="outline" size="sm" className="w-full mt-4"><Download className="h-3.5 w-3.5" /> Bank file</Button>
        </div>
        <div className="card-surface p-6">
          <h3 className="font-display font-semibold mb-3">Quick actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">Process F&F</Button>
            <Button variant="outline" className="w-full justify-start">Run arrears</Button>
            <Button variant="outline" className="w-full justify-start">Bonus payout</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
