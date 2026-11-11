<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## PIAI Gym API and backend

### Architecture

- The application uses Next.js 16 App Router Route Handlers under `app/api/`.
- Prisma ORM 7 uses the generated client at `app/generated/prisma` and the PostgreSQL driver adapter configured in `lib/prisma.ts`.
- `DATABASE_URL` is read by Prisma from the local environment. Never expose it in client code or documentation.
- `lib/auth.ts` derives the account role from its related `admin`, `owner`, `cs`, or `member` profile. Unprofiled accounts created through Customer Sign Up are treated as Customer accounts.
- Sessions use the signed `piai_session` HttpOnly cookie (`SameSite=Lax`, seven-day lifetime, Secure in production). Set a random `SESSION_SECRET` of at least 32 bytes in the deployment environment.
- Passwords created through Sign Up are scrypt hashes. Existing plaintext passwords are verified and upgraded to a hash on successful login.
- Protected pages call `requirePageRole`; API resource handlers call `getSessionActor` and enforce their role server-side. Never authorize from a role supplied only by the browser.
- Do not add a competing Prisma Client; use the singleton exported from `lib/prisma.ts`.

### Route map

| Route | Methods | Access and purpose |
|---|---|---|
| `/api/auth/login` | POST | Verifies username, password, and requested role; creates a session cookie. |
| `/api/auth/register` | POST | Creates a Customer login account; username lookup is case-insensitive. |
| `/api/auth/logout` | POST | Clears the session cookie. |
| `/api/auth/session` | GET | Returns the current session actor, or an unauthenticated result. |
| `/api/admin/dashboard` | GET | Admin summary counts. |
| `/api/admin/members` | GET, POST | Member profiles and membership types; Admin creates a member profile for an existing Customer account. |
| `/api/admin/payments` | GET, POST | Transactions, payment creation, and confirmation of an existing pending transaction. |
| `/api/admin/cards` | GET, POST | Membership card lookup and creation. |
| `/api/admin/attendance` | GET, POST | Attendance listing and Admin check-in by active card. |
| `/api/admin/notifications` | GET, POST | Notifications and membership-expiry reminders. |
| `/api/admin/schedules` | GET, POST, PATCH | Piket schedule administration. Deletion is not exposed. |
| `/api/customer/dashboard` | GET | Customer summary scoped to the signed-in account. |
| `/api/customer/membership` | GET, POST | Membership types and member profile registration. |
| `/api/customer/bills`, `/api/customer/payments`, `/api/customer/attendance`, `/api/customer/notifications`, `/api/customer/profile` | GET; POST for payments and attendance; PATCH for profile | Customer-owned records only; Customers cannot set payment status or choose another member for check-in. |
| `/api/cleaning-service/dashboard`, `/api/cleaning-service/schedules`, `/api/cleaning-service/facility-reports` | GET; POST for facility reports | Schedules and reports scoped to the signed-in Cleaning Service profile. |
| `/api/owner/dashboard` | GET | Owner read-only summary. |
| `/api/owner/reports/revenue`, `/api/owner/reports/facilities`, `/api/owner/reports/attendance`, `/api/owner/reports/registrations` | GET | Owner read-only reports; accepts `startDate` and `endDate`. |

### Database relationships and business rules

- `member.id_user` is a unique foreign key to `users.id_user`; Customer identity is resolved from the verified session and this relation.
- `transaksi` references `member`, `jenis_member`, and `admin`; it stores amount, transaction date, payment status, and membership start/end dates.
- `users.username` has no database unique constraint. Registration serializes this API's check-and-insert using a PostgreSQL advisory lock, but another writer bypassing the API can still create a duplicate. A database uniqueness constraint requires an approved schema/ERD change.
- API registration acquires that advisory transaction lock with `$executeRaw`; `$queryRaw` cannot deserialize PostgreSQL's `void` return from `pg_advisory_xact_lock`.
- A transaction is reported as revenue or an active membership only when `status_bayar = "Lunas"`. Customer payment requests remain `Menunggu Verifikasi`; no payment gateway is integrated.
- Admin attendance requires an active card and a paid active membership, and prevents duplicate same-day check-ins under a transaction lock.
- Customer self check-in resolves the member only from the verified session, requires a paid active membership, and shares the same-day duplicate lock with Admin check-in.
- Cleaning Service identity comes from the session; schedule mutation endpoints are Admin-only.
- Owner endpoints are read-only and filter reports to valid date ranges.
- `laporan_fasilitas` stores facility name, report date, status, and Cleaning Service ID, but has no description column.
- Owner revenue reports list transactions in the selected period, while realized revenue totals include only `status_bayar = "Lunas"`. Registration reports use `transaksi` rows with `jenis_transaksi = "Pendaftaran"` because `member` has no registration date, membership type, or status fields.
- `check_in` has no card foreign key; the Owner attendance report can show cards related to the member but cannot identify which card was used for a visit.

### Schema and workflow limitations

- The Customer membership form collects registration date (not birth date) and city. `member` has no birth-date column and requires `kota`; never infer city from the address. `/api/customer/membership` also accepts POST to validate and create the profile and initial bill atomically.
- Customer membership registration creates the member profile and a `Menunggu Verifikasi` transaction atomically. The registration receipt confirms registration and billing only, not payment.
- The database has no payment-gateway/QRIS confirmation data. `public/images/qris.png` exists but is only 66 bytes and does not have a valid PNG signature; the UI may reference it but must show an explicit load-error message rather than invent or substitute a QR code. Admin review remains manual.
- Customer account Sign Up is separate from membership registration. Membership registration uses the authenticated Customer account and creates its member profile.
- Customer check-in uses the authenticated member profile and requires a paid, currently active membership. Admin and Customer check-ins share same-day duplicate protection.
- The existing username schema cannot guarantee uniqueness against external writers until a unique constraint is approved and applied.

### Local development and verification

1. Configure `DATABASE_URL` for the PostgreSQL `apsi_db` database and `SESSION_SECRET` in `.env` or the deployment secret store. Do not copy secret values into source files.
2. Install dependencies with the repository package manager, then run `npx prisma generate` when the schema changes.
3. Run `npm run dev` for local development.
4. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` before delivery.
5. Test API role boundaries, authentication/session/logout, and both read/write flows against a controlled database. Avoid mutating seeded records in tests.
- Role-protected pages call `connection()` before session verification so Next.js 16 Cache Components evaluates session expiration at request time.
- If local `.env` has no session secret, create a random `SESSION_SECRET` locally; do not print or commit it. The local development configuration for this continuation was missing it, so a secret was generated without changing `DATABASE_URL`.

### Verification completed so far

- `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` have completed successfully after the Customer UI/API changes. In this Windows PowerShell environment, invoke npm through `npm.cmd` and npx through `npx.cmd` if script execution policy blocks the `.ps1` shims.
- A read-only connection check confirmed `apsi_db` is reachable and contains the expected 12 tables.
- Database inspection found 12 users, no case-insensitive duplicate usernames, and no unique index on `users.username`. The API guards duplicate registrations with an advisory lock, but writers outside the API are not protected.
- Playwright verified valid login for all four roles. An invalid Customer login returned 401 and displayed the failure frame only after submit. Duplicate Customer Sign Up, including a case-variant username, returned 409 and showed the username-used frame. Successful Customer Sign Up was not run because it would create a persistent user record.
- Playwright verified logout, unauthenticated session state, redirect to login when opening a protected page, and 403 when a Cleaning Service session requested an Owner endpoint.
- Playwright verified the Owner revenue date filter against PostgreSQL: Jan–Dec 2026 returned five paid transactions totaling Rp650.000 with membership types shown.
- Playwright verified the Admin dashboard lists database-backed counts, payments, and schedules; Customer dashboard shows its membership, notification, and attendance data; Cleaning Service dashboard shows schedule/report counts.
- Valid Customer Sign Up, new membership/payment writes, check-in writes, schedule/report writes, and the three cross-role use cases have not been verified. Seed membership dates are expired as of November 2026, so an attendance write cannot be safely exercised with existing records.
- Four legacy role passwords were upgraded to scrypt hashes during successful login tests. No users, transactions, check-ins, schedules, or facility reports were inserted or deleted during testing; database row counts remained unchanged.
- Customer membership validation and save, Admin payment approve/reject, Customer QRIS instructions/status refresh, and Customer self check-in are implemented but have not been verified end-to-end after the latest UI/API changes. Do not run these writes against operational data without explicit authorization.
- The Customer membership flow no longer asks for birth date; it collects city without changing the schema. QRIS display remains blocked by the invalid `public/images/qris.png` asset until a valid original file is supplied.
- No database writes were run for the latest Customer changes. Figma MCP context retrieval was blocked by the account's tool-call limit; implementation was checked against local project references.
