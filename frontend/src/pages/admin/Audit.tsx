import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download } from "lucide-react";
import { useModuleQuery } from "@/hooks/useModuleQuery";
import { QueryState } from "@/components/QueryState";

export default function Audit() {
  const query = useModuleQuery<any>(['admin', 'audit'], '/admin/audit-logs?page=1&limit=100');
  const auditLogs = query.data?.data?.logs ?? [];
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Audit logs" description="Searchable trail of every action across the platform." actions={
        <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
      } />
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by actor, action, target…" className="pl-9" /></div>
        <Button variant="outline">Date range</Button>
        <Button variant="outline">Action type</Button>
      </div>
      <div className="card-surface p-6 overflow-x-auto">
        <QueryState loading={query.isPending} error={query.error} retry={query.refetch} />
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            <tr><th className="text-left py-3 font-medium">Timestamp</th><th className="text-left font-medium">Actor</th><th className="text-left font-medium">Action</th><th className="text-left font-medium">Target</th><th className="text-left font-medium">IP</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {auditLogs.map((l: any,i: number) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="py-3 font-mono text-xs text-muted-foreground">{l.timestamp ? new Date(l.timestamp).toLocaleString() : l.time}</td>
                <td className="font-medium">{l.actorName || l.actor || 'System'}</td>
                <td className="text-accent">{l.action}</td>
                <td className="text-muted-foreground">{l.target}</td>
                <td className="font-mono text-xs text-muted-foreground">{l.ipAddress || l.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
