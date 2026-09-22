import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Upload, Download, Users, UserCheck, UserMinus, Briefcase } from "lucide-react";
import { useModuleQuery } from "@/hooks/useModuleQuery";
import { QueryState } from "@/components/QueryState";

export default function Employees() {
  const query = useModuleQuery<any>(['employees'], '/employees?page=1&limit=100');
  const employees = query.data?.data?.employees ?? [];
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader title="Employees" description="Master employee records, lifecycle and bulk operations." actions={
        <>
          <Button variant="outline"><Upload className="h-4 w-4" /> Import</Button>
          <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> Add employee</Button>
        </>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total headcount" value="489" delta="+18 MoM" trend="up" icon={Users} accent="primary" />
        <StatCard label="Active" value="471" icon={UserCheck} accent="accent" />
        <StatCard label="Probation" value="14" icon={Briefcase} accent="info" />
        <StatCard label="Notice period" value="4" icon={UserMinus} accent="warning" />
      </div>

      <div className="card-surface p-6">
        <QueryState loading={query.isPending} error={query.error} retry={query.refetch} />
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search employees…" className="pl-9" /></div>
          <Button variant="outline">Department</Button>
          <Button variant="outline">Status</Button>
          <Button variant="outline">Location</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <tr><th className="text-left py-3 font-medium">Employee</th><th className="text-left font-medium">ID</th><th className="text-left font-medium">Department</th><th className="text-left font-medium">Location</th><th className="text-center font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((e: any) => (
                <tr key={e.id} className="hover:bg-muted/30 cursor-pointer">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="bg-accent/10 text-accent text-xs">{`${e.firstName?.[0] ?? ''}${e.lastName?.[0] ?? ''}`}</AvatarFallback></Avatar>
                      <div><div className="font-medium">{e.firstName} {e.lastName}</div><div className="text-xs text-muted-foreground">{e.designation}</div></div>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">{e.employeeCode}</td>
                  <td>{e.department?.name ?? '—'}</td>
                  <td className="text-muted-foreground">{e.location?.name ?? '—'}</td>
                  <td className="text-center"><Badge variant="outline" className={
                    e.status === "ACTIVE" ? "border-success/40 text-success bg-success/5" :
                    e.status === "PROBATION" ? "border-info/40 text-info bg-info/5" :
                    "border-warning/40 text-warning bg-warning/5"
                  }>{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
