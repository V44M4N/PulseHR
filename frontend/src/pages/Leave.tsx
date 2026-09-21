import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Filter, Download } from "lucide-react";
import { leaveBalances, recentLeaves } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Leave() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Leave management" description="Apply, track and manage your time off." actions={
        <>
          <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> Apply leave</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply for leave</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Leave type</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {leaveBalances.map(l => <SelectItem key={l.type} value={l.type}>{l.type} ({l.balance} left)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>From</Label><Input type="date" className="mt-1" /></div>
                  <div><Label>To</Label><Input type="date" className="mt-1" /></div>
                </div>
                <div><Label>Reason</Label><Textarea placeholder="Brief description" className="mt-1" /></div>
              </div>
              <DialogFooter><Button variant="outline">Cancel</Button><Button className="bg-accent text-accent-foreground">Submit</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveBalances.map(lb => (
          <div key={lb.type} className="card-surface p-5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{lb.type}</div>
            <div className="flex items-baseline gap-1 mt-2"><span className="text-3xl font-display font-bold">{lb.balance}</span><span className="text-sm text-muted-foreground">/ {lb.total}</span></div>
            <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(lb.balance/lb.total)*100}%`, background: lb.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Recent requests</h2>
            <Button variant="ghost" size="sm"><Filter className="h-4 w-4" /> Filter</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr><th className="text-left py-3 font-medium">ID</th><th className="text-left font-medium">Type</th><th className="text-left font-medium">Dates</th><th className="text-left font-medium">Days</th><th className="text-left font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentLeaves.map(l => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="py-3 font-mono text-xs text-muted-foreground">{l.id}</td>
                    <td className="font-medium">{l.type}</td>
                    <td className="text-muted-foreground text-xs">{l.from} → {l.to}</td>
                    <td>{l.days}</td>
                    <td><Badge variant="outline" className={
                      l.status === "Approved" ? "border-success/40 text-success bg-success/5" :
                      l.status === "Pending" ? "border-warning/40 text-warning bg-warning/5" :
                      "border-destructive/40 text-destructive bg-destructive/5"
                    }>{l.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Team on leave</h2>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {[
              { name: "Priya Verma", from: "Apr 22", to: "Apr 24", type: "EL" },
              { name: "Sara Khan", from: "Apr 23", to: "Apr 23", type: "SL" },
              { name: "Rahul Iyer", from: "Apr 25", to: "Apr 30", type: "EL" },
            ].map(p => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.from} – {p.to}</div>
                </div>
                <Badge className="bg-accent/10 text-accent border-0">{p.type}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}