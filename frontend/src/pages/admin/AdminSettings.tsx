import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useModuleQuery } from "@/hooks/useModuleQuery";
import { QueryState } from "@/components/QueryState";

export default function AdminSettings() {
  const query = useModuleQuery<any>(['admin', 'settings'], '/admin/settings');
  const settings = query.data?.data ?? {};
  const mfaEnabled = Boolean(settings.auth?.mfa?.enabled);
  const ssoEnabled = Boolean(settings.auth?.sso?.enabled);
  const ipEnabled = Boolean(settings.auth?.ipAllowlist?.enabled ?? settings.auth?.ip_allowlist?.enabled);
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="System settings" description="Authentication, localisation, data privacy and notifications." />
      <QueryState loading={query.isPending} error={query.error} retry={query.refetch} />
      <Tabs defaultValue="auth">
        <TabsList><TabsTrigger value="auth">Auth & Security</TabsTrigger><TabsTrigger value="locale">Localisation</TabsTrigger><TabsTrigger value="privacy">Data Privacy</TabsTrigger><TabsTrigger value="notif">Notifications</TabsTrigger></TabsList>
        <TabsContent value="auth" className="card-surface p-6 mt-4 space-y-4">
          {[["Single Sign-On (SSO)","SAML 2.0 / OAuth via Google, Okta",ssoEnabled],["Multi-factor authentication","Mandatory for admin roles",mfaEnabled],["IP allowlisting","Restrict admin access to office IPs",ipEnabled],["Session timeout (30m)","Auto sign-out after inactivity",Boolean(settings.auth?.session)],["Password rotation (90d)","Enforce periodic password change",false]].map(([t,d,v]: any) => (
            <div key={t} className="flex items-start justify-between p-4 rounded-lg border border-border">
              <div><div className="font-medium">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
              <Switch defaultChecked={v} />
            </div>
          ))}
        </TabsContent>
        <TabsContent value="locale" className="card-surface p-6 mt-4 grid md:grid-cols-2 gap-4">
          <div><Label>Default language</Label><Input defaultValue="English (India)" className="mt-1" /></div>
          <div><Label>Timezone</Label><Input defaultValue="Asia/Kolkata (IST)" className="mt-1" /></div>
          <div><Label>Date format</Label><Input defaultValue="DD MMM YYYY" className="mt-1" /></div>
          <div><Label>Currency</Label><Input defaultValue="INR — ₹" className="mt-1" /></div>
          <div><Label>First day of week</Label><Input defaultValue="Monday" className="mt-1" /></div>
          <div><Label>Number format</Label><Input defaultValue="1,00,000 (Indian)" className="mt-1" /></div>
        </TabsContent>
        <TabsContent value="privacy" className="card-surface p-6 mt-4 space-y-4">
          {[["GDPR / DPDP compliance mode","Enable consent and right-to-erasure flows",true],["PII masking","Mask Aadhaar, PAN and bank details in lists",true],["Data residency — India","Pin storage to ap-south-1",true],["Retention — 7 years","Statutory minimum for HR records",true]].map(([t,d,v]: any) => (
            <div key={t} className="flex items-start justify-between p-4 rounded-lg border border-border">
              <div><div className="font-medium">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
              <Switch defaultChecked={v} />
            </div>
          ))}
        </TabsContent>
        <TabsContent value="notif" className="card-surface p-6 mt-4 space-y-4">
          {[["Email notifications","Daily digest at 9 AM",true],["SMS alerts","Critical events only",false],["Push notifications","Mobile app",true],["In-app notifications","Always on",true]].map(([t,d,v]: any) => (
            <div key={t} className="flex items-start justify-between p-4 rounded-lg border border-border">
              <div><div className="font-medium">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
              <Switch defaultChecked={v} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
      <div className="flex justify-end gap-2"><Button variant="outline">Cancel</Button><Button className="bg-accent text-accent-foreground">Save settings</Button></div>
    </div>
  );
}
