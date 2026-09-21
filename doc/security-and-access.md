# PulseHR — Security & Access Control

**Version:** 1.0  
**Date:** 2026-06-21

---

## 1. Authentication

### 1.1 Login Flow
```
POST /api/v1/auth/login
Body: { email, password }

1. Find user by email
2. Verify bcrypt hash (cost factor 12)
3. Check isActive = true
4. Generate access token (JWT, 15 min)
5. Generate refresh token (opaque UUID, store hash in Session table)
6. Return: { accessToken, refreshToken, user }
```

### 1.2 Token Strategy
| Token | Type | Expiry | Storage |
|-------|------|--------|---------|
| Access Token | JWT (signed HS256) | 15 minutes | Memory (React state) |
| Refresh Token | Opaque UUID | 7 days | HttpOnly cookie OR localStorage |

**Access token payload:**
```json
{ "sub": "user_cuid", "role": "HR", "iat": 1234567890, "exp": 1234568790 }
```

**Refresh rotation:** Each use of `/auth/refresh` invalidates the old token and issues a new one. Old token is deleted from `Session` table.

### 1.3 Token Refresh
```
POST /api/v1/auth/refresh
Body: { refreshToken }

1. Find session by hash(refreshToken) where expiresAt > now
2. Delete old session
3. Issue new access + refresh tokens
4. Return: { accessToken, refreshToken }
```

### 1.4 Logout
```
POST /api/v1/auth/logout
Header: Authorization: Bearer <accessToken>

1. Extract userId from token
2. Delete all sessions for user (or just current)
3. Add access token to Redis blocklist (TTL = remaining expiry)
```

### 1.5 Password Policy
- Minimum 8 characters
- Must contain uppercase, lowercase, number
- Bcrypt hash with cost factor 12
- Password reset via time-limited email token (expires in 1 hour)
- Force new password on first login (when HR creates account)

---

## 2. Role-Based Access Control (RBAC)

### 2.1 Roles

| Role | Code | Description |
|------|------|-------------|
| Admin | `ADMIN` | Full system access |
| HR | `HR` | All employee data + HR operations |
| Manager | `MANAGER` | Self-service + team approvals |
| Employee | `EMPLOYEE` | Self-service only |

### 2.2 Permission Matrix

| Module | Admin | HR | Manager | Employee |
|--------|-------|----|---------|----|
| Own Profile | RW | RW | RW | RW |
| All Employees | RW | RW | R | — |
| Leave (own) | RW | RW | RW | RW |
| Leave (team) | RWA | RWA | RA | — |
| Leave (all) | RWA | RWA | — | — |
| Attendance (own) | RW | RW | RW | RW |
| Attendance (all) | RW | RW | R(team) | — |
| Payslips (own) | R | RW | R | R |
| Payslips (all) | RW | RW | — | — |
| Payroll Run | RW | RW | — | — |
| Documents (own) | RW | RW | RW | RW |
| Documents (all) | RW | RW | — | — |
| Expenses (own) | RW | RW | RW | RW |
| Expenses (approve) | RW | RW | RW | — |
| Helpdesk (own) | RW | RW | RW | RW |
| Helpdesk (all) | RW | RW | — | — |
| Feed (view) | R | R | R | R |
| Feed (post) | RW | RW | — | — |
| Recruitment | RW | RW | — | — |
| Analytics | R | R | — | — |
| Admin Settings | RW | — | — | — |
| Roles & Permissions | RW | — | — | — |
| Org Structure | RW | R | — | — |
| Audit Logs | R | — | — | — |

**Key:** R = Read, W = Write, A = Approve

### 2.3 Backend Enforcement

Every route uses two middleware functions:

```typescript
// 1. Verify JWT
router.use(authenticate);

// 2. Check role
router.get('/hr/employees', authorize(['HR', 'ADMIN']), employeeController.list);
```

```typescript
// middleware/auth.ts
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  // Check Redis blocklist
  const blocked = await redis.get(`blocklist:${token}`);
  if (blocked) return res.status(401).json({ error: 'Token revoked' });
  
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// middleware/rbac.ts
export const authorize = (roles: string[]) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```

### 2.4 Resource Ownership

For self-service endpoints, verify ownership:
```typescript
// Employee can only access their own records
if (req.user.role === 'EMPLOYEE' && record.employeeId !== req.user.employeeId) {
  return res.status(403).json({ error: 'Access denied' });
}
```

---

## 3. Admin-Configurable Security (stored in CompanySetting table)

These settings are managed entirely through the Admin Settings UI — no env var changes required:

### 3.1 SSO
```json
{ "key": "auth.sso", "value": { "enabled": false, "provider": "google", "domain": "" } }
```

### 3.2 MFA
```json
{ "key": "auth.mfa", "value": { "enabled": false, "required_for_roles": ["ADMIN", "HR"] } }
```

### 3.3 IP Allowlist
```json
{ "key": "auth.ip_allowlist", "value": { "enabled": false, "ips": ["10.0.0.0/8"] } }
```

### 3.4 Session Policy
```json
{ "key": "auth.session", "value": { "max_sessions": 3, "idle_timeout_minutes": 60 } }
```

**Enforcement:** Auth middleware reads these settings from Redis cache (TTL 5 min) on every request. Cache is invalidated when settings are updated via API.

---

## 4. Data Security

### 4.1 Encryption at Rest
- Database: PostgreSQL with encrypted volumes (handled at infra level)
- PAN numbers: AES-256 encrypted before storing, decrypted only for authorized HR/Admin
- Aadhaar: Store only last 4 digits — never store full number

### 4.2 Encryption in Transit
- All APIs: HTTPS only (TLS 1.2+) in production
- HSTS header enforced
- Cookies: `Secure`, `HttpOnly`, `SameSite=Strict`

### 4.3 PII Data Masking
- Account numbers: Show only last 4 digits in API responses for non-HR roles
- PAN: Show only last 4 chars for employee self-service
- Password hashes: Never returned in any API response

### 4.4 File Security
- Upload validation: MIME type + file extension whitelist
- File size limit: 10MB per document
- Stored outside web root — access only via signed URLs
- Virus scan: ClamAV integration (future)

### 4.5 Input Validation
- All request bodies validated with Zod schemas before processing
- SQL injection: Prevented by Prisma parameterized queries (never raw SQL with user input)
- XSS: All user-generated content sanitized with DOMPurify before rendering
- Path traversal: File paths never constructed from user input

---

## 5. API Security

### 5.1 Rate Limiting (via Redis)
| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 5 attempts / 15 min / IP |
| POST /auth/refresh | 30 / min / user |
| POST /documents (upload) | 20 / hour / user |
| All other endpoints | 200 / min / user |

### 5.2 Security Headers (via Helmet.js)
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

### 5.3 CORS
```typescript
cors({
  origin: process.env.FRONTEND_URL,  // Only allow frontend domain
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
})
```

---

## 6. Audit Logging

Every write operation (POST, PUT, DELETE) is automatically logged via middleware:

```typescript
// middleware/audit.ts
export const auditLog = async (req, res, next) => {
  res.on('finish', async () => {
    if (['POST','PUT','DELETE'].includes(req.method) && res.statusCode < 400) {
      await prisma.auditLog.create({
        data: {
          actorId:   req.user?.sub,
          actorName: req.user?.name ?? 'System',
          action:    `${req.method} ${req.path}`,
          target:    req.params.id ?? req.body?.email ?? '—',
          ipAddress: req.ip,
          metadata:  { body: sanitizeBody(req.body) },
        }
      });
    }
  });
  next();
};
```

Audit logs are append-only — no UPDATE or DELETE on `AuditLog` table (enforced at DB level with a trigger if required).

---

## 7. Compliance

### 7.1 India-Specific
- PF deduction: 12% employee + 12% employer on basic salary
- TDS: Calculated per Income Tax slabs (configurable via Settings UI)
- ESI: 0.75% employee + 3.25% employer (for salary ≤ ₹21,000/month)
- All calculations configurable through Salary Structure in Admin UI

### 7.2 GDPR / PDPA
- Right to erasure: Employee data can be anonymized (not deleted) via Admin UI
- Data retention: Configurable retention policy per data type via Admin Settings
- Data export: Employee can download their own data
- Consent: Recorded and stored in `CompanySetting` table

---

## 8. Secrets Management

| Secret | Storage | Rotation |
|--------|---------|---------|
| JWT secrets | `.env` (backend only) | Manual, requires redeploy |
| Database password | `.env` | Manual |
| AWS credentials | `.env` or IAM role | Manual / automatic |
| SMTP credentials | `.env` | Manual |
| SSO client secrets | DB (`CompanySetting`, encrypted) | Via Admin UI |

**Rule:** Only infrastructure credentials are in `.env`. All application-level secrets (SSO, webhook keys, etc.) are stored in the database and configurable via Admin UI.
