import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Download, Maximize2 } from "lucide-react";

const Node = ({ name, role, color = "accent" }: { name: string; role: string; color?: string }) => (
  <div className="card-surface p-3 min-w-[180px] text-center hover:shadow-elevated transition-shadow">
    <Avatar className={`h-10 w-10 mx-auto mb-2 bg-${color}/10`}><AvatarFallback className={`bg-${color}/10 text-${color}`}>{name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
    <div className="text-sm font-semibold">{name}</div>
    <div className="text-xs text-muted-foreground">{role}</div>
  </div>
);

const Connector = () => <div className="w-px h-6 bg-border mx-auto" />;

export default function OrgChart() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Organisation chart" description="Browse the company hierarchy." actions={
        <><Button variant="outline"><Maximize2 className="h-4 w-4" /> Fullscreen</Button><Button variant="outline"><Download className="h-4 w-4" /> Export</Button></>
      } />

      <div className="card-surface p-6 md:p-12 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="flex justify-center"><Node name="Anita Rao" role="Chief Executive Officer" color="primary" /></div>
          <Connector />
          <div className="grid grid-cols-4 gap-6 relative">
            <div className="absolute top-0 left-1/8 right-1/8 h-px bg-border" style={{left:"12.5%",right:"12.5%"}} />
            {[
              ["Priya Verma","Head of Design"],
              ["Rahul Iyer","VP Engineering"],
              ["Vikram Rao","VP Sales"],
              ["Neha Gupta","CFO"],
            ].map(([n,r]) => (
              <div key={n} className="flex flex-col items-center"><Connector /><Node name={n} role={r} /></div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-6 mt-6">
            {[
              [["Aarav Sharma","Sr. Designer"],["Ria Sen","Designer"]],
              [["Sara Khan","Eng Manager"],["Manav Joshi","Sr. Engineer"]],
              [["Akash B.","AE"],["Tara Pillai","SDR"]],
              [["Divya Das","Controller"],["Karan G.","Analyst"]],
            ].map((col, i) => (
              <div key={i} className="flex flex-col gap-3">
                {col.map(([n,r]) => <Node key={n} name={n} role={r} />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}