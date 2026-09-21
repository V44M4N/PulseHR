import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRole } from "@/context/RoleContext";
import { Mail, Phone, MapPin, Briefcase, Calendar, Building2, Edit3, Camera } from "lucide-react";

export default function Profile() {
  const { user } = useRole();
  const currentUser = { name: user?.name ?? '', email: user?.email ?? '', designation: user?.designation ?? 'Employee', department: '—', manager: '—', employeeId: user?.employeeId ?? '', location: '—', avatar: user?.avatar ?? '' };
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="My profile" description="Manage your personal and employment information." actions={
        <Button variant="outline"><Edit3 className="h-4 w-4" /> Request changes</Button>
      } />

      {/* Identity card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary text-primary-foreground p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-white/20">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-glow">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-display font-bold">{currentUser.name}</h2>
            <p className="text-primary-foreground/80">{currentUser.designation} · {currentUser.department}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {currentUser.email}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {currentUser.location}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {currentUser.employeeId}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3 text-sm">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur"><div className="text-primary-foreground/60 text-xs">Reports to</div><div className="font-medium">{currentUser.manager}</div></div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur"><div className="text-primary-foreground/60 text-xs">Joined</div><div className="font-medium">14 Mar 2022</div></div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="bg-muted">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="bank">Bank & Tax</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>
        <TabsContent value="personal" className="mt-4">
          <div className="card-surface p-6 grid md:grid-cols-2 gap-5">
            {[
              ["Full name", currentUser.name],
              ["Email", currentUser.email],
              ["Phone", "+91 98765 43210"],
              ["Date of birth", "12 Aug 1994"],
              ["Gender", "Male"],
              ["Marital status", "Married"],
              ["Nationality", "Indian"],
              ["Blood group", "O+"],
            ].map(([k,v]) => (
              <div key={k}>
                <Label className="text-xs text-muted-foreground">{k}</Label>
                <Input defaultValue={v} className="mt-1 bg-muted/40" />
              </div>
            ))}
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Current address</Label>
              <Textarea defaultValue="42, Indiranagar 4th main, Bengaluru, Karnataka 560038" className="mt-1 bg-muted/40" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Save changes</Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="employment" className="mt-4">
          <div className="card-surface p-6 grid md:grid-cols-3 gap-5 text-sm">
            {[
              ["Employee ID", currentUser.employeeId, Briefcase],
              ["Designation", currentUser.designation, Building2],
              ["Department", currentUser.department, Building2],
              ["Reporting manager", currentUser.manager, Briefcase],
              ["Date of joining", "14 Mar 2022", Calendar],
              ["Employment type", "Full-time", Briefcase],
              ["Work location", currentUser.location, MapPin],
              ["Grade", "L4 — Senior", Briefcase],
              ["Probation status", "Confirmed", Briefcase],
            ].map(([k,v, Icon]: any) => (
              <div key={k} className="flex items-start gap-3 p-4 rounded-lg bg-muted/40">
                <Icon className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="font-medium">{v}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="bank" className="mt-4">
          <div className="card-surface p-6 space-y-4">
            <div className="rounded-lg bg-warning/10 border border-warning/30 text-warning-foreground p-3 text-sm">⚠️ Changes to bank details require HR approval before being effective.</div>
            <div className="grid md:grid-cols-2 gap-5">
              <div><Label>Account holder</Label><Input defaultValue="Aarav Sharma" className="mt-1" /></div>
              <div><Label>Bank name</Label><Input defaultValue="HDFC Bank" className="mt-1" /></div>
              <div><Label>Account number</Label><Input defaultValue="•••• •••• 4421" className="mt-1" /></div>
              <div><Label>IFSC</Label><Input defaultValue="HDFC0000421" className="mt-1" /></div>
              <div><Label>PAN</Label><Input defaultValue="ABCDE1234F" className="mt-1" /></div>
              <div><Label>Tax regime</Label><Input defaultValue="New regime" className="mt-1" /></div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="emergency" className="mt-4">
          <div className="card-surface p-6 grid md:grid-cols-2 gap-5">
            <div><Label>Contact name</Label><Input defaultValue="Riya Sharma" className="mt-1" /></div>
            <div><Label>Relationship</Label><Input defaultValue="Spouse" className="mt-1" /></div>
            <div><Label>Phone</Label><Input defaultValue="+91 98123 65478" className="mt-1" /></div>
            <div><Label>Email</Label><Input defaultValue="riya@example.com" className="mt-1" /></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
