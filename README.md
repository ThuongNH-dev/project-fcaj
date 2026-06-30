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

4. Fill `be/.env` with MongoDB, JWT, frontend URL, email provider settings, and S3 settings if you want receipt uploads to work.

Required for basic local development:

- `PORT`
- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `FRONTEND_URL`
- `EMAIL_PROVIDER`

Required for receipt upload to AWS S3:

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_RECEIPTS_BUCKET`
- `S3_RECEIPTS_PREFIX`
- `S3_PRESIGN_EXPIRES_SECONDS`

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
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=replace_with_an_iam_access_key
AWS_SECRET_ACCESS_KEY=replace_with_an_iam_secret_key
S3_RECEIPTS_BUCKET=replace_with_your_bucket_name
S3_RECEIPTS_PREFIX=receipts/
S3_PRESIGN_EXPIRES_SECONDS=300
EMAIL_PROVIDER=console
```

Notes:

- `FRONTEND_URL` should match the actual frontend origin used by the backend for reset-password links. If Vite runs on another port such as `5175`, update it.
- Receipt uploads accept `PNG`, `JPG`, `JPEG`, and `PDF` files up to `10MB`.
- If you are not using S3 yet, keep the S3 values empty, but receipt upload endpoints will fail until they are configured.

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

## AWS S3 Receipt Upload Setup

Receipt files are uploaded with this flow:

1. frontend requests a presigned upload URL from `POST /api/receipts/presign`
2. frontend uploads the file directly to S3
3. backend stores receipt metadata in MongoDB with `POST /api/receipts`

To make that work in a new environment:

1. Create a private S3 bucket in the same region you place in `AWS_REGION`
2. Keep `Block all public access` enabled
3. Create a dedicated IAM user for the backend
4. Attach an S3 policy limited to the receipt prefix, for example:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReceiptsObjectAccess",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/receipts/*"
    }
  ]
}
```

5. Add bucket CORS so the browser can upload to S3 from local frontend origins:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5175",
      "http://127.0.0.1:5175"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Restart the backend after updating `be/.env`

Expected storage path format inside the bucket:

```text
receipts/<userId>/<year>/<month>/<generated-file-name>
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

Manual checks recommended for a fresh dev environment:

- register and log in with a normal user
- create a group
- upload a receipt and verify the object appears in S3
- create an expense with the uploaded receipt attached
- log in as an admin and verify `/admin/users` plus user export
- test forgot-password and reset-password links if email settings changed

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
