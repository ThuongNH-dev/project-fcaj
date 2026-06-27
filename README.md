# Splitly

Splitly is a group expense management app for shared trips, households, and team spending. The project includes a React/Vite frontend and an Express/MongoDB backend with JWT auth, admin reporting, and password reset via OTP.

## Main Features

- User registration and login with JWT session storage
- Password reset flow with email OTP verification
- Profile update and password change for authenticated users
- Group management: create, edit, delete, add members, remove members
- Expense tracking, receipts, settlements, dashboard, and admin reporting with user role management
- Swagger/OpenAPI docs on the backend

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Radix UI, Lucide
- Backend: Node.js, Express, TypeScript, MongoDB native driver
- Auth/Security: bcryptjs, JWT, hashed password reset OTP/token
- Email: console, Gmail SMTP, or Resend
- Tests: Vitest + Testing Library for frontend behavior and route/auth guards

## Frontend Architecture

```text
src/
  main.tsx
  styles/
  test/
    setup.ts
  web/
    App.tsx
    app/
      admin/
      guards/
      private/
      public/
      routes/
    domains/
      admin-reporting/
      auth/
      expenses/
      groups/
      receipts/
      settlements/
      users/
    shared/
      api/
      lib/
      providers/
      ui/
```

Key conventions:

- App shells and route composition live in `src/web/app/*`
- Feature logic lives in `src/web/domains/*`
- Shared API helpers, providers, and UI primitives live in `src/web/shared/*`
- Shared display helpers live in `src/web/shared/lib/*`
- Route composition is centralized in `src/web/app/routes/AppRoutes.tsx`
- Auth session is treated as valid only when both stored `user` and `token` exist

## Backend Architecture

```text
be/src/
  config/
  db/
  middleware/
  modules/
    admin/
      queries/
    auth/
    expenses/
    groups/
    receipts/
    users/
  policies/
  server.ts
```

Key conventions:

- Thin controllers, domain logic in module services
- Shared permission rules live in `be/src/policies/*`
- Admin reporting queries are split under `be/src/modules/admin/queries/*`

## Local Setup

1. Install frontend dependencies:

```powershell
npm install
```

2. Install backend dependencies:

```powershell
npm --prefix be install
```

3. Create backend env file:

```powershell
Copy-Item .\be\.env.example .\be\.env
```

4. Fill `be/.env` with MongoDB, JWT, frontend URL, and email provider settings.

5. Start MongoDB locally with Docker if you are not using MongoDB Atlas:

```powershell
npm run db:up
```

6. Start the backend:

```powershell
npm run backend
```

Backend default URL: `http://localhost:5000`

7. Start the frontend in another terminal:

```powershell
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Example `.env`

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=Splitly
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
EMAIL_PROVIDER=console
```

### Console Email

For quick local development, OTP and reset links are printed in backend logs:

```env
EMAIL_PROVIDER=console
```

### Gmail SMTP

```env
EMAIL_PROVIDER=gmail
GMAIL_SMTP_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_character_google_app_password
EMAIL_FROM=Splitly <your-gmail@gmail.com>
```

### Resend

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
RESEND_API_URL=https://api.resend.com/emails
EMAIL_FROM=Splitly <no-reply@your-verified-domain.com>
```

## API Docs

When the backend is running:

- Swagger UI: `http://localhost:5000`
- OpenAPI JSON: `http://localhost:5000/docs.json`
- Health check: `GET http://localhost:5000/health`
- MongoDB test: `GET http://localhost:5000/api/test`

Core API groups:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-otp`
- `POST /api/auth/reset-password`
- `GET/PATCH /api/users/me`
- `PATCH /api/users/me/password`
- `GET/POST /api/groups`
- `GET/PATCH/DELETE /api/groups/:groupId`
- `POST /api/groups/:groupId/members`
- `DELETE /api/groups/:groupId/members/:memberId`
- `GET /api/admin/users`
- `GET /api/admin/users/export`
- `GET/PATCH/DELETE /api/admin/users/:userId`
- `GET /api/admin/*`

## Scripts

Root:

```powershell
npm run dev
npm run build
npm run test
npm run test:watch
npm run backend
npm run backend:start
npm run db:up
npm run db:down
```

Backend:

```powershell
npm --prefix be run dev
npm --prefix be run build
npm --prefix be run start
```

## Automated Tests

Current frontend automated tests cover:

- auth storage behavior
- session synchronization in the private sidebar
- private/admin route guards
- token invalidation handling in the shared API client
- group permission policies
- settlement domain calculations

Run them with:

```powershell
npm test
```

## Suggested Verification Before PR

```powershell
npm test
npm run build
npm --prefix be run build
```

If auth or email behavior changed, also manually verify:

- register a new user
- log in
- request password reset
- try an invalid OTP
- verify a valid OTP and set a new password
- log in again with the new password

## Security Notes

- Do not commit `be/.env`, real MongoDB URIs, JWT secrets, Gmail app passwords, or Resend keys
- Password reset OTPs and reset tokens are stored hashed in MongoDB
- Frontend clears the local auth session when the backend reports a missing or expired token
- Group ownership is treated as a domain permission, not a global system role
- Frontend `npm audit` findings were addressed by patching `react-router` and `vite`
- Backend `npm audit` findings were addressed by pinning the patched `esbuild` release through `overrides`
