import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, BookOpen } from "lucide-react";
import { useModuleQuery } from "@/hooks/useModuleQuery";
import { QueryState } from "@/components/QueryState";

export default function Helpdesk() {
  const query = useModuleQuery<any>(['helpdesk'], '/helpdesk?page=1&limit=100');
  const tickets = query.data?.data?.tickets ?? [];
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="HR Helpdesk" description="Raise tickets, track resolutions and access the knowledge base." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> New ticket</Button>
      } />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card-surface p-6 lg:col-span-2">
          <QueryState loading={query.isPending} error={query.error} retry={query.refetch} />
          <h2 className="font-display font-semibold text-lg mb-4">My tickets</h2>
          <div className="space-y-3">
            {tickets.map((t: any) => (
              <div key={t.id} className="p-4 rounded-xl border border-border hover:border-accent/40 transition-colors bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><MessageSquare className="h-4 w-4" /></div>
                    <div>
                      <div className="text-xs text-muted-foreground font-mono">{t.code || t.id}</div>
                      <div className="font-medium text-sm">{t.title}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{t.category}</Badge>
                        <Badge variant="outline" className={
                          t.priority === "HIGH" ? "border-destructive/40 text-destructive bg-destructive/5" :
                          t.priority === "MEDIUM" ? "border-warning/40 text-warning bg-warning/5" :
                          "border-info/40 text-info bg-info/5"
                        }>{t.priority}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      t.status === "RESOLVED" ? "bg-success/10 text-success border-0" :
                      t.status === "IN_PROGRESS" ? "bg-warning/10 text-warning border-0" :
                      "bg-info/10 text-info border-0"
                    }>{t.status}</Badge>
                    <div className="text-xs text-muted-foreground mt-1">{t.updated}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center gap-2 mb-4"><BookOpen className="h-5 w-5 text-accent" /><h2 className="font-display font-semibold text-lg">Knowledge base</h2></div>
          <div className="space-y-2">
            {["How do I update bank details?","Leave encashment policy","Reimbursement turnaround time","How to download Form 16","Apply for compensatory off","Notice period rules"].map(q => (
              <button key={q} className="w-full text-left p-3 rounded-lg hover:bg-muted text-sm">{q}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
