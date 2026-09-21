import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Check, X } from "lucide-react";

const roles = [
  { name: "Super Admin", users: 3, color: "destructive" },
  { name: "HR Manager", users: 8, color: "accent" },
  { name: "Payroll Admin", users: 2, color: "warning" },
  { name: "Manager", users: 64, color: "info" },
  { name: "Employee", users: 412, color: "primary" },
];
const modules = ["Employees","Payroll","Leave","Recruitment","Performance","Reports","Settings"];
const matrix: Record<string, boolean[]> = {
  "Super Admin": [true,true,true,true,true,true,true],
  "HR Manager": [true,true,true,true,true,true,false],
  "Payroll Admin": [false,true,false,false,false,true,false],
  "Manager": [false,false,true,false,true,false,false],
  "Employee": [false,false,false,false,false,false,false],
};

export default function Roles() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Roles & permissions" description="Granular access control across modules." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> New role</Button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {roles.map(r => (
          <div key={r.name} className="card-surface p-5">
            <Shield className={`h-5 w-5 text-${r.color}`} />
            <div className="font-semibold mt-2">{r.name}</div>
            <div className="text-xs text-muted-foreground">{r.users} users</div>
          </div>
        ))}
      </div>
      <div className="card-surface p-6 overflow-x-auto">
        <h2 className="font-display font-semibold text-lg mb-4">Permission matrix</h2>
        <table className="w-full text-sm min-w-[700px]">
          <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            <tr><th className="text-left py-3 font-medium">Role</th>{modules.map(m=><th key={m} className="text-center font-medium">{m}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map(r => (
              <tr key={r.name}>
                <td className="py-3 font-medium">{r.name}</td>
                {matrix[r.name].map((v,i)=><td key={i} className="text-center">{v ? <Check className="h-4 w-4 text-success inline" /> : <X className="h-4 w-4 text-muted-foreground inline" />}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}