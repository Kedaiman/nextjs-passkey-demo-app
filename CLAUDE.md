# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build for production
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

This is a Next.js 16 App Router project demonstrating passkey (WebAuthn) authentication alongside traditional email/password auth.

### Key layers

- **`app/`** — Next.js App Router pages and API routes
- **`lib/db.ts`** — SQLite database (via `better-sqlite3`), initialized at startup with `users` and `passkeys` tables
- **`lib/session.ts`** — JWT-based session management using `jose`; sessions stored in an `HttpOnly` cookie named `session` (7-day expiry)

### Auth flow

1. **Register** (`POST /api/auth/register`) — creates user with bcrypt-hashed password, returns session cookie
2. **Login** (`POST /api/auth/login`) — verifies password, returns session cookie
3. **Logout** (`POST /api/auth/logout`) — clears session cookie
4. **Me** (`GET /api/auth/me`) — returns current session payload
5. **Dashboard** (`/dashboard`) — server component that reads session via `getSession()`, redirects to `/login` if unauthenticated; renders `PasskeySupport` client component

### Passkey implementation

`PasskeySupport.tsx` is a client component on the dashboard that:
- Checks `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` and `isConditionalMediationAvailable()`
- Calls `navigator.credentials.create()` to register a passkey (challenge is generated client-side — intended to move server-side)
- The `passkeys` table in SQLite is ready to store credentials, but the server-side registration/assertion API routes are not yet implemented

### Database

SQLite file at `./app.db` in dev, `/tmp/app.db` in production (overridable via `DATABASE_PATH` env var).

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | `dev-secret-change-in-production` | Signs session JWTs |
| `DATABASE_PATH` | `./app.db` (dev) / `/tmp/app.db` (prod) | SQLite file path |

All API routes set `export const runtime = "nodejs"` because `better-sqlite3` requires Node.js runtime (not Edge).
