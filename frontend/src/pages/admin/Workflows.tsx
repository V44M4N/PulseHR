import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Workflow, Plus, Zap, ArrowRight } from "lucide-react";

const workflows = [
  { name: "Leave approval — default", trigger: "Leave applied", steps: ["Manager","HR (>5 days)"], active: true, runs: 348 },
  { name: "Expense reimbursement", trigger: "Expense submitted", steps: ["Manager","Finance"], active: true, runs: 124 },
  { name: "Probation confirmation", trigger: "Day 90 of joining", steps: ["Manager review","HR letter"], active: true, runs: 28 },
  { name: "Hiring requisition", trigger: "Requisition created", steps: ["Manager","HR","Finance"], active: false, runs: 14 },
];

export default function Workflows() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Workflows & automation" description="Approval chains and event-triggered automations." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> New workflow</Button>
      } />
      <div className="space-y-3">
        {workflows.map(w => (
          <div key={w.name} className="card-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><Workflow className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="font-semibold">{w.name}</span>{w.active ? <Badge className="bg-success/10 text-success border-0">Active</Badge> : <Badge variant="outline">Paused</Badge>}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><Zap className="h-3 w-3" /> Trigger: {w.trigger} · {w.runs} runs</div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {w.steps.map((s,i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium">{s}</div>
                        {i < w.steps.length-1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}