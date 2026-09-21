import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/context/RoleContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Leave from "./pages/Leave";
import Attendance from "./pages/Attendance";
import Payslips from "./pages/Payslips";
import Documents from "./pages/Documents";
import Expenses from "./pages/Expenses";
import Helpdesk from "./pages/Helpdesk";
import Feed from "./pages/Feed";
import OrgChart from "./pages/OrgChart";
import Directory from "./pages/Directory";
import Employees from "./pages/hr/Employees";
import Recruitment from "./pages/hr/Recruitment";
import Onboarding from "./pages/hr/Onboarding";
import Offboarding from "./pages/hr/Offboarding";
import Payroll from "./pages/hr/Payroll";
import Performance from "./pages/hr/Performance";
import Training from "./pages/hr/Training";
import Analytics from "./pages/hr/Analytics";
import Roles from "./pages/admin/Roles";
import OrgStructure from "./pages/admin/OrgStructure";
import Workflows from "./pages/admin/Workflows";
import Audit from "./pages/admin/Audit";
import Integrations from "./pages/admin/Integrations";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leave" element={<Leave />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/payslips" element={<Payslips />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/helpdesk" element={<Helpdesk />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/org-chart" element={<OrgChart />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/hr/employees" element={<Employees />} />
              <Route path="/hr/recruitment" element={<Recruitment />} />
              <Route path="/hr/onboarding" element={<Onboarding />} />
              <Route path="/hr/offboarding" element={<Offboarding />} />
              <Route path="/hr/payroll" element={<Payroll />} />
              <Route path="/hr/performance" element={<Performance />} />
              <Route path="/hr/training" element={<Training />} />
              <Route path="/hr/analytics" element={<Analytics />} />
              <Route path="/admin/roles" element={<Roles />} />
              <Route path="/admin/org" element={<OrgStructure />} />
              <Route path="/admin/workflows" element={<Workflows />} />
              <Route path="/admin/audit" element={<Audit />} />
              <Route path="/admin/integrations" element={<Integrations />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
