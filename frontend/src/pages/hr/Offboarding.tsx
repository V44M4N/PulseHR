import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const exits = [
  { name: "Ananya Nair", role: "Content Strategist", lwd: "May 18", progress: 60, reason: "Career change" },
  { name: "Manav Joshi", role: "Sr. Engineer", lwd: "Jun 02", progress: 30, reason: "Higher studies" },
  { name: "Tara Pillai", role: "SDR", lwd: "May 25", progress: 80, reason: "Personal" },
];

export default function Offboarding() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Offboarding" description="Manage resignations, clearances and final settlement." actions={
        <Button variant="outline">Initiate exit workflow</Button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active exits" value={exits.length} accent="warning" />
        <StatCard label="Avg notice" value="42d" accent="info" />
        <StatCard label="Clearance pending" value="6" accent="primary" />
        <StatCard label="F&F processed" value="12" delta="This quarter" accent="accent" />
      </div>
      <div className="card-surface p-6">
        <h2 className="font-display font-semibold text-lg mb-4">In progress</h2>
        <div className="space-y-3">
          {exits.map(e => (
            <div key={e.name} className="p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-warning/10 text-warning">{e.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.role} · LWD {e.lwd} · {e.reason}</div>
                </div>
                <Badge className="bg-warning/10 text-warning border-0">{e.progress}% cleared</Badge>
              </div>
              <Progress value={e.progress} className="mt-3 h-1.5" />
              <div className="flex flex-wrap gap-2 mt-3">
                {["Asset return","Knowledge transfer","Manager NOC","Finance NOC","IT revoke","Exit interview"].map((s,i)=>(
                  <Badge key={s} variant="outline" className={i < Math.floor(e.progress/100*6) ? "border-success/40 text-success bg-success/5" : "border-border text-muted-foreground"}>{s}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}