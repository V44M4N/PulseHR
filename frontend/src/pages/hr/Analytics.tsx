import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingUp, DollarSign, Clock } from "lucide-react";
import { headcountTrend, attritionByDept } from "@/lib/mock-data";

export default function Analytics() {
  const max = Math.max(...headcountTrend.map(h=>h.value));
  const maxAttr = Math.max(...attritionByDept.map(a=>a.rate));
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="People analytics" description="Headcount, attrition, cost and productivity insights." actions={
        <Button variant="outline"><Download className="h-4 w-4" /> Export report</Button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Headcount" value="489" delta="+18 MoM" trend="up" icon={Users} accent="primary" />
        <StatCard label="Attrition rate" value="8.4%" delta="-1.2 pts" trend="up" icon={TrendingUp} accent="accent" />
        <StatCard label="Cost per hire" value="₹1.84L" delta="-12% YoY" trend="up" icon={DollarSign} accent="info" />
        <StatCard label="Time-to-fill" value="32d" delta="-4d" trend="up" icon={Clock} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-surface p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Headcount trend</h2>
          <div className="flex items-end gap-3 h-56">
            {headcountTrend.map(h => (
              <div key={h.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-semibold">{h.value}</div>
                <div className="w-full rounded-t-lg bg-gradient-accent transition-all" style={{height: `${(h.value/max)*100}%`}} />
                <div className="text-xs text-muted-foreground">{h.month}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-surface p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Attrition by department</h2>
          <div className="space-y-3">
            {attritionByDept.map(d => (
              <div key={d.dept}>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">{d.dept}</span><span>{d.rate}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-accent to-info" style={{width: `${(d.rate/maxAttr)*100}%`}} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {[
          { title: "Diversity ratio", val: "42%", sub: "Women in workforce", color: "accent" },
          { title: "Engagement score", val: "8.4", sub: "Out of 10 (Q1 pulse)", color: "info" },
          { title: "Predictive attrition risk", val: "23", sub: "Employees flagged high-risk", color: "warning" },
        ].map(c => (
          <div key={c.title} className="card-surface p-6">
            <div className="text-sm text-muted-foreground">{c.title}</div>
            <div className={`text-4xl font-display font-bold mt-2 text-${c.color}`}>{c.val}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}