import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download } from "lucide-react";
import { auditLogs } from "@/lib/mock-data";

export default function Audit() {
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
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            <tr><th className="text-left py-3 font-medium">Timestamp</th><th className="text-left font-medium">Actor</th><th className="text-left font-medium">Action</th><th className="text-left font-medium">Target</th><th className="text-left font-medium">IP</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {auditLogs.map((l,i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="py-3 font-mono text-xs text-muted-foreground">{l.time}</td>
                <td className="font-medium">{l.actor}</td>
                <td className="text-accent">{l.action}</td>
                <td className="text-muted-foreground">{l.target}</td>
                <td className="font-mono text-xs text-muted-foreground">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}