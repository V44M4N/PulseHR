import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Plus, Award } from "lucide-react";

const courses = [
  { name: "POSH compliance training", category: "Mandatory", enrolled: 489, completed: 412, due: "May 15" },
  { name: "Leadership essentials", category: "Optional", enrolled: 64, completed: 28, due: "Ongoing" },
  { name: "Data privacy & GDPR", category: "Mandatory", enrolled: 489, completed: 478, due: "Apr 30" },
  { name: "Design systems masterclass", category: "Optional", enrolled: 22, completed: 9, due: "Ongoing" },
  { name: "Cloud security fundamentals", category: "Optional", enrolled: 41, completed: 15, due: "Ongoing" },
];

export default function Training() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Training & learning" description="Manage courses, assignments and certifications." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> Add course</Button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active courses" value={courses.length} icon={GraduationCap} accent="primary" />
        <StatCard label="Completion rate" value="78%" delta="+6% QoQ" trend="up" accent="accent" />
        <StatCard label="Total hours" value="3,420" delta="This quarter" accent="info" />
        <StatCard label="Certifications" value="142" icon={Award} accent="warning" />
      </div>
      <div className="card-surface p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Courses</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map(c => {
            const pct = Math.round((c.completed/c.enrolled)*100);
            return (
              <div key={c.name} className="p-4 rounded-xl border border-border hover:border-accent/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="flex items-center gap-2 mt-1"><Badge variant="outline" className={c.category==="Mandatory"?"border-warning/40 text-warning bg-warning/5":"border-info/40 text-info bg-info/5"}>{c.category}</Badge><span className="text-xs text-muted-foreground">Due {c.due}</span></div>
                  </div>
                  <span className="text-2xl font-display font-bold text-accent">{pct}%</span>
                </div>
                <Progress value={pct} className="mt-3 h-1.5" />
                <div className="text-xs text-muted-foreground mt-2">{c.completed} of {c.enrolled} completed</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}