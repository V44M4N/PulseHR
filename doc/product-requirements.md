# PulseHR — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-06-21  
**Status:** MVP

---

## 1. Product Overview

PulseHR is a cloud-based Human Resource Management System (HRMS) targeting Indian SMEs (50–2,000 employees). It unifies people operations — employee lifecycle, payroll, leave, attendance, recruitment, and compliance — into a single product that HR teams can configure entirely through the UI.

**Product Name:** Pulse HR  
**Tagline:** People operations OS  
**Primary Market:** India (INR, PF/TDS compliance)  
**Domain:** pulsehr.io

---

## 2. User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| Employee | Regular staff member | Self-service only |
| Manager | Team/department lead | Self-service + team approvals |
| HR | HR/People Ops staff | All employee data + HR operations |
| Admin | IT/Super admin | Full system access + configuration |

---

## 3. Functional Requirements

### 3.1 Authentication & Security
- **FR-AUTH-01:** Email + password login
- **FR-AUTH-02:** JWT access token (15 min) + refresh token (7 days) rotation
- **FR-AUTH-03:** Forced re-auth after password reset
- **FR-AUTH-04:** SSO via Google Workspace / Microsoft 365 (Admin-configurable)
- **FR-AUTH-05:** TOTP-based MFA (Admin-configurable)
- **FR-AUTH-06:** IP allowlist enforcement (Admin-configurable)
- **FR-AUTH-07:** Session management — view and revoke active sessions
- **FR-AUTH-08:** Role-based access enforced on every API endpoint

### 3.2 Employee Self-Service

#### Dashboard
- **FR-DASH-01:** Attendance summary (today's status, clock in/out time)
- **FR-DASH-02:** Leave balance summary (all leave types)
- **FR-DASH-03:** Recent leave requests
- **FR-DASH-04:** Company announcements feed

#### My Profile
- **FR-PROF-01:** View personal info (name, email, phone, DOB, gender)
- **FR-PROF-02:** Edit personal info (phone, emergency contacts)
- **FR-PROF-03:** View employment details (role, dept, manager, join date)
- **FR-PROF-04:** View bank details (account, IFSC — masked)
- **FR-PROF-05:** View tax info (PAN — masked, regime)
- **FR-PROF-06:** Upload/update profile photo

#### Leave
- **FR-LEAVE-01:** View all leave balances (earned, casual, sick, comp off)
- **FR-LEAVE-02:** Apply for leave with date range, type, and reason
- **FR-LEAVE-03:** View leave request history with status
- **FR-LEAVE-04:** Cancel pending leave requests
- **FR-LEAVE-05:** View team leave calendar (who is out)

#### Attendance
- **FR-ATT-01:** Clock in and clock out (one action per day)
- **FR-ATT-02:** View today's attendance status
- **FR-ATT-03:** View weekly attendance grid
- **FR-ATT-04:** View monthly calendar with daily status

#### Payslips
- **FR-PAY-01:** View payslip history (last 12 months)
- **FR-PAY-02:** View payslip breakdown (earnings and deductions)
- **FR-PAY-03:** Download payslip as PDF
- **FR-PAY-04:** View YTD salary summary

#### Documents
- **FR-DOC-01:** View personal documents (offer letter, form 16, etc.)
- **FR-DOC-02:** Upload documents (identity, certifications)
- **FR-DOC-03:** Download documents
- **FR-DOC-04:** Filter by category

#### Expenses
- **FR-EXP-01:** Submit expense claim with category, amount, date, description
- **FR-EXP-02:** Upload receipt (image/PDF)
- **FR-EXP-03:** View expense history with status
- **FR-EXP-04:** Cancel pending expense claims

#### Helpdesk
- **FR-HD-01:** Raise support ticket (title, category, description, priority)
- **FR-HD-02:** View ticket history and status
- **FR-HD-03:** Add comments to tickets
- **FR-HD-04:** Browse knowledge base / FAQs

### 3.3 Company

#### Feed
- **FR-FEED-01:** View company-wide announcements
- **FR-FEED-02:** React to announcements (admins/HR post, all can react)

#### Org Chart
- **FR-ORG-01:** Visual hierarchy from CEO down
- **FR-ORG-02:** Click employee node to view mini-profile
- **FR-ORG-03:** Expand/collapse subtrees

#### Directory
- **FR-DIR-01:** Search employees by name, role, or department
- **FR-DIR-02:** View employee card with contact info
- **FR-DIR-03:** Send email or initiate call from card

### 3.4 HR Operations (HR + Admin)

#### Employees
- **FR-EMP-01:** List all employees with filter/sort/search
- **FR-EMP-02:** Add new employee
- **FR-EMP-03:** Edit employee details
- **FR-EMP-04:** Deactivate / terminate employee
- **FR-EMP-05:** Bulk import via CSV
- **FR-EMP-06:** Export employee list to CSV/Excel

#### Recruitment
- **FR-REC-01:** Create job requisitions
- **FR-REC-02:** Kanban pipeline (Applied → Screening → Interview → Offer → Hired)
- **FR-REC-03:** Add/move candidates between stages
- **FR-REC-04:** Rate and note candidates
- **FR-REC-05:** Convert hired candidate to employee

#### Onboarding
- **FR-ONB-01:** Trigger onboarding workflow for new hires
- **FR-ONB-02:** Assign day-1 checklist tasks (IT, HR, Finance, Manager)
- **FR-ONB-03:** Track completion progress per new hire
- **FR-ONB-04:** Send onboarding email to new hire

#### Offboarding
- **FR-OFF-01:** Initiate offboarding for resigned/terminated employees
- **FR-OFF-02:** Checklist (asset return, access revocation, FnF settlement)
- **FR-OFF-03:** Track exit interview completion

#### Payroll
- **FR-PAYR-01:** Create monthly payroll run
- **FR-PAYR-02:** Auto-calculate salary based on attendance and leaves
- **FR-PAYR-03:** Apply deductions (PF, TDS, ESI, LOP)
- **FR-PAYR-04:** Finalize and generate payslips for all employees
- **FR-PAYR-05:** Mark payroll run as paid

#### Performance
- **FR-PERF-01:** Create review cycles (quarterly, annual)
- **FR-PERF-02:** Employee self-assessment submission
- **FR-PERF-03:** Manager review and rating
- **FR-PERF-04:** View performance history per employee

#### Training
- **FR-TRAIN-01:** Create training programs
- **FR-TRAIN-02:** Assign employees to programs
- **FR-TRAIN-03:** Track completion status

#### Analytics
- **FR-ANA-01:** Headcount trend (6-month chart)
- **FR-ANA-02:** Attrition by department
- **FR-ANA-03:** KPI cards (diversity %, engagement score, flight risk count)
- **FR-ANA-04:** Export analytics reports

### 3.5 Admin

#### Roles & Access
- **FR-ROLE-01:** View permission matrix (roles × modules)
- **FR-ROLE-02:** Grant/revoke module access per role
- **FR-ROLE-03:** Custom role creation (future)

#### Org Structure
- **FR-ORGSTR-01:** Manage departments (add, rename, delete)
- **FR-ORGSTR-02:** Manage office locations
- **FR-ORGSTR-03:** Manage business units

#### Workflows
- **FR-WF-01:** Configure leave approval workflow (direct manager vs skip-level)
- **FR-WF-02:** Configure expense approval thresholds
- **FR-WF-03:** Escalation rules (auto-approve after N days)

#### Audit Logs
- **FR-AUD-01:** Immutable log of all system events
- **FR-AUD-02:** Filter by actor, action, date range
- **FR-AUD-03:** Export audit logs

#### Integrations
- **FR-INT-01:** Google Workspace SSO
- **FR-INT-02:** Microsoft 365 SSO
- **FR-INT-03:** Slack notifications
- **FR-INT-04:** Webhook configuration (outbound events)

#### Settings
- **FR-SET-01:** Auth & Security (SSO toggle, MFA toggle, IP allowlist) — UI managed
- **FR-SET-02:** Localisation (timezone, date format, currency, fiscal year) — UI managed
- **FR-SET-03:** Data Privacy (retention policy, GDPR controls) — UI managed
- **FR-SET-04:** Notification templates (email subjects, content) — UI managed
- **FR-SET-05:** Leave type configuration (add, edit, carry-forward rules) — UI managed
- **FR-SET-06:** Holiday calendar — UI managed
- **FR-SET-07:** Salary structure templates — UI managed

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | API p95 < 200ms; page load < 2s |
| Availability | 99.5% uptime target |
| Scalability | Support 2,000 concurrent users |
| Security | OWASP Top 10, encrypted PII at rest |
| Compliance | Indian PF, TDS, ESI calculations |
| Audit | All write operations logged with actor + IP |
| Accessibility | WCAG 2.1 AA |
| Mobile | Responsive (works on tablet/mobile) |

---

## 5. Out of Scope (MVP)

- Mobile native app
- Biometric hardware integration
- Advanced AI features
- Multi-currency payroll
- Multi-entity / holding company structure
- Built-in video interviews
- Custom report builder
