# PulseHR — Technical Architecture

**Version:** 1.0  
**Date:** 2026-06-21

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React 18 + Vite)                                   │
│  Port 8080 (dev) / Nginx (prod)                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST JSON
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  API Server  (Node.js 20 + Express + TypeScript)             │
│  Port 4000                                                   │
│  /api/v1/*                                                   │
└──────┬────────────┬─────────────────────┬───────────────────┘
       │            │                     │
       ▼            ▼                     ▼
┌──────────┐ ┌──────────────┐   ┌──────────────────┐
│PostgreSQL│ │  Redis 7     │   │  File Storage    │
│   15+    │ │ (sessions,   │   │  Local / S3      │
│          │ │  cache)      │   │                  │
└──────────┘ └──────────────┘   └──────────────────┘
```

---

## 2. Tech Stack

### Frontend (Existing — No Changes)
| Layer | Technology |
|-------|-----------|
| Framework | React 18.3 + TypeScript 5.8 |
| Build | Vite 5.4, port 8080 |
| Routing | React Router DOM 6 |
| State | Context API + TanStack Query 5 |
| UI | shadcn/ui + Radix UI + Tailwind CSS 3 |
| Forms | react-hook-form 7 + Zod |
| Charts | Recharts 2 |
| HTTP | TanStack Query (fetch wrapper) |

### Backend (To Build)
| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js 20 LTS | Same language as frontend |
| Framework | Express.js 4 + TypeScript | Stable, well-documented |
| ORM | Prisma 5 | Type-safe, excellent TS integration |
| Database | PostgreSQL 15 | Relational, ACID, JSON columns |
| Cache | Redis 7 | Sessions, rate limiting, job queue |
| Auth | JWT (jsonwebtoken) + bcrypt | Industry standard |
| Validation | Zod 3 | Shared schemas with frontend possible |
| File Upload | Multer + AWS S3 SDK | Multipart forms, S3 in prod |
| Email | Nodemailer (dev) / Resend (prod) | Transactional emails |
| PDF | PDFKit or Puppeteer | Payslip generation |
| Testing | Vitest + Supertest | Fast unit + integration tests |
| Docs | Swagger (swagger-jsdoc) | Auto-generated API docs |

---

## 3. Project Structure

```
HRMS/
├── frontend/               # Frontend (existing)
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── ...
├── backend/                # Backend (to create)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts          # Zod-validated env vars
│   │   │   ├── database.ts     # Prisma client singleton
│   │   │   └── redis.ts        # Redis client
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT verify + attach req.user
│   │   │   ├── rbac.ts         # Role permission check
│   │   │   ├── errorHandler.ts # Global error boundary
│   │   │   ├── validate.ts     # Zod request validation
│   │   │   └── audit.ts        # Audit log writer
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── employees/
│   │   │   ├── leave/
│   │   │   ├── attendance/
│   │   │   ├── payslips/
│   │   │   ├── documents/
│   │   │   ├── expenses/
│   │   │   ├── helpdesk/
│   │   │   ├── feed/
│   │   │   ├── recruitment/
│   │   │   ├── onboarding/
│   │   │   ├── payroll/
│   │   │   ├── performance/
│   │   │   ├── training/
│   │   │   ├── analytics/
│   │   │   └── admin/
│   │   │       ├── roles/
│   │   │       ├── org/
│   │   │       ├── workflows/
│   │   │       ├── audit/
│   │   │       ├── integrations/
│   │   │       └── settings/
│   │   ├── utils/
│   │   │   ├── pagination.ts   # Cursor/offset pagination helper
│   │   │   ├── codeGen.ts      # Generate PH-XXXX, L-XXXX codes
│   │   │   └── response.ts     # Standardized API response wrapper
│   │   └── index.ts            # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── uploads/                # Local file storage (dev only)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── doc/
└── .env.example                # Root env for frontend
```

---

## 4. Database Schema (Prisma)

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth ───────────────────────────────────────────────
model User {
  id           String     @id @default(cuid())
  employeeId   String?    @unique
  email        String     @unique
  passwordHash String
  role         UserRole   @default(EMPLOYEE)
  isActive     Boolean    @default(true)
  mfaSecret    String?
  employee     Employee?
  sessions     Session[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

enum UserRole { EMPLOYEE MANAGER HR ADMIN }

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
}

// ─── Core HR ────────────────────────────────────────────
model Employee {
  id               String           @id @default(cuid())
  employeeCode     String           @unique
  userId           String?          @unique
  user             User?            @relation(fields: [userId], references: [id])
  firstName        String
  lastName         String
  email            String           @unique
  phone            String?
  designation      String
  departmentId     String
  department       Department       @relation(fields: [departmentId], references: [id])
  managerId        String?
  manager          Employee?        @relation("Reports", fields: [managerId], references: [id])
  reports          Employee[]       @relation("Reports")
  locationId       String?
  location         Location?        @relation(fields: [locationId], references: [id])
  dateOfJoining    DateTime
  dateOfBirth      DateTime?
  gender           String?
  employmentType   String           @default("Full-time")
  status           EmployeeStatus   @default(ACTIVE)
  avatarUrl        String?
  bankDetails      BankDetails?
  taxInfo          TaxInfo?
  emergencyContacts EmergencyContact[]
  leaveBalances    LeaveBalance[]
  leaveRequests    LeaveRequest[]
  attendanceRecords AttendanceRecord[]
  payslips         Payslip[]
  documents        Document[]
  expenses         Expense[]
  tickets          HelpdeskTicket[]
  onboardingTasks  OnboardingTask[]
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}

enum EmployeeStatus { ACTIVE PROBATION NOTICE INACTIVE TERMINATED }

model Department {
  id        String       @id @default(cuid())
  name      String       @unique
  headId    String?
  parentId  String?
  parent    Department?  @relation("SubDepts", fields: [parentId], references: [id])
  children  Department[] @relation("SubDepts")
  employees Employee[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model Location {
  id        String     @id @default(cuid())
  name      String     @unique
  city      String
  country   String     @default("India")
  timezone  String     @default("Asia/Kolkata")
  employees Employee[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model BankDetails {
  id            String   @id @default(cuid())
  employeeId    String   @unique
  employee      Employee @relation(fields: [employeeId], references: [id])
  accountNumber String
  ifscCode      String
  bankName      String
  accountType   String   @default("Savings")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model TaxInfo {
  id            String   @id @default(cuid())
  employeeId    String   @unique
  employee      Employee @relation(fields: [employeeId], references: [id])
  panNumber     String?
  aadhaarLast4  String?
  taxRegime     String   @default("new")
  pfNumber      String?
  esiNumber     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model EmergencyContact {
  id           String   @id @default(cuid())
  employeeId   String
  employee     Employee @relation(fields: [employeeId], references: [id])
  name         String
  relationship String
  phone        String
  email        String?
  createdAt    DateTime @default(now())
}

// ─── Leave ──────────────────────────────────────────────
model LeaveType {
  id           String        @id @default(cuid())
  name         String        @unique
  defaultDays  Int
  color        String
  carryForward Boolean       @default(false)
  maxCarryDays Int?
  balances     LeaveBalance[]
  requests     LeaveRequest[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model LeaveBalance {
  id          String    @id @default(cuid())
  employeeId  String
  employee    Employee  @relation(fields: [employeeId], references: [id])
  leaveTypeId String
  leaveType   LeaveType @relation(fields: [leaveTypeId], references: [id])
  year        Int
  total       Int
  used        Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@unique([employeeId, leaveTypeId, year])
}

model LeaveRequest {
  id             String      @id @default(cuid())
  code           String      @unique
  employeeId     String
  employee       Employee    @relation(fields: [employeeId], references: [id])
  leaveTypeId    String
  leaveType      LeaveType   @relation(fields: [leaveTypeId], references: [id])
  fromDate       DateTime
  toDate         DateTime
  days           Int
  reason         String
  status         LeaveStatus @default(PENDING)
  approvedById   String?
  approvedAt     DateTime?
  rejectedReason String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

enum LeaveStatus { PENDING APPROVED REJECTED CANCELLED }

// ─── Attendance ─────────────────────────────────────────
model AttendanceRecord {
  id          String           @id @default(cuid())
  employeeId  String
  employee    Employee         @relation(fields: [employeeId], references: [id])
  date        DateTime         @db.Date
  clockIn     DateTime?
  clockOut    DateTime?
  hoursWorked Float?
  status      AttendanceStatus @default(PRESENT)
  notes       String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  @@unique([employeeId, date])
}

enum AttendanceStatus { PRESENT ABSENT HALF_DAY ON_LEAVE HOLIDAY WEEKEND }

// ─── Payroll ─────────────────────────────────────────────
model Payslip {
  id          String        @id @default(cuid())
  code        String        @unique
  employeeId  String
  employee    Employee      @relation(fields: [employeeId], references: [id])
  month       Int
  year        Int
  grossSalary Float
  earnings    Json
  deductions  Json
  netSalary   Float
  status      PayslipStatus @default(DRAFT)
  pdfPath     String?
  processedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  @@unique([employeeId, month, year])
}

enum PayslipStatus { DRAFT PROCESSED PAID }

model PayrollRun {
  id            String        @id @default(cuid())
  code          String        @unique
  month         Int
  year          Int
  status        PayrollStatus @default(DRAFT)
  totalGross    Float?
  totalNet      Float?
  employeeCount Int?
  processedById String?
  processedAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  @@unique([month, year])
}

enum PayrollStatus { DRAFT PROCESSING PROCESSED PAID CANCELLED }

// ─── Documents ───────────────────────────────────────────
model Document {
  id         String           @id @default(cuid())
  employeeId String?
  employee   Employee?        @relation(fields: [employeeId], references: [id])
  name       String
  category   DocumentCategory
  filePath   String
  fileSize   String
  mimeType   String
  uploadedBy String
  isPublic   Boolean          @default(false)
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
}

enum DocumentCategory { EMPLOYMENT TAX COMPENSATION IDENTITY POLICY OTHER }

// ─── Expenses ────────────────────────────────────────────
model Expense {
  id             String        @id @default(cuid())
  code           String        @unique
  employeeId     String
  employee       Employee      @relation(fields: [employeeId], references: [id])
  date           DateTime
  category       String
  amount         Float
  currency       String        @default("INR")
  description    String
  receiptPath    String?
  status         ExpenseStatus @default(PENDING)
  approvedById   String?
  approvedAt     DateTime?
  rejectedReason String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

enum ExpenseStatus { PENDING APPROVED REJECTED REIMBURSED UNDER_REVIEW }

// ─── Helpdesk ────────────────────────────────────────────
model HelpdeskTicket {
  id         String         @id @default(cuid())
  code       String         @unique
  employeeId String
  employee   Employee       @relation(fields: [employeeId], references: [id])
  title      String
  description String
  category   String
  priority   TicketPriority @default(MEDIUM)
  status     TicketStatus   @default(OPEN)
  assignedTo String?
  resolvedAt DateTime?
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
}

enum TicketPriority { LOW MEDIUM HIGH CRITICAL }
enum TicketStatus   { OPEN IN_PROGRESS RESOLVED CLOSED }

// ─── Feed ────────────────────────────────────────────────
model Announcement {
  id          String   @id @default(cuid())
  authorId    String
  authorName  String
  title       String
  body        String
  reactions   Int      @default(0)
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── Recruitment ─────────────────────────────────────────
model JobRequisition {
  id           String       @id @default(cuid())
  code         String       @unique
  title        String
  departmentId String?
  location     String?
  type         String       @default("Full-time")
  status       JobStatus    @default(OPEN)
  openedById   String
  closedAt     DateTime?
  candidates   Candidate[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

enum JobStatus { DRAFT OPEN ON_HOLD CLOSED }

model Candidate {
  id          String         @id @default(cuid())
  code        String         @unique
  jobId       String?
  job         JobRequisition? @relation(fields: [jobId], references: [id])
  name        String
  email       String
  phone       String?
  stage       CandidateStage @default(APPLIED)
  source      String
  appliedDate DateTime
  rating      Int?
  cvPath      String?
  notes       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

enum CandidateStage { APPLIED SCREENING INTERVIEW OFFER HIRED REJECTED }

// ─── Onboarding ──────────────────────────────────────────
model OnboardingTask {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  title       String
  description String?
  owner       String
  dueDate     DateTime?
  completed   Boolean  @default(false)
  completedAt DateTime?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── Admin ───────────────────────────────────────────────
model CompanySetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  category  String
  updatedBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  actorId   String?
  actorName String
  action    String
  target    String
  ipAddress String?
  metadata  Json?
}
```

---

## 5. API Design

### Base URL
```
Development:  http://localhost:4000/api/v1
Production:   https://api.pulsehr.io/api/v1
```

### Response Envelope
```json
// Success
{ "success": true, "data": { ... }, "meta": { "page": 1, "total": 100 } }

// Error
{ "success": false, "error": { "code": "LEAVE_BALANCE_INSUFFICIENT", "message": "..." } }
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <access_token>
```

### Endpoint Map

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | /auth/login | Public | Email + password login |
| POST | /auth/refresh | Public | Rotate refresh token |
| POST | /auth/logout | Auth | Revoke session |
| GET | /auth/me | Auth | Current user + employee |
| GET | /employees | HR,Admin | List employees |
| POST | /employees | HR,Admin | Create employee |
| GET | /employees/:id | HR,Admin,self | Get employee |
| PUT | /employees/:id | HR,Admin | Update employee |
| DELETE | /employees/:id | Admin | Soft delete |
| GET | /leave/balances | Auth | My balances |
| GET | /leave/requests | Auth | My requests (HR sees all) |
| POST | /leave/requests | Employee,Manager | Apply for leave |
| PUT | /leave/requests/:id/approve | Manager,HR | Approve |
| PUT | /leave/requests/:id/reject | Manager,HR | Reject |
| GET | /leave/team-calendar | Manager,HR | Team leave view |
| POST | /attendance/clock-in | Auth | Clock in |
| POST | /attendance/clock-out | Auth | Clock out |
| GET | /attendance/today | Auth | Today's record |
| GET | /attendance/week | Auth | Weekly records |
| GET | /attendance/monthly | Auth | Monthly calendar |
| GET | /payslips | Auth | My payslips |
| GET | /payslips/:id | Auth | Payslip detail |
| GET | /payslips/:id/pdf | Auth | Download PDF |
| GET | /documents | Auth | My documents |
| POST | /documents | Auth | Upload document |
| GET | /documents/:id/download | Auth | Download file |
| DELETE | /documents/:id | Auth | Delete document |
| GET | /expenses | Auth | My expenses |
| POST | /expenses | Auth | Submit claim |
| PUT | /expenses/:id/approve | Manager,HR | Approve |
| PUT | /expenses/:id/reject | Manager,HR | Reject |
| GET | /helpdesk/tickets | Auth | My tickets |
| POST | /helpdesk/tickets | Auth | Create ticket |
| PUT | /helpdesk/tickets/:id | Auth,HR | Update ticket |
| GET | /feed | Auth | Announcements |
| POST | /feed | HR,Admin | Create announcement |
| POST | /feed/:id/react | Auth | React to post |
| GET | /directory | Auth | Employee directory |
| GET | /org-chart | Auth | Org hierarchy |
| GET | /hr/recruitment/jobs | HR,Admin | Job list |
| POST | /hr/recruitment/jobs | HR,Admin | Create job |
| GET | /hr/recruitment/candidates | HR,Admin | Candidates |
| POST | /hr/recruitment/candidates | HR,Admin | Add candidate |
| PUT | /hr/recruitment/candidates/:id/stage | HR,Admin | Move stage |
| GET | /hr/onboarding | HR,Admin | Onboarding list |
| GET | /hr/onboarding/:empId/tasks | HR,Admin | Tasks list |
| PUT | /hr/onboarding/:empId/tasks/:taskId | HR,Admin | Complete task |
| GET | /hr/payroll/runs | HR,Admin | Payroll runs |
| POST | /hr/payroll/runs | HR,Admin | Start run |
| POST | /hr/payroll/runs/:id/process | HR,Admin | Finalize run |
| GET | /hr/analytics/headcount | HR,Admin | Headcount trend |
| GET | /hr/analytics/attrition | HR,Admin | Attrition data |
| GET | /hr/analytics/kpis | HR,Admin | KPI summary |
| GET | /admin/roles | Admin | Permission matrix |
| PUT | /admin/roles/:role/permissions | Admin | Update permissions |
| GET | /admin/org/departments | Admin | Departments |
| POST | /admin/org/departments | Admin | Add department |
| PUT | /admin/org/departments/:id | Admin | Update department |
| DELETE | /admin/org/departments/:id | Admin | Delete department |
| GET | /admin/org/locations | Admin | Locations |
| POST | /admin/org/locations | Admin | Add location |
| GET | /admin/audit-logs | Admin | Audit trail |
| GET | /admin/settings | Admin | All settings |
| PUT | /admin/settings/:key | Admin | Update setting |
| GET | /admin/workflows | Admin | Workflow rules |
| PUT | /admin/workflows/:id | Admin | Update rule |

---

## 6. Frontend Service Layer

Create `src/lib/api/` to replace mock-data imports:

```
src/lib/
├── api/
│   ├── client.ts          # Axios instance with interceptors
│   ├── auth.ts            # Auth endpoints
│   ├── employees.ts       # Employee endpoints
│   ├── leave.ts           # Leave endpoints
│   ├── attendance.ts      # Attendance endpoints
│   ├── payslips.ts        # Payslip endpoints
│   ├── documents.ts       # Document endpoints
│   ├── expenses.ts        # Expense endpoints
│   ├── helpdesk.ts        # Helpdesk endpoints
│   ├── feed.ts            # Feed endpoints
│   ├── recruitment.ts     # Recruitment endpoints
│   ├── onboarding.ts      # Onboarding endpoints
│   ├── payroll.ts         # Payroll endpoints
│   ├── analytics.ts       # Analytics endpoints
│   └── admin.ts           # Admin endpoints
├── mock-data.ts           # KEEP — used as fallback/dev seed
└── utils.ts
```

### client.ts pattern
```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// Attach access token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulsehr.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      // attempt refresh, retry, or redirect to /login
    }
    return Promise.reject(err);
  }
);

export default client;
```

---

## 7. Environment Variables

**Single `.env` at repo root** — see `.env.example` for all variables.

```
HRMS/
└── .env          ← one file, both frontend and backend read from here
```

- **Frontend:** Vite is configured with `envDir: ".."` so it reads `VITE_*` vars from the root `.env`.
- **Backend:** Entry point calls `dotenv.config({ path: path.resolve(__dirname, '../../.env') })`.
- Only `VITE_` prefixed vars are sent to the browser — backend secrets stay server-side.

**All application config beyond infrastructure credentials is stored in the `CompanySetting` table and managed via the Admin Settings UI.**

---

## 8. Docker Setup

### Container Architecture (Production)

```
Internet
  └── :80 ──► nginx (frontend container)
                 ├── /          → static React build (Nginx serves files)
                 └── /api/*     → proxy ──► backend:4000
                                               ├── postgres:5432 (internal only)
                                               └── redis:6379    (internal only)
```

### Compose Files

| File | Purpose | When to use |
|------|---------|-------------|
| `docker-compose.yml` | Postgres + Redis only | Local dev (run frontend/backend natively) |
| `docker-compose.fullstack.yml` | All 4 services, hot reload | Onboarding, CI |
| `docker-compose.prod.yml` | Production, built images | Staging / production |

### Quick Start

```bash
# Local dev (most common)
make dev                          # start postgres + redis
cd frontend && npm run dev        # :8080
cd backend  && npm run dev        # :4000

# Production
cp .env.example .env              # fill in real values
make build-prod && make prod      # :80
```

### Docker Files

| File | Description |
|------|-------------|
| `docker/Dockerfile.frontend` | Multi-stage: node:20 build → nginx:1.27 serve |
| `docker/Dockerfile.backend` | Multi-stage: build TS → slim Node runner |
| `docker/nginx.conf` | Serve SPA + proxy `/api/*` to backend, gzip, cache headers |
| `docker/entrypoint.sh` | Runs `prisma migrate deploy` then starts server |
| `.dockerignore` | Excludes node_modules, .env, dist from build context |
| `Makefile` | `make help` shows all available commands |

### Environment in Docker

| Var | Local dev value | Docker override |
|-----|----------------|-----------------|
| `DATABASE_URL` | `...@localhost:5432/...` | `...@postgres:5432/...` |
| `REDIS_URL` | `redis://localhost:6379` | `redis://redis:6379` |
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` | `/api/v1` (relative, Nginx proxies) |

The compose files override `DATABASE_URL` and `REDIS_URL` automatically — no manual `.env` editing needed when switching between local and Docker.

---

## 9. Key Architectural Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| API style | REST | Simpler, matches current frontend patterns |
| Code format | module-per-feature | Scales without monolith files |
| Settings storage | DB table, not env | Admin configures without redeploy |
| Auth tokens | JWT + refresh rotation | Stateless, revocable via Redis blocklist |
| File storage | Local dev, S3 prod | No infra dep in dev, scalable in prod |
| Audit logs | Append-only DB table | Immutable, queryable |
| Pagination | Offset-based | Simple for HR table views |
| Soft deletes | `status=INACTIVE` | Preserve audit history |
| Docker | Nginx proxies all traffic | Single port exposure, no CORS in prod |
| Compose strategy | 3 files (infra/fullstack/prod) | Flexibility without complexity |
