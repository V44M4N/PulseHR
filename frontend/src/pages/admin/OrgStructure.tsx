import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Building2, Plus, MapPin, Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";

export default function OrgStructure() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Organisation structure" description="Entities, departments, locations and grades." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> Add unit</Button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Legal entities" value="3" icon={Building2} accent="primary" />
        <StatCard label="Departments" value="14" accent="accent" />
        <StatCard label="Locations" value="6" icon={MapPin} accent="info" />
        <StatCard label="Grades / bands" value="L1–L8" icon={Users} accent="warning" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-surface p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Departments</h2>
          <div className="space-y-2">
            {[["Engineering",182],["Sales",92],["Design",46],["Marketing",38],["Finance",24],["People",18],["Operations",54],["Customer Success",35]].map(([d,c]: any) => (
              <div key={d} className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/40 border border-border">
                <span className="font-medium text-sm">{d}</span>
                <Badge>{c}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="card-surface p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Locations</h2>
          <div className="space-y-2">
            {[["Bengaluru — HQ",234],["Hyderabad",87],["Mumbai",58],["Delhi",42],["Remote (India)",54],["Singapore",14]].map(([l,c]: any) => (
              <div key={l} className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/40 border border-border">
                <span className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-accent" /> {l}</span>
                <Badge>{c}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs bg-accent/10 text-accent rounded-full px-2 py-0.5 font-medium">{children}</span>;
}