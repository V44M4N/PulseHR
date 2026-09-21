import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Target, Users, Plus } from "lucide-react";

export default function Performance() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Performance & appraisals" description="Manage cycles, goals and 360° feedback." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> New cycle</Button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active cycle" value="H1 2026" icon={Target} accent="primary" />
        <StatCard label="Goals set" value="92%" delta="of eligible" trend="up" accent="accent" />
        <StatCard label="Self-reviews" value="68%" delta="14 days left" accent="warning" />
        <StatCard label="Avg rating" value="3.8" delta="Stable QoQ" icon={TrendingUp} accent="info" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-surface p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Cycle progress</h2>
          {[
            ["Goal setting", 100],
            ["Self review", 68],
            ["Manager review", 42],
            ["HR normalisation", 0],
            ["Acknowledgement", 0],
          ].map(([s,p]: any) => (
            <div key={s} className="mb-4">
              <div className="flex justify-between text-sm mb-1.5"><span className="font-medium">{s}</span><span className="text-muted-foreground">{p}%</span></div>
              <Progress value={p} className="h-1.5" />
            </div>
          ))}
        </div>

        <div className="card-surface p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Rating distribution</h2>
          {[
            ["Outstanding (5)", 12, "bg-accent"],
            ["Exceeds (4)", 38, "bg-success"],
            ["Meets (3)", 92, "bg-info"],
            ["Below (2)", 18, "bg-warning"],
            ["Improvement (1)", 4, "bg-destructive"],
          ].map(([l, c, color]: any) => (
            <div key={l} className="mb-3">
              <div className="flex justify-between text-sm mb-1"><span>{l}</span><span className="font-medium">{c}</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`${color} h-full`} style={{width: `${(c/92)*100}%`}} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Pending reviews</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {["Sara Khan","Vikram Rao","Ishaan Mehta","Neha Gupta"].map(n => (
            <div key={n} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-accent/10 text-accent">{n.split(" ").map(x=>x[0]).join("")}</AvatarFallback></Avatar>
                <div><div className="font-medium text-sm">{n}</div><div className="text-xs text-muted-foreground">Self-review pending</div></div>
              </div>
              <Button size="sm" variant="outline">Remind</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}