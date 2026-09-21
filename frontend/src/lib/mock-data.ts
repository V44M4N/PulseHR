// Mock data placeholders — replace with real API calls when backend is connected.

export const currentUser = {
  name: "Aarav Sharma",
  email: "aarav.sharma@pulsehr.io",
  designation: "Senior Product Designer",
  department: "Design",
  manager: "Priya Verma",
  employeeId: "PH-2041",
  joinDate: "2022-03-14",
  location: "Bengaluru, IN",
  avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Aarav",
};

export const leaveBalances = [
  { type: "Earned Leave", balance: 12, total: 18, color: "hsl(160 84% 39%)" },
  { type: "Casual Leave", balance: 4, total: 7, color: "hsl(217 91% 60%)" },
  { type: "Sick Leave", balance: 6, total: 8, color: "hsl(38 92% 50%)" },
  { type: "Comp Off", balance: 2, total: 2, color: "hsl(280 70% 60%)" },
];

export const recentLeaves = [
  { id: "L-2401", type: "Earned Leave", from: "2026-04-28", to: "2026-04-30", days: 3, status: "Approved", reason: "Family event" },
  { id: "L-2398", type: "Sick Leave", from: "2026-04-12", to: "2026-04-12", days: 1, status: "Approved", reason: "Flu" },
  { id: "L-2391", type: "Casual Leave", from: "2026-05-10", to: "2026-05-11", days: 2, status: "Pending", reason: "Personal work" },
  { id: "L-2380", type: "Earned Leave", from: "2026-03-22", to: "2026-03-24", days: 3, status: "Rejected", reason: "Holiday trip" },
];

export const attendanceWeek = [
  { day: "Mon", in: "09:12", out: "18:34", hours: 9.4 },
  { day: "Tue", in: "09:02", out: "18:51", hours: 9.8 },
  { day: "Wed", in: "09:24", out: "19:10", hours: 9.8 },
  { day: "Thu", in: "09:08", out: "18:22", hours: 9.2 },
  { day: "Fri", in: "09:18", out: "17:48", hours: 8.5 },
  { day: "Sat", in: "—", out: "—", hours: 0 },
  { day: "Sun", in: "—", out: "—", hours: 0 },
];

export const payslips = [
  { month: "Mar 2026", gross: 184000, deductions: 32400, net: 151600, status: "Paid" },
  { month: "Feb 2026", gross: 184000, deductions: 32400, net: 151600, status: "Paid" },
  { month: "Jan 2026", gross: 184000, deductions: 32400, net: 151600, status: "Paid" },
  { month: "Dec 2025", gross: 184000, deductions: 31200, net: 152800, status: "Paid" },
  { month: "Nov 2025", gross: 174000, deductions: 30100, net: 143900, status: "Paid" },
  { month: "Oct 2025", gross: 174000, deductions: 30100, net: 143900, status: "Paid" },
];

export const documents = [
  { name: "Offer Letter.pdf", category: "Employment", uploaded: "2022-03-10", size: "248 KB" },
  { name: "Confirmation Letter.pdf", category: "Employment", uploaded: "2022-09-12", size: "190 KB" },
  { name: "Form 16 — FY24-25.pdf", category: "Tax", uploaded: "2025-06-02", size: "1.2 MB" },
  { name: "Increment Letter 2025.pdf", category: "Compensation", uploaded: "2025-04-01", size: "210 KB" },
  { name: "PAN Card.jpg", category: "Identity", uploaded: "2022-03-08", size: "84 KB" },
  { name: "Aadhaar.pdf", category: "Identity", uploaded: "2022-03-08", size: "320 KB" },
];

export const expenses = [
  { id: "EXP-1042", date: "2026-04-18", category: "Travel", amount: 4250, status: "Approved", desc: "Cab to client meeting" },
  { id: "EXP-1039", date: "2026-04-12", category: "Internet", amount: 1499, status: "Reimbursed", desc: "Monthly broadband" },
  { id: "EXP-1031", date: "2026-04-05", category: "Meals", amount: 820, status: "Pending", desc: "Team lunch" },
  { id: "EXP-1024", date: "2026-03-28", category: "Equipment", amount: 12500, status: "Under Review", desc: "Mechanical keyboard" },
];

export const tickets = [
  { id: "HD-882", title: "Payslip discrepancy for March", category: "Payroll", priority: "High", status: "In Progress", updated: "2h ago" },
  { id: "HD-871", title: "Update emergency contact", category: "Profile", priority: "Low", status: "Resolved", updated: "1d ago" },
  { id: "HD-863", title: "Request for experience letter", category: "Documents", priority: "Medium", status: "Open", updated: "3d ago" },
];

export const announcements = [
  { id: 1, author: "People Team", time: "2h ago", title: "Q2 All-Hands — Friday 4 PM", body: "Join us in the main hall for product roadmap, financials, and a special guest speaker.", reactions: 42 },
  { id: 2, author: "IT Helpdesk", time: "Yesterday", title: "Scheduled VPN maintenance", body: "VPN will be down between 1–3 AM IST on Saturday for upgrades.", reactions: 12 },
  { id: 3, author: "CEO Office", time: "3 days ago", title: "Welcome to 14 new joiners 🎉", body: "Please welcome our newest Pulse-rs across Engineering, Design and GTM.", reactions: 218 },
];

export const employees = [
  { id: "PH-2041", name: "Aarav Sharma", role: "Sr. Product Designer", dept: "Design", location: "Bengaluru", status: "Active", email: "aarav.sharma@pulsehr.io" },
  { id: "PH-2042", name: "Priya Verma", role: "Design Director", dept: "Design", location: "Bengaluru", status: "Active", email: "priya@pulsehr.io" },
  { id: "PH-1987", name: "Rahul Iyer", role: "Engineering Manager", dept: "Engineering", location: "Hyderabad", status: "Active", email: "rahul@pulsehr.io" },
  { id: "PH-2103", name: "Sara Khan", role: "Senior Backend Engineer", dept: "Engineering", location: "Remote", status: "Active", email: "sara@pulsehr.io" },
  { id: "PH-2118", name: "Ishaan Mehta", role: "Recruiter", dept: "People", location: "Mumbai", status: "Probation", email: "ishaan@pulsehr.io" },
  { id: "PH-2055", name: "Neha Gupta", role: "Finance Lead", dept: "Finance", location: "Delhi", status: "Active", email: "neha@pulsehr.io" },
  { id: "PH-2199", name: "Vikram Rao", role: "GTM Lead", dept: "Sales", location: "Bengaluru", status: "Active", email: "vikram@pulsehr.io" },
  { id: "PH-2210", name: "Ananya Nair", role: "Content Strategist", dept: "Marketing", location: "Remote", status: "Notice", email: "ananya@pulsehr.io" },
];

export const candidates = [
  { id: "C-501", name: "Karan Singh", role: "Senior Frontend Engineer", stage: "Interview", source: "LinkedIn", applied: "2026-04-08", rating: 4 },
  { id: "C-498", name: "Meera Joshi", role: "Product Manager", stage: "Offer", source: "Referral", applied: "2026-04-02", rating: 5 },
  { id: "C-492", name: "Tanvi Bhat", role: "UX Researcher", stage: "Screening", source: "Career Site", applied: "2026-04-15", rating: 4 },
  { id: "C-488", name: "Rohit Kapoor", role: "Backend Engineer", stage: "Applied", source: "Naukri", applied: "2026-04-19", rating: 3 },
  { id: "C-475", name: "Aisha Reddy", role: "Designer", stage: "Hired", source: "Referral", applied: "2026-03-22", rating: 5 },
];

export const auditLogs = [
  { time: "2026-04-22 10:14", actor: "Priya Verma", action: "Approved leave", target: "L-2401 (Aarav Sharma)", ip: "10.0.4.21" },
  { time: "2026-04-22 09:42", actor: "Neha Gupta", action: "Ran payroll", target: "March 2026 cycle", ip: "10.0.4.18" },
  { time: "2026-04-22 09:11", actor: "System", action: "Backup completed", target: "primary-db", ip: "—" },
  { time: "2026-04-21 18:33", actor: "Rahul Iyer", action: "Updated salary structure", target: "Band L5", ip: "10.0.7.99" },
  { time: "2026-04-21 16:02", actor: "Ishaan Mehta", action: "Created job requisition", target: "JR-118 Backend", ip: "10.0.6.40" },
];

export const headcountTrend = [
  { month: "Nov", value: 412 },
  { month: "Dec", value: 428 },
  { month: "Jan", value: 441 },
  { month: "Feb", value: 458 },
  { month: "Mar", value: 471 },
  { month: "Apr", value: 489 },
];

export const attritionByDept = [
  { dept: "Engineering", rate: 8.2 },
  { dept: "Design", rate: 5.4 },
  { dept: "Sales", rate: 14.1 },
  { dept: "Marketing", rate: 9.8 },
  { dept: "Finance", rate: 4.0 },
  { dept: "People", rate: 6.6 },
];