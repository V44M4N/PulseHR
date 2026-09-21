# PulseHR integration status

Phase 1 authentication and Phase 2 leave are complete and committed. Authentication is live in the browser and the leave module has real query/mutation flows for balances, requests, apply, cancel, filtering, pagination and team calendar.

The frontend now also has a typed endpoint map in `frontend/src/lib/api/modules.ts` and a reusable TanStack Query mutation/query wrapper in `frontend/src/hooks/useModuleQuery.ts` for attendance, payslips, documents, expenses, helpdesk, feed, directory, employees, recruitment, onboarding, payroll, analytics and admin. Directory and profile are connected to real data as part of this rollout.

Payroll now reads `SalaryStructure.monthlyGross` and calculation percentages from Prisma instead of deriving salary from an employee ID. Seed data creates a default salary structure for every demo employee. The calculator has unit tests and the real Docker database has a payroll process smoke test.

The remaining visual pages still need their JSX-specific adapters and mutation forms wired to the endpoint map: attendance, payslips, documents, expenses, helpdesk, feed, org chart, HR operations, analytics and admin settings. Their backend routes and frontend service contracts are ready; their old mock imports remain intentionally until each page is converted and verified. MFA, SSO, IP allow-list enforcement and field-level encryption remain Phase 6 work.

Checks currently passing:

- frontend build, type-check and 15 tests;
- backend build and 7 tests;
- real Docker smoke checks for all four roles, refresh rotation, logout revocation, leave create/read/cancel and payroll processing.
