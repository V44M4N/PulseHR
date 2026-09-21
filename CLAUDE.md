# PulseHR — AI Build Guide

This is the complete build guide for Claude Code (or any AI assistant) working on PulseHR. Read this before touching any code.

---

## Project Overview

**PulseHR** is an HRMS with a complete React 18 + TypeScript frontend (26 pages, fully styled) and a backend that needs to be built. The goal is to connect the frontend to the backend with zero UI changes — only data sources change from mock to real API.

```
HRMS/
├── frontend/                  ← EXISTING frontend (do not restructure)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/                   ← NEEDS TO BE CREATED
├── docker/                    ← Docker build files
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── nginx.conf
│   └── entrypoint.sh
├── docker-compose.yml         ← dev infra (postgres + redis only)
├── docker-compose.fullstack.yml ← full containerized dev
├── docker-compose.prod.yml    ← production
├── .env.example               ← single env for everything
├── .dockerignore
├── Makefile                   ← convenience commands
├── doc/                       ← Architecture docs
└── CLAUDE.md                  ← This file
```

---

## Tech Stack

### Frontend (existing — do not change framework or dependencies)
- React 18 + TypeScript 5 + Vite 5 (port 8080)
- shadcn/ui + Radix UI + Tailwind CSS 3
- TanStack Query 5 (data fetching)
- React Router 6 (routing)
- React Hook Form 7 + Zod (forms)
- Recharts 2 (charts)

### Backend (to build)
- Node.js 20 + TypeScript + ts-node-dev
- Express 4
- Prisma 5 + PostgreSQL 15
- Redis 7 (sessions, rate limiting)
- JWT (jsonwebtoken) + bcrypt
- Zod (validation — same version as frontend)
- Multer (file uploads)
- PDFKit (payslip PDF generation)
- Swagger (auto docs at /api/v1/docs)

---

## Read These First

Before building any feature:
1. `doc/technical-architecture.md` — API routes, DB schema, folder structure
2. `doc/security-and-access.md` — RBAC rules, auth flow, audit logging
3. `doc/product-requirements.md` — Feature requirements
4. `doc/feature-tickets.md` — Sprint order and ticket IDs

---

## Backend Folder Structure

Every module follows this pattern — never put everything in one file:

```
backend/src/modules/<feature>/
├── <feature>.routes.ts      ← Express router, only route definitions
├── <feature>.controller.ts  ← Request parsing, response formatting
├── <feature>.service.ts     ← Business logic, DB calls via Prisma
└── <feature>.schema.ts      ← Zod validation schemas (DTOs)
```

---

## Code Conventions

### Always
- TypeScript strict mode — no `any` except at Express req/res boundaries
- Zod validate every request body before the controller runs
- Return consistent response envelope: `{ success, data, meta? }` for success; `{ success: false, error: { code, message } }` for errors
- Write audit log for every POST/PUT/DELETE that succeeds
- Use `prisma.$transaction` for operations that modify multiple tables
- Use `cuid()` for all primary keys (Prisma default)
- Auto-generate human-readable codes: `PH-XXXX` for employees, `L-XXXX` for leaves, etc. — use the `codeGen` utility
- Soft delete only: set `status = INACTIVE/TERMINATED`, never hard delete employee records

### Never
- No `console.log` — use the logger utility (`winston` or `pino`)
- No raw SQL with user input — always Prisma parameterized queries
- No secrets in code — only `process.env.*` values from validated env config
- No synchronous file I/O — always `fs.promises`
- No returning password hashes in any API response
- No storing full Aadhaar numbers — store only last 4 digits
- No `any` type on Prisma query results — use generated Prisma types

### Error Handling
```typescript
// In service layer — throw typed errors
import { AppError } from '@/utils/errors';
throw new AppError('LEAVE_BALANCE_INSUFFICIENT', 'Insufficient leave balance', 400);

// Global error handler catches all AppError + unexpected errors
// Returns: { success: false, error: { code, message } }
```

### Response Wrapper
```typescript
import { ok, fail } from '@/utils/response';

// Controller
res.json(ok(data));                          // { success: true, data }
res.json(ok(data, { page: 1, total: 100 })); // with pagination meta
res.status(400).json(fail('INVALID_INPUT', 'Bad request')); // error
```

---

## Environment Variables

**Single `.env` at repo root** — both frontend and backend read from it.

```
cp .env.example .env    # then fill in values
```

Vite is configured with `envDir: ".."` so it reads `VITE_*` vars from the root `.env`.  
The backend loads the same root `.env` via:
```typescript
// backend/src/index.ts (entry point)
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
```

- Only `VITE_` prefixed vars are exposed to the browser by Vite — secrets are safe.
- See `.env.example` at repo root for all required variables.
- **Everything else** (SSO config, MFA, IP allowlist, leave types, holiday calendar, salary structures, notification templates) is stored in the `CompanySetting` database table — managed through Admin UI. Never add new env vars for app config.

---

## Auth Implementation

### JWT payload shape
```typescript
{ sub: string; role: 'EMPLOYEE'|'MANAGER'|'HR'|'ADMIN'; name: string; iat: number; exp: number }
```

### Middleware order for protected routes
```typescript
router.use(authenticate);        // Verify JWT, check Redis blocklist
router.use(auditLogger);         // Attach audit context (runs after response)
router.get('/', authorize(['HR','ADMIN']), controller.list);
```

### Role mapping (backend ENUM → frontend lowercase)
```
ADMIN    → admin
HR       → hr
MANAGER  → manager
EMPLOYEE → employee
```

The frontend `RoleContext` uses lowercase strings. The backend JWT uses uppercase enums. The `AuthContext` on the frontend converts: `user.role.toLowerCase()`.

---

## RBAC Quick Reference

| Endpoint pattern | Who can access |
|-----------------|----------------|
| Own data (leave, payslips, attendance) | All authenticated users (own records only) |
| Team data (leave approvals, expense approvals) | MANAGER + HR + ADMIN |
| All employee data | HR + ADMIN |
| Payroll runs | HR + ADMIN |
| Admin settings, roles, org structure | ADMIN only |
| Audit logs | ADMIN only |

Ownership check pattern:
```typescript
if (req.user.role === 'EMPLOYEE' && record.employeeId !== req.user.sub) {
  throw new AppError('FORBIDDEN', 'Access denied', 403);
}
```

---

## Database Access Patterns

### Always use Prisma client singleton
```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient({ log: ['warn', 'error'] });
```

### Pagination helper
```typescript
// src/utils/pagination.ts
export const paginate = (page = 1, limit = 20) => ({
  skip: (page - 1) * limit,
  take: limit,
});
```

### Audit log helper
```typescript
// src/utils/audit.ts
export const writeAudit = (req, action: string, target: string) =>
  prisma.auditLog.create({
    data: { actorId: req.user.sub, actorName: req.user.name, action, target, ipAddress: req.ip }
  });
```

---

## Frontend Integration Rules

### Do not change any existing JSX or Tailwind classes
Only replace data sources. If a page currently does:
```typescript
import { employees } from '@/lib/mock-data';
```
Replace it with:
```typescript
const { data, isLoading } = useEmployees();
```

### TanStack Query key conventions
```typescript
['employees']                // all employees
['employees', id]            // single employee
['leave', 'balances']        // leave balances
['leave', 'requests']        // leave requests
['attendance', 'week']       // weekly attendance
```

### Always handle loading + error states
```typescript
if (isLoading) return <PageSkeleton />;
if (isError) return <ErrorState onRetry={refetch} />;
```

### File upload pattern
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('category', category);
client.post('/documents', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

---

## Settings — What Goes Where

| Setting | Where stored | Who manages |
|---------|-------------|-------------|
| Database URL | `.env` | DevOps |
| JWT secrets | `.env` | DevOps |
| AWS credentials | `.env` | DevOps |
| SSO provider + credentials | `CompanySetting` DB | Admin via UI |
| MFA toggle | `CompanySetting` DB | Admin via UI |
| IP allowlist | `CompanySetting` DB | Admin via UI |
| Leave types + balances | DB tables | Admin via UI |
| Holiday calendar | DB table | Admin via UI |
| Salary structure bands | DB table | HR/Admin via UI |
| Notification templates | `CompanySetting` DB | Admin via UI |
| Timezone / locale | `CompanySetting` DB | Admin via UI |
| Workflow / approval rules | DB table | Admin via UI |

---

## Sprint Build Order

Follow the sprint order in `doc/feature-tickets.md`:

1. **Sprint 0** — Infrastructure (backend scaffold, DB, Redis, seed)
2. **Sprint 1** — Auth + Employee core (login, JWT, protect routes)
3. **Sprint 2** — Leave + Attendance (self-service core)
4. **Sprint 3** — Payslips, Documents, Expenses
5. **Sprint 4** — Helpdesk, Feed, Directory, Org Chart
6. **Sprint 5** — HR Operations (Recruitment, Onboarding, Payroll, Analytics)
7. **Sprint 6** — Admin (Roles, Org Structure, Settings, Audit Logs)

---

## Running the Project

### Option A — Local dev (recommended, fastest iteration)
```bash
make dev                        # start postgres + redis in Docker
cd frontend && npm run dev      # Vite on :8080
cd backend  && npm run dev      # ts-node-dev on :4000
```

### Option B — Full containerized dev
```bash
make fullstack                  # everything in Docker with hot reload
# frontend :8080, backend :4000, postgres :5432, redis :6379
```

### Option C — Production stack
```bash
cp .env.example .env            # fill in real secrets first
make build-prod                 # build images
make prod                       # start on :80 (nginx → backend → postgres/redis)
```

### Other useful commands
```bash
make help                       # show all available commands
make logs                       # tail infra logs
make migrate                    # run pending migrations (prod)
make seed                       # seed demo data (prod)
make studio                     # Prisma Studio GUI (runs locally)
make shell-db                   # psql into postgres
make clean                      # remove all volumes (DESTRUCTIVE)
```

### Backend-only commands
```bash
cd backend
npm run dev          # ts-node-dev, hot reload, port 4000
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed demo data
npm run db:studio    # Prisma Studio GUI
```

## Docker Architecture

```
browser
  └── :80 → nginx (frontend container)
               ├── /          → serve React SPA (static files)
               └── /api/*     → proxy → backend:4000
                                   └── postgres:5432
                                   └── redis:6379
```

**VITE_API_BASE_URL behaviour:**
- Local dev: `http://localhost:4000/api/v1` (direct to backend)
- Docker prod: `/api/v1` (relative — Nginx proxies to backend:4000)

**DATABASE_URL and REDIS_URL in Docker:**
- docker-compose files override these with Docker service hostnames (`postgres`, `redis`)
- Your root `.env` keeps `localhost` values for local dev — no manual switching needed

---

## Common Mistakes to Avoid

1. **Don't break the frontend build** — never change `tsconfig.json`, `vite.config.ts`, or existing component props
2. **Don't add new pages** without updating `App.tsx` routes AND `AppSidebar.tsx` nav items with correct roles
3. **Don't skip Zod validation** — every API endpoint must validate its input before processing
4. **Don't return 200 for errors** — use correct HTTP status codes (400, 401, 403, 404, 409, 500)
5. **Don't store PAN/Aadhaar raw** — PAN encrypted, Aadhaar last-4 only
6. **Don't forget CORS** — backend must allow `FRONTEND_URL` origin
7. **Don't hardcode IDs** — use `req.user.sub` for the current employee's ID
8. **Don't skip audit logging** — all write operations must be logged
9. **Don't call Prisma directly in controllers** — always go through the service layer
10. **Don't add `any` types** to the Prisma query result — use generated types
