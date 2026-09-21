import {
  LayoutDashboard, User, CalendarDays, Clock, Receipt, FolderLock, Wallet,
  LifeBuoy, Megaphone, Network, Users, Briefcase, UserPlus, UserMinus,
  TrendingUp, GraduationCap, BarChart3, Shield, Building2, Workflow,
  ScrollText, Plug, Settings, Sparkles
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRole } from "@/context/RoleContext";
import { Role } from "@/lib/roles";

type NavItem = { title: string; url: string; icon: any; roles: Role[] };

const selfService: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["employee","manager","hr","admin"] },
  { title: "My Profile", url: "/profile", icon: User, roles: ["employee","manager","hr","admin"] },
  { title: "Leave", url: "/leave", icon: CalendarDays, roles: ["employee","manager","hr","admin"] },
  { title: "Attendance", url: "/attendance", icon: Clock, roles: ["employee","manager","hr","admin"] },
  { title: "Payslips", url: "/payslips", icon: Wallet, roles: ["employee","manager","hr","admin"] },
  { title: "Documents", url: "/documents", icon: FolderLock, roles: ["employee","manager","hr","admin"] },
  { title: "Expenses", url: "/expenses", icon: Receipt, roles: ["employee","manager","hr","admin"] },
  { title: "Helpdesk", url: "/helpdesk", icon: LifeBuoy, roles: ["employee","manager","hr","admin"] },
];

const company: NavItem[] = [
  { title: "Company Feed", url: "/feed", icon: Megaphone, roles: ["employee","manager","hr","admin"] },
  { title: "Org Chart", url: "/org-chart", icon: Network, roles: ["employee","manager","hr","admin"] },
  { title: "Directory", url: "/directory", icon: Users, roles: ["employee","manager","hr","admin"] },
];

const hrOps: NavItem[] = [
  { title: "Employees", url: "/hr/employees", icon: Users, roles: ["hr","admin"] },
  { title: "Recruitment", url: "/hr/recruitment", icon: Briefcase, roles: ["hr","admin"] },
  { title: "Onboarding", url: "/hr/onboarding", icon: UserPlus, roles: ["hr","admin"] },
  { title: "Offboarding", url: "/hr/offboarding", icon: UserMinus, roles: ["hr","admin"] },
  { title: "Payroll", url: "/hr/payroll", icon: Wallet, roles: ["hr","admin"] },
  { title: "Performance", url: "/hr/performance", icon: TrendingUp, roles: ["hr","admin"] },
  { title: "Training", url: "/hr/training", icon: GraduationCap, roles: ["hr","admin"] },
  { title: "Analytics", url: "/hr/analytics", icon: BarChart3, roles: ["hr","admin"] },
];

const adminNav: NavItem[] = [
  { title: "Roles & Access", url: "/admin/roles", icon: Shield, roles: ["admin"] },
  { title: "Org Structure", url: "/admin/org", icon: Building2, roles: ["admin"] },
  { title: "Workflows", url: "/admin/workflows", icon: Workflow, roles: ["admin"] },
  { title: "Audit Logs", url: "/admin/audit", icon: ScrollText, roles: ["admin"] },
  { title: "Integrations", url: "/admin/integrations", icon: Plug, roles: ["admin"] },
  { title: "Settings", url: "/admin/settings", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { role } = useRole();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const filter = (items: NavItem[]) => items.filter(i => i.roles.includes(role));

  const renderGroup = (label: string, items: NavItem[]) => {
    const visible = filter(items);
    if (!visible.length) return null;
    return (
      <SidebarGroup>
        {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 font-medium uppercase tracking-wider text-[10px]">{label}</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {visible.map(item => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink
                    to={item.url}
                    end={item.url === "/"}
                    className="flex items-center gap-3 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-accent flex items-center justify-center shrink-0 shadow-glow">
            <Sparkles className="h-4 w-4 text-accent-foreground" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-display font-bold text-sidebar-foreground text-base leading-none">Pulse HR</div>
              <div className="text-[10px] text-sidebar-foreground/50 mt-1">People operations OS</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3 scrollbar-thin">
        {renderGroup("Personal", selfService)}
        {renderGroup("Company", company)}
        {renderGroup("HR Operations", hrOps)}
        {renderGroup("Administration", adminNav)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="rounded-lg bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/70">
            <div className="font-medium text-sidebar-foreground mb-1">Need help?</div>
            Reach out to People Ops anytime.
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}