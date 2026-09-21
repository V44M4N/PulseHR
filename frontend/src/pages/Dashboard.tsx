import { useLeaveBalances, useLeaveRequests, useTeamLeave, balanceView, requestView } from "@/hooks/useLeave";
import { QueryState } from "@/components/QueryState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, Clock, TrendingUp, Users, Wallet, Plus, ArrowUpRight, Cake, PartyPopper } from "lucide-react";
import { announcements, attendanceWeek } from "@/lib/mock-data";
import { useRole } from "@/context/RoleContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { role, user } = useRole();
  const teamQuery = useTeamLeave();
  const balancesQuery = useLeaveBalances();
  const requestsQuery = useLeaveRequests();
  const leaveBalances = (balancesQuery.data?.data ?? []).map(balanceView);
  const recentLeaves = (requestsQuery.data?.data ?? []).map(requestView);
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-6 md:p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-primary-foreground/70 font-medium">{greeting}, {user?.name.split(" ")[0]} 👋</div>
            <h1 className="text-2xl md:text-4xl font-display font-bold mt-1 text-balance">Welcome back to Pulse HR</h1>
            <p className="text-primary-foreground/70 mt-2 text-sm max-w-xl">You have <span className="text-accent font-medium">3 pending approvals</span> and <span className="text-accent font-medium">{requestsQuery.data?.meta?.total ?? "…"} leave requests</span> in your history.</p>
          </div>
          <div className="flex gap-2">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow">
              <Clock className="h-4 w-4" /> Clock in
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"><Link to="/leave"><Plus className="h-4 w-4" /> Apply leave</Link></Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Leave balance" value={balancesQuery.isPending ? "…" : balancesQuery.error ? "—" : leaveBalances.reduce((sum, item) => sum + item.balance, 0)} icon={Calendar} accent="accent" />
        <StatCard label="Hours this week" value="46.7" delta="On track" trend="up" icon={Clock} accent="info" />
        <StatCard label="Pending approvals" value={role === "manager" || role === "hr" ? 7 : 1} delta="1 high priority" trend="down" icon={CheckCircle2} accent="warning" />
        <StatCard label="Net pay (Mar)" value="₹1.51L" delta="Paid on 31 Mar" trend="up" icon={Wallet} accent="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave balances */}
        <div className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-lg">Leave balances</h2>
              <p className="text-xs text-muted-foreground">Available out of total entitlement</p>
            </div>
            <Link to="/leave"><Button variant="ghost" size="sm">View all <ArrowUpRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <QueryState loading={balancesQuery.isPending} error={balancesQuery.error} retry={balancesQuery.refetch} />
            {leaveBalances.map(lb => (
              <div key={lb.type} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-foreground">{lb.type}</span>
                  <span className="text-xs text-muted-foreground"><span className="text-foreground font-semibold text-base">{lb.balance}</span> / {lb.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(lb.total ? lb.balance/lb.total : 0)*100}%`, background: lb.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today */}
        <div className="card-surface p-6">
          <h2 className="font-display font-semibold text-lg mb-1">Today</h2>
          <p className="text-xs text-muted-foreground mb-4">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent-soft border border-accent/20">
              <PartyPopper className="h-4 w-4 text-accent mt-0.5" />
              <div>
                <div className="text-sm font-medium">3 work anniversaries</div>
                <div className="text-xs text-muted-foreground">Wish your colleagues</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <Cake className="h-4 w-4 text-warning mt-0.5" />
              <div>
                <div className="text-sm font-medium">2 birthdays today</div>
                <div className="text-xs text-muted-foreground">Sara K., Vikram R.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <Users className="h-4 w-4 text-info mt-0.5" />
              <div>
                <div className="text-sm font-medium">{teamQuery.data?.data.length ?? "—"} team leave requests this month</div>
                <div className="text-xs text-muted-foreground">{role === "employee" ? "Available to managers and HR" : "Approved requests"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent requests */}
        <div className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg">Recent leave requests</h2>
            <Link to="/leave"><Button variant="ghost" size="sm">All <ArrowUpRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="divide-y divide-border">
            <QueryState loading={requestsQuery.isPending} error={requestsQuery.error} retry={requestsQuery.refetch} />
            {recentLeaves.map(l => (
              <div key={l.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{l.type} — {l.days} day{l.days>1?"s":""}</div>
                  <div className="text-xs text-muted-foreground">{l.from} → {l.to} · {l.reason}</div>
                </div>
                <Badge variant="outline" className={
                  l.status === "Approved" ? "border-success/40 text-success bg-success/5" :
                  l.status === "Pending" ? "border-warning/40 text-warning bg-warning/5" :
                  "border-destructive/40 text-destructive bg-destructive/5"
                }>{l.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">From the company</h2>
            <Link to="/feed" className="text-xs text-accent font-medium">Open feed</Link>
          </div>
          <div className="space-y-4">
            {announcements.slice(0,3).map(a => (
              <div key={a.id} className="border-l-2 border-accent pl-3">
                <div className="text-xs text-muted-foreground">{a.author} · {a.time}</div>
                <div className="text-sm font-medium mt-0.5">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance week strip */}
      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-semibold text-lg">This week's attendance</h2>
            <p className="text-xs text-muted-foreground">Target 45h · Logged 46.7h</p>
          </div>
          <Link to="/attendance"><Button variant="outline" size="sm">View detail</Button></Link>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {attendanceWeek.map(d => {
            const pct = Math.min((d.hours/9)*100, 100);
            return (
              <div key={d.day} className="flex flex-col items-center gap-2">
                <div className="text-xs font-medium text-muted-foreground">{d.day}</div>
                <div className="w-full h-24 rounded-lg bg-muted relative overflow-hidden">
                  {d.hours > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-accent rounded-b-lg" style={{ height: `${pct}%` }} />
                  )}
                </div>
                <div className="text-xs font-semibold">{d.hours > 0 ? `${d.hours}h` : "—"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
