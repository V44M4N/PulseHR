# PulseHR — Feature Ticket List (MVP)

**Version:** 1.0  
**Date:** 2026-06-21  
**Total Tickets:** 52

Priority: P0 = Blocker · P1 = MVP Core · P2 = MVP Complete · P3 = Post-MVP

---

## Sprint 0 — Infrastructure (P0)

| ID | Title | Description | Effort |
|----|-------|-------------|--------|
| INF-001 | Backend project scaffold | Create `backend/` with Express + TypeScript + Prisma setup, folder structure, tsconfig, scripts | S |
| INF-002 | Database setup | PostgreSQL connection, Prisma schema, initial migration | S |
| INF-003 | Redis setup | Redis client, session store, rate limiter config | S |
| INF-004 | Environment config | Zod-validated env loader in `config/env.ts`, `.env.example` | XS |
| INF-005 | Global middleware | Helmet, CORS, morgan, compression, global error handler | S |
| INF-006 | Swagger docs | swagger-jsdoc + swagger-ui-express at `/api/v1/docs` | S |
| INF-007 | Database seed | Seed script with demo company, 8 employees, leave types, settings | M |
| INF-008 | Frontend env setup | Create `.env` with `VITE_API_BASE_URL`, create `src/lib/api/client.ts` | XS |

---

## Sprint 1 — Auth & Employee Core (P0)

| ID | Title | Description | Effort |
|----|-------|-------------|--------|
| AUTH-001 | Login endpoint | `POST /auth/login` — bcrypt verify, JWT issue, Session create | S |
| AUTH-002 | Token refresh | `POST /auth/refresh` — rotate refresh token, issue new access token | S |
| AUTH-003 | Logout | `POST /auth/logout` — delete Session, add token to Redis blocklist | S |
| AUTH-004 | Get current user | `GET /auth/me` — return user + employee profile | XS |
| AUTH-005 | JWT middleware | `authenticate` middleware — verify JWT, check blocklist, attach `req.user` | S |
| AUTH-006 | RBAC middleware | `authorize(roles)` — check role, 403 on mismatch | XS |
| AUTH-007 | Frontend Login page | `/login` route, email+password form, call auth API, store tokens, redirect | M |
| AUTH-008 | AuthContext + ProtectedRoute | Replace RoleContext with AuthContext, add ProtectedRoute wrapper | M |
| AUTH-009 | Logout button in TopBar | Wire TopBar logout to `useAuth().logout()` | XS |
| EMP-001 | Employee list | `GET /employees` — paginated, filterable by dept/status/search | M |
| EMP-002 | Get employee | `GET /employees/:id` — full profile with relations | S |
| EMP-003 | Create employee | `POST /employees` — Zod validation, auto-generate employeeCode | M |
| EMP-004 | Update employee | `PUT /employees/:id` — partial update, ownership check | S |
| EMP-005 | Deactivate employee | `PUT /employees/:id/status` — soft delete / status change | S |

---

## Sprint 2 — Self-Service: Leave & Attendance (P1)

| ID | Title | Description | Effort |
|----|-------|-------------|--------|
| LEAVE-001 | Leave types API | `GET /leave/types` — admin configures, all roles read | XS |
| LEAVE-002 | Leave balances | `GET /leave/balances` — current year balances for authenticated user | S |
| LEAVE-003 | Apply for leave | `POST /leave/requests` — validate days vs balance, create request | M |
| LEAVE-004 | List my requests | `GET /leave/requests` — filter by status, paginated | S |
| LEAVE-005 | Approve/reject leave | `PUT /leave/requests/:id/approve|reject` — manager/HR only, update balance | M |
| LEAVE-006 | Cancel leave | `PUT /leave/requests/:id/cancel` — employee can cancel pending | XS |
| LEAVE-007 | Team calendar | `GET /leave/team-calendar` — approved leaves for team in date range | M |
| LEAVE-008 | Frontend Leave page | Replace mock data, connect balances + requests, wire apply form | M |
| ATT-001 | Clock in | `POST /attendance/clock-in` — one per day, record timestamp | S |
| ATT-002 | Clock out | `POST /attendance/clock-out` — calculate hoursWorked | S |
| ATT-003 | Today's record | `GET /attendance/today` — current day status | XS |
| ATT-004 | Weekly records | `GET /attendance/week` — Mon–Sun for current week | S |
| ATT-005 | Monthly calendar | `GET /attendance/monthly` — all days in a month with status | S |
| ATT-006 | Frontend Attendance page | Replace mock data, wire clock-in/out buttons, weekly grid | M |

---

## Sprint 3 — Self-Service: Payslips, Documents, Expenses (P1)

| ID | Title | Description | Effort |
|----|-------|-------------|--------|
| PAY-001 | List payslips | `GET /payslips` — my payslips, paginated | S |
| PAY-002 | Payslip detail | `GET /payslips/:id` — full breakdown (earnings JSON, deductions JSON) | S |
| PAY-003 | Download payslip PDF | `GET /payslips/:id/pdf` — generate PDF, stream to client | L |
| PAY-004 | Frontend Payslips page | Replace mock, connect API, wire download button | M |
| DOC-001 | List documents | `GET /documents` — filtered by employeeId, category | S |
| DOC-002 | Upload document | `POST /documents` — multipart/form-data, save to storage | M |
| DOC-003 | Download document | `GET /documents/:id/download` — signed URL or stream | M |
| DOC-004 | Delete document | `DELETE /documents/:id` — soft delete | XS |
| DOC-005 | Frontend Documents page | Replace mock, connect API, wire upload/download | M |
| EXP-001 | List expenses | `GET /expenses` — my expenses, paginated | S |
| EXP-002 | Submit expense | `POST /expenses` — with optional receipt upload | M |
| EXP-003 | Approve/reject expense | `PUT /expenses/:id/approve|reject` — manager/HR | S |
| EXP-004 | Frontend Expenses page | Replace mock, connect API, wire submit form | M |

---

## Sprint 4 — Helpdesk, Feed, Directory (P1)

| ID | Title | Description | Effort |
|----|-------|-------------|--------|
| HD-001 | Create ticket | `POST /helpdesk/tickets` | S |
| HD-002 | List tickets | `GET /helpdesk/tickets` — own tickets (HR sees all) | S |
| HD-003 | Update ticket | `PUT /helpdesk/tickets/:id` — HR assigns, changes status | S |
| HD-004 | Frontend Helpdesk page | Replace mock, wire create form + status updates | M |
| FEED-001 | List announcements | `GET /feed` — published only, sorted by date | S |
| FEED-002 | Create announcement | `POST /feed` — HR/Admin only | S |
| FEED-003 | React to announcement | `POST /feed/:id/react` — increment count | XS |
| FEED-004 | Frontend Feed page | Replace mock, wire reactions | M |
| DIR-001 | Employee directory | `GET /directory` — all active employees, searchable | S |
| DIR-002 | Org chart data | `GET /org-chart` — tree structure with manager relationships | M |
| DIR-003 | Frontend Directory page | Replace mock | S |
| DIR-004 | Frontend Org Chart page | Replace mock | S |

---

## Sprint 5 — HR Operations (P1)

| ID | Title | Description | Effort |
|----|-------|-------------|--------|
| REC-001 | Job requisitions CRUD | `GET/POST /hr/recruitment/jobs` | M |
| REC-002 | Candidates CRUD | `GET/POST /hr/recruitment/candidates` | M |
| REC-003 | Move candidate stage | `PUT /hr/recruitment/candidates/:id/stage` | S |
| REC-004 | Frontend Recruitment page | Replace mock, wire Kanban stage movement | L |
| ONB-001 | Trigger onboarding | `POST /hr/onboarding` — create default task set for new hire | M |
| ONB-002 | Onboarding tasks | `GET/PUT /hr/onboarding/:empId/tasks` | S |
| ONB-003 | Frontend Onboarding page | Replace mock | M |
| PAYR-001 | Payroll run CRUD | `GET/POST /hr/payroll/runs` | M |
| PAYR-002 | Process payroll run | `POST /hr/payroll/runs/:id/process` — generate payslips for all active employees | L |
| PAYR-003 | Frontend Payroll page | Replace placeholder with live data | M |
| ANA-001 | Headcount trend | `GET /hr/analytics/headcount` — last 6 months | S |
| ANA-002 | Attrition by dept | `GET /hr/analytics/attrition` | S |
| ANA-003 | KPI cards | `GET /hr/analytics/kpis` | S |
| ANA-004 | Frontend Analytics page | Replace mock charts | M |

---

## Sprint 6 — Admin (P2)

| ID | Title | Description | Effort |
|----|-------|-------------|--------|
| ADM-001 | Roles & permissions API | `GET/PUT /admin/roles/:role/permissions` — stored in CompanySetting | M |
| ADM-002 | Departments CRUD | `GET/POST/PUT/DELETE /admin/org/departments` | M |
| ADM-003 | Locations CRUD | `GET/POST/PUT/DELETE /admin/org/locations` | S |
| ADM-004 | Audit logs API | `GET /admin/audit-logs` — filterable, paginated | S |
| ADM-005 | Settings API | `GET/PUT /admin/settings/:key` — all UI-configurable settings | M |
| ADM-006 | Workflows API | `GET/PUT /admin/workflows` — approval chain configuration | M |
| ADM-007 | Frontend Admin Settings page | Wire all settings to API (SSO, MFA, IP, locale, etc.) | L |
| ADM-008 | Frontend Roles page | Wire permission matrix to API | M |
| ADM-009 | Frontend Org Structure page | Wire departments/locations CRUD | M |
| ADM-010 | Frontend Audit Logs page | Replace mock, add filters | M |

---

## Effort Scale
| Size | Hours |
|------|-------|
| XS | 1–2 |
| S | 3–5 |
| M | 6–10 |
| L | 11–16 |
| XL | 17–24 |

---

## MVP Definition of Done

- [ ] All P0 and P1 tickets complete
- [ ] Login/logout working end-to-end
- [ ] Employee self-service (leave, attendance, payslips, documents, expenses, helpdesk) fully connected to API
- [ ] HR can manage employees, recruitment pipeline, onboarding, run payroll
- [ ] All API endpoints have Zod validation and return proper error messages
- [ ] JWT auth enforced on all protected endpoints
- [ ] Audit log written for all write operations
- [ ] No mock data shown in production (VITE_ENABLE_MOCK=false)
- [ ] Seed script populates a working demo environment
