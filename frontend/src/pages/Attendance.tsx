import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, AlertCircle, Download } from "lucide-react";
import { attendanceWeek } from "@/lib/mock-data";

export default function Attendance() {
  const month = Array.from({length: 30}, (_, i) => ({
    day: i+1,
    status: [0,6].includes((i+1)%7) ? "weekend" : i < 18 ? "present" : i === 18 ? "leave" : "—",
  }));

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Attendance" description="Clock-in, regularizations and your monthly attendance." actions={
        <>
          <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
          <Button variant="outline"><AlertCircle className="h-4 w-4" /> Regularize</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Clock className="h-4 w-4" /> Clock in</Button>
        </>
      } />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card-surface p-6 lg:col-span-1 bg-gradient-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-50" />
          <div className="relative">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/60">Today's status</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold">09:18</span>
              <span className="text-xs text-primary-foreground/60">clocked in</span>
            </div>
            <div className="mt-1 text-sm text-primary-foreground/80 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Bengaluru office</div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur"><div className="text-xs text-primary-foreground/60">Hours</div><div className="font-semibold text-lg">5.4</div></div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur"><div className="text-xs text-primary-foreground/60">Break</div><div className="font-semibold text-lg">0.8</div></div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur"><div className="text-xs text-primary-foreground/60">Net</div><div className="font-semibold text-lg">4.6</div></div>
            </div>
            <Button className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow">Clock out</Button>
          </div>
        </div>

        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="font-display font-semibold text-lg mb-4">This week</h2>
          <div className="grid grid-cols-7 gap-2">
            {attendanceWeek.map(d => {
              const pct = Math.min((d.hours/9)*100, 100);
              return (
                <div key={d.day} className="flex flex-col items-center gap-2">
                  <div className="text-xs font-medium text-muted-foreground">{d.day}</div>
                  <div className="w-full h-32 rounded-lg bg-muted relative overflow-hidden">
                    {d.hours > 0 && <div className="absolute bottom-0 left-0 right-0 bg-gradient-accent" style={{ height: `${pct}%` }} />}
                  </div>
                  <div className="text-xs font-semibold">{d.hours > 0 ? `${d.hours}h` : "—"}</div>
                  <div className="text-[10px] text-muted-foreground">{d.in}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Present days" value="18" delta="This month" accent="accent" />
        <StatCard label="Leaves" value="2" delta="2 approved" accent="info" />
        <StatCard label="Late arrivals" value="3" delta="-2 vs last" trend="up" accent="warning" />
        <StatCard label="Avg hours/day" value="9.1" delta="Above target" trend="up" accent="primary" />
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display font-semibold text-lg mb-4">April 2026</h2>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground mb-2">
          {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} className="font-medium">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {month.map(d => (
            <div key={d.day} className={
              "aspect-square rounded-lg flex items-center justify-center text-sm font-medium border " +
              (d.status === "present" ? "bg-accent/10 border-accent/30 text-accent" :
               d.status === "leave" ? "bg-warning/10 border-warning/30 text-warning" :
               d.status === "weekend" ? "bg-muted/40 border-transparent text-muted-foreground" :
               "bg-muted/20 border-border text-muted-foreground")
            }>{d.day}</div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-5 text-xs">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-accent/30 border border-accent/50" /> Present</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-warning/30 border border-warning/50" /> On leave</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-muted" /> Weekend</span>
        </div>
      </div>
    </div>
  );
}