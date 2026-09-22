import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Briefcase, Users, Clock, TrendingUp, Star } from "lucide-react";
import { useModuleQuery } from "@/hooks/useModuleQuery";
import { QueryState } from "@/components/QueryState";

const stages = ["Applied","Screening","Interview","Offer","Hired"];

export default function Recruitment() {
  const candidateQuery = useModuleQuery<any>(['recruitment', 'candidates'], '/hr/recruitment/candidates?page=1&limit=100');
  const jobsQuery = useModuleQuery<any>(['recruitment', 'jobs'], '/hr/recruitment/jobs?page=1&limit=100');
  const candidates = candidateQuery.data?.data?.candidates ?? [];
  const jobs = jobsQuery.data?.data?.jobs ?? [];
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader title="Recruitment" description="Manage requisitions, candidates and interview pipelines." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> New requisition</Button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open roles" value="14" icon={Briefcase} accent="primary" />
        <StatCard label="Active candidates" value="186" delta="+24 this week" trend="up" icon={Users} accent="accent" />
        <StatCard label="Avg time-to-hire" value="32d" delta="-4d MoM" trend="up" icon={Clock} accent="info" />
        <StatCard label="Offer accept rate" value="84%" delta="Above target" trend="up" icon={TrendingUp} accent="warning" />
      </div>

      <div className="card-surface p-6 overflow-x-auto">
        <QueryState loading={candidateQuery.isPending || jobsQuery.isPending} error={candidateQuery.error || jobsQuery.error} retry={() => { void candidateQuery.refetch(); void jobsQuery.refetch(); }} />
        <h2 className="font-display font-semibold text-lg mb-4">Pipeline</h2>
        <div className="grid grid-cols-5 gap-3 min-w-[900px]">
          {stages.map(s => {
            const stageCands = candidates.filter((c: any) => String(c.stage).toLowerCase() === s.toLowerCase());
            return (
              <div key={s} className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">{s}</span>
                  <Badge className="bg-card border border-border text-foreground">{stageCands.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageCands.map((c: any) => (
                    <div key={c.id} className="card-surface p-3 cursor-pointer hover:shadow-elevated transition-shadow">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="bg-accent/10 text-accent text-[10px]">{(c.name || 'C').split(" ").map((n: string)=>n[0]).join("")}</AvatarFallback></Avatar>
                        <div className="text-xs flex-1 min-w-0"><div className="font-medium truncate">{c.name}</div><div className="text-muted-foreground truncate">{c.job?.title || c.role}</div></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] py-0">{c.source || 'Direct'}</Badge>
                        <div className="flex items-center gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} className={`h-2.5 w-2.5 ${i<(c.rating ?? 0)?"text-warning fill-warning":"text-muted"}`} />)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Open requisitions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((r: any) => (
            <div key={r.title} className="p-4 rounded-xl border border-border hover:border-accent/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.department?.name || r.dept || '—'} · {r.location?.name || r.loc || '—'}</div>
                </div>
                <Badge className="bg-accent/10 text-accent border-0">{r._count?.candidates ?? r.apps ?? 0} apps</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
