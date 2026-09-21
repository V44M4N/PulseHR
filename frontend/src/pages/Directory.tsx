import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { useModuleQuery } from "@/hooks/useModuleQuery";
import { QueryState } from "@/components/QueryState";

export default function Directory() {
  const [search, setSearch] = useState('');
  const query = useModuleQuery<any>('directory'.split(), `/directory?search=${encodeURIComponent(search)}&page=1&limit=50`);
  const employees = (query.data?.data?.employees ?? []).map((employee: any) => ({ ...employee, id: employee.employeeCode, name: `${employee.firstName} ${employee.lastName}`, role: employee.designation, dept: employee.department?.name ?? '—', location: employee.location?.name ?? '—' }));
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Employee directory" description="Find and connect with anyone in the company." />
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name, role, department…" className="pl-9" /></div>
        <Button variant="outline">All departments</Button>
        <Button variant="outline">All locations</Button>
      </div>

      <QueryState loading={query.isPending} error={query.error} retry={query.refetch} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map(e => (
          <div key={e.id} className="card-surface p-5 hover:shadow-elevated hover:-translate-y-0.5 transition-all">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-accent/20"><AvatarFallback className="bg-gradient-accent text-accent-foreground">{e.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{e.name}</div>
                <div className="text-xs text-muted-foreground truncate">{e.role}</div>
                <Badge variant="outline" className="mt-2 text-[10px]">{e.dept}</Badge>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 truncate"><Mail className="h-3 w-3" /> {e.email}</div>
              <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {e.location}</div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1"><Mail className="h-3.5 w-3.5" /> Email</Button>
              <Button size="sm" variant="outline" className="flex-1"><Phone className="h-3.5 w-3.5" /> Call</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
