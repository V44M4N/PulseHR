# Phase 1 authentication integration

The login form submits to `/api/v1/auth/login`, and `/auth/me` supplies the real identity and role. Protected routes restore the session using the HttpOnly refresh cookie. The existing navigation uses the authenticated role and the header supports sign-out.

The API client keeps access tokens in memory, includes cookies, attaches bearer authorization, shares refresh across concurrent 401 responses, and retries once. Refresh failure or a second 401 clears authentication and cached queries. Requests time out after 15 seconds. No token is stored in localStorage or sessionStorage.

The backend now accepts cookie-only refresh requests: validation previously required a body token, while the controller read cookies without a cookie parser. Body tokens remain supported for non-browser clients.

Business module pages still use their original mock data during Phase 1. Dashboard/profile business data, MFA, SSO and the payroll salary source are unchanged.

## Configuration

Copy `.env.example` to `.env`, set unique JWT secrets of at least 32 characters, and use:

```dotenv
VITE_API_URL=http://localhost:4000/api/v1
FRONTEND_URL=http://localhost:8080
```

The client accepts legacy `VITE_API_BASE_URL` as a fallback. Vite reads the root `.env`. Existing backend CORS uses `FRONTEND_URL` with credentials enabled. Use the same hostname for both services so the Strict cookie works. Production uses `/api/v1` through Nginx.

```sh
docker compose -f docker-compose.fullstack.yml up --build
```

Open `http://localhost:8080/login` and use an account from `backend/prisma/seed.ts`. The existing full-stack startup pushes the schema and seeds demo data; use a disposable development database.

## Verification

Frontend: `npm run build`, `npx tsc --noEmit -p tsconfig.app.json`, `npm test`.
Backend: `npx prisma generate`, `npm run build`, `npm test`.

Phase-specific tests cover bearer headers, cookies, refresh/retry, concurrent refresh, refresh failure, retry exhaustion, failed login/403 behavior, logout during refresh, and cookie-only/body-token backend refresh. They mock network/auth-service boundaries and do not replace the real database acceptance check.

Acceptance checks: sign in with valid and invalid credentials; verify all four roles; reload a protected URL; exercise expired access-token refresh; sign out and reload; verify no tokens appear in browser storage. Phase 2 begins as a separate commit batch after acceptance.

The local verification run passed both production builds, frontend type-checking, 14 new frontend auth tests, and 4 backend cookie transport tests (plus the original frontend placeholder). Browser inspection confirmed the login layout and redirect from `/hr/employees` while unauthenticated. Docker Compose configuration validates. Live database acceptance is pending runtime startup.
