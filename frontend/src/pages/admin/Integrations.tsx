import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plug } from "lucide-react";

const integrations = [
  { name: "Slack", desc: "Notifications & approvals", connected: true },
  { name: "Google Workspace", desc: "SSO & calendar", connected: true },
  { name: "Microsoft Teams", desc: "Notifications & meetings", connected: false },
  { name: "Zoom", desc: "Interview scheduling", connected: true },
  { name: "Tally", desc: "Accounting export", connected: true },
  { name: "QuickBooks", desc: "Accounting export", connected: false },
  { name: "AuthBridge", desc: "Background verification", connected: true },
  { name: "LinkedIn Recruiter", desc: "Job postings", connected: false },
  { name: "Biometric devices", desc: "Attendance sync", connected: true },
];

export default function Integrations() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Integrations" description="Connect Pulse HR with the rest of your stack." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(i => (
          <div key={i.name} className="card-surface p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center"><Plug className="h-5 w-5 text-accent-foreground" /></div>
                <div><div className="font-semibold">{i.name}</div><div className="text-xs text-muted-foreground">{i.desc}</div></div>
              </div>
              {i.connected && <Badge className="bg-success/10 text-success border-0">Connected</Badge>}
            </div>
            <Button variant={i.connected ? "outline" : "default"} className={`w-full mt-4 ${!i.connected && "bg-accent text-accent-foreground hover:bg-accent/90"}`}>{i.connected ? "Manage" : "Connect"}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}