import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, UserPlus } from "lucide-react";
import { useModuleQuery } from "@/hooks/useModuleQuery";
import { QueryState } from "@/components/QueryState";

const fallbackHires = [
  { name: "Tanvi Bhat", role: "UX Researcher", start: "May 2", progress: 75 },
  { name: "Rohit Kapoor", role: "Backend Engineer", start: "May 5", progress: 40 },
  { name: "Aisha Reddy", role: "Designer", start: "Apr 25", progress: 92 },
  { name: "Karan Singh", role: "Sr. Frontend Engineer", start: "May 12", progress: 18 },
];

const fallbackTasks = [
  { task: "Send welcome email", done: true, owner: "HR" },
  { task: "Provision laptop & accessories", done: true, owner: "IT" },
  { task: "Create email and Slack accounts", done: true, owner: "IT" },
  { task: "Collect signed offer letter", done: true, owner: "HR" },
  { task: "Background verification", done: false, owner: "HR" },
  { task: "Day-1 orientation", done: false, owner: "HR" },
  { task: "Assign buddy", done: false, owner: "Manager" },
  { task: "Tooling access (Figma, GitHub)", done: false, owner: "IT" },
];

export default function Onboarding() {
  const query = useModuleQuery<any>(['onboarding'], '/hr/onboarding?page=1&limit=100');
  const newHires = query.data?.data?.data ?? fallbackHires;
  const firstEmployee = newHires[0];
  const tasksQuery = useModuleQuery<any>(['onboarding', firstEmployee?.id], firstEmployee?.id ? `/hr/onboarding/${firstEmployee.id}/tasks` : '/hr/onboarding/none', Boolean(firstEmployee?.id));
  const tasks = tasksQuery.data?.data?.tasks ?? fallbackTasks;
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Onboarding" description="Track new hires and pre-boarding checklists." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><UserPlus className="h-4 w-4" /> Start onboarding</Button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="In progress" value={newHires.length} accent="primary" />
        <StatCard label="Joining this month" value="9" accent="accent" />
        <StatCard label="Pre-boarding" value="6" accent="info" />
        <StatCard label="Completion rate" value="84%" trend="up" delta="On track" accent="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <QueryState loading={query.isPending || tasksQuery.isPending} error={query.error || tasksQuery.error} retry={() => { void query.refetch(); void tasksQuery.refetch(); }} />
        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="font-display font-semibold text-lg mb-4">Active onboardings</h2>
          <div className="space-y-3">
            {newHires.map((h: any) => (
              <div key={h.id || h.name} className="p-4 rounded-xl border border-border hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-gradient-accent text-accent-foreground">{h.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.designation || h.role || 'New hire'} · Joins {h.start || '—'}</div>
                  </div>
                  <Badge className="bg-accent/10 text-accent border-0">{typeof h.progress === 'object' ? h.progress.percent : h.progress}%</Badge>
                </div>
                <Progress value={typeof h.progress === 'object' ? h.progress.percent : h.progress} className="mt-3 h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="font-display font-semibold text-lg mb-1">Day-1 checklist</h2>
          <p className="text-xs text-muted-foreground mb-4">Tanvi Bhat — UX Researcher</p>
          <div className="space-y-2">
            {tasks.map((t: any) => (
              <div key={t.task} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40">
                {(t.done || t.isCompleted) ? <CheckCircle2 className="h-4 w-4 text-success mt-0.5" /> : <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />}
                <div className="flex-1">
                  <div className={`text-sm ${(t.done || t.isCompleted)?"line-through text-muted-foreground":""}`}>{t.task || t.title}</div>
                  <div className="text-[10px] text-muted-foreground">{t.owner}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
