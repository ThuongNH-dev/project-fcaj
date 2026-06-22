# S3 Receipt Upload Design

## Goal

Move receipt uploads from "metadata only" to real file uploads on Amazon S3, while preserving the current project structure:

- frontend in `src/web`
- backend in `be/src`
- MongoDB for receipt and expense records
- existing `receiptId` link between receipts and expenses

This design is intentionally shaped around the current codebase so the team can implement it incrementally without rewriting the receipt and admin flows.

## Current State

The project already has a usable receipt domain:

- `src/web/components/ReceiptsPage.tsx` lists receipts and calls `uploadReceipt(...)`
- `src/web/components/ExpensesPage.tsx` uploads a receipt first, then creates an expense with `receiptId`
- `src/web/components/GroupDetailPage.tsx` uses the same pattern
- `be/src/modules/receipts/receipts.controller.ts` accepts receipt metadata
- `be/src/modules/receipts/receipts.service.ts` stores receipt records in MongoDB
- `be/src/modules/admin/admin.service.ts` reads receipt records for admin uploads, rejected items, and activity logs

Important limitation:

- the app does not upload the actual file bytes today
- the frontend only sends JSON metadata like `originalFileName`, `storagePath`, `mimeType`, and `sizeInBytes`
- `storagePath` is currently synthetic, not backed by real cloud storage

## Target Architecture

Use a two-step upload flow:

1. Frontend requests a presigned S3 upload URL from backend
2. Frontend uploads the file directly to S3
3. Frontend calls backend to finalize and store the receipt record in MongoDB
4. Expense creation continues to use `receiptId` exactly like today

This keeps the existing app model intact while replacing the fake upload path with a real one.

## Why This Fits The Current Project

- The backend already owns validation for receipt type, size, group, and expense association.
- The frontend already expects a receipt to exist before creating an expense.
- Admin pages already read receipt records from MongoDB, so they do not need a redesign.
- Direct browser-to-S3 upload avoids pushing large files through Express.
- `receiptId` remains the stable integration point between `receipts` and `expenses`.

## Upload Flow

### A. Standalone receipt upload

Used by `src/web/components/ReceiptsPage.tsx`.

1. User selects a file
2. Frontend calls `POST /api/receipts/presign`
3. Backend validates metadata and returns:
   - `uploadUrl`
   - `objectKey`
   - `publicUrl` or `viewUrl` if needed later
   - `expiresIn`
   - `headers` the client must send
4. Frontend uploads the file to S3 with `fetch(uploadUrl, { method: "PUT", body: file, headers })`
5. Frontend calls `POST /api/receipts`
6. Backend stores the receipt record in MongoDB
7. Frontend refreshes the receipt list or prepends the new receipt

### B. Receipt upload during expense creation

Used by `src/web/components/ExpensesPage.tsx` and `src/web/components/GroupDetailPage.tsx`.

1. User selects receipt in `AddExpenseModal`
2. Frontend runs the same `presign -> S3 upload -> create receipt record` flow
3. Backend returns `receipt.id`
4. Frontend calls `POST /api/expenses` with `receiptId`
5. Existing expense logic continues to work

## Backend Changes

### 1. Add S3 configuration

Update `be/src/config/env.ts` to support:

- `awsRegion`
- `awsAccessKeyId`
- `awsSecretAccessKey`
- `s3ReceiptsBucket`
- `s3ReceiptsPrefix`
- `s3PresignExpiresSeconds`

Suggested env names:

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_RECEIPTS_BUCKET`
- `S3_RECEIPTS_PREFIX`
- `S3_PRESIGN_EXPIRES_SECONDS`

Note:

- keep current `jwtSecret`, `mongoUri`, and `mongoDb`
- do not expose AWS credentials to frontend

### 2. Add S3 helper module

Create:

- `be/src/modules/receipts/receipts.storage.ts`

Responsibilities:

- create `S3Client`
- generate a safe S3 object key
- create a presigned PUT URL
- optionally create a presigned GET URL later for admin preview

Suggested key format:

`receipts/{userId}/{yyyy}/{mm}/{timestamp}-{sanitized-file-name}`

This helps with debugging, bucket organization, and future retention rules.

### 3. Split current upload endpoint into two explicit APIs

Current route:

- `POST /api/receipts/upload`

Recommended replacement:

- `POST /api/receipts/presign`
- `POST /api/receipts`

Keep:

- `GET /api/receipts`
- `GET /api/receipts/:receiptId`

Optional compatibility path:

- keep `POST /api/receipts/upload` temporarily as a deprecated alias if the team wants a soft rollout

### 4. Add presign controller

In `be/src/modules/receipts/receipts.controller.ts`, add a handler like:

- `createReceiptPresignHandler`

Input:

- `originalFileName`
- `mimeType`
- `sizeInBytes`
- `groupId?`
- `expenseId?`

Validation rules should reuse current receipt logic:

- allowed mime types from `receipts.service.ts`
- max file size from `receipts.service.ts`
- if `groupId` is present, ensure the user belongs to the group
- if `expenseId` is present, ensure the expense is visible to the user
- if both are present, ensure the expense belongs to the group

Output:

- `uploadUrl`
- `objectKey`
- `storedFileName`
- `expiresIn`
- `headers`

### 5. Add finalize controller

In `be/src/modules/receipts/receipts.controller.ts`, add a handler like:

- `createReceiptRecordHandler`

Input:

- `groupId?`
- `expenseId?`
- `originalFileName`
- `storedFileName`
- `objectKey`
- `mimeType`
- `sizeInBytes`
- `currency?`

Behavior:

- revalidate metadata
- store the real storage location in MongoDB
- return `receipt`

This endpoint replaces the current fake upload record creation path.

### 6. Update routes

Change `be/src/modules/receipts/receipts.routes.ts` to:

- `GET /`
- `POST /presign`
- `POST /`
- `GET /:receiptId`

All remain behind `authMiddleware`.

### 7. Keep receipt model mostly intact

The current receipt record already fits the new design well.

Recommended mapping:

- `storedFileName` stays
- `storagePath` becomes the S3 object key

Recommended additions:

- `storageProvider: "s3"`
- `bucketName: string`

These fields are not strictly required for phase 1, but they make future migration and admin tooling easier.

If the team wants the smallest possible change set, phase 1 can keep the current schema and simply store:

- `storagePath = objectKey`
- `storedFileName = generated S3 file name`

## Frontend Changes

### 1. Update receipts API client

Replace the current single upload call in:

- `src/web/api/receipts/receipts.api.ts`

New client functions:

- `getReceipts()`
- `getReceipt(receiptId)`
- `createReceiptPresign(payload)`
- `createReceiptRecord(payload)`

Remove or stop using:

- `uploadReceipt(payload)`

### 2. Update receipt types

In:

- `src/web/api/receipts/receipts.types.ts`

Add request and response types for:

- `CreateReceiptPresignPayload`
- `CreateReceiptPresignResponse`
- `CreateReceiptRecordPayload`

### 3. Update ReceiptsPage

In:

- `src/web/components/ReceiptsPage.tsx`

Replace `handleUploadFile(...)` with:

1. client-side size/type check
2. call `createReceiptPresign(...)`
3. upload the file to S3 with `fetch`
4. call `createReceiptRecord(...)`
5. update local state

Client-side validation should match backend:

- only `image/jpeg`, `image/png`, `application/pdf`
- max 10MB in phase 1

### 4. Update expense creation flow

In:

- `src/web/components/ExpensesPage.tsx`
- `src/web/components/GroupDetailPage.tsx`

Replace the current receipt upload block with the same new helper flow:

- presign
- S3 upload
- create receipt record
- capture `receiptId`
- call `createExpense(...)`

`AddExpenseModal.tsx` does not need major structural changes because it already passes `receiptFile` to parent handlers.

### 5. Add a shared frontend helper

Create:

- `src/web/api/receipts/receipts.upload.ts`

Suggested exported helper:

- `uploadReceiptFile(params): Promise<ReceiptUpload>`

This avoids duplicating the same `presign -> PUT -> finalize` logic across:

- `ReceiptsPage.tsx`
- `ExpensesPage.tsx`
- `GroupDetailPage.tsx`

## Admin Impact

The admin flow should continue to work with little or no UI change because it already reads receipt records from MongoDB.

Current consumers:

- `src/web/components/AdminPage.tsx`
- `be/src/modules/admin/admin.service.ts`

What changes:

- upload records now point to real S3-backed files

What stays the same:

- admin uploads tab still lists receipts from MongoDB
- admin rejected tab still uses `reviewStatus` and `processingStatus`
- admin activity still uses `receipt_uploaded`

Nice-to-have follow-up:

- add a backend endpoint to generate a short-lived presigned GET URL for admin preview
- add "View file" action in admin uploads table

## Data Model Recommendation

### Minimal change version

Keep current record shape and reinterpret:

- `storagePath` = S3 object key
- `storedFileName` = generated object file name

Pros:

- smallest code change
- admin code keeps working almost as-is

Cons:

- less explicit storage semantics

### Preferred version

Extend the receipt document with:

- `storageProvider: "s3"`
- `bucketName: string`
- `objectKey: string`
- `etag?: string | null`

Pros:

- clearer design
- easier admin preview and future migrations

Cons:

- touches more types and mapping code

Recommendation for this project:

- phase 1: minimal change version
- phase 2: explicit S3 storage fields if the team wants cleaner storage metadata

## API Contracts

### POST /api/receipts/presign

Request:

```json
{
  "originalFileName": "receipt-may.pdf",
  "mimeType": "application/pdf",
  "sizeInBytes": 248120,
  "groupId": "6855...",
  "expenseId": "6856..."
}
```

Response:

```json
{
  "ok": true,
  "message": "Receipt upload URL created successfully.",
  "uploadUrl": "https://...",
  "objectKey": "receipts/user/2026/06/1718950000-receipt-may.pdf",
  "storedFileName": "1718950000-receipt-may.pdf",
  "expiresIn": 300,
  "headers": {
    "Content-Type": "application/pdf"
  }
}
```

### POST /api/receipts

Request:

```json
{
  "groupId": "6855...",
  "expenseId": "6856...",
  "originalFileName": "receipt-may.pdf",
  "storedFileName": "1718950000-receipt-may.pdf",
  "storagePath": "receipts/user/2026/06/1718950000-receipt-may.pdf",
  "mimeType": "application/pdf",
  "sizeInBytes": 248120
}
```

Response:

```json
{
  "ok": true,
  "message": "Receipt created successfully.",
  "receipt": {
    "id": "...",
    "groupId": "...",
    "expenseId": "...",
    "originalFileName": "receipt-may.pdf",
    "storedFileName": "1718950000-receipt-may.pdf",
    "storagePath": "receipts/user/2026/06/1718950000-receipt-may.pdf",
    "mimeType": "application/pdf",
    "fileKind": "pdf",
    "sizeInBytes": 248120,
    "processingStatus": "pending",
    "reviewStatus": "pending",
    "ocrStatus": "pending",
    "createdAt": "2026-06-21T00:00:00.000Z",
    "updatedAt": "2026-06-21T00:00:00.000Z"
  }
}
```

## Validation Rules

Keep and reuse the current rules from `be/src/modules/receipts/receipts.service.ts`:

- max size 10MB for phase 1
- allowed mime types:
  - `image/jpeg`
  - `image/png`
  - `application/pdf`
- allowed currencies:
  - `USD`
  - `VND`

Also add frontend prechecks so users fail fast before requesting a presigned URL.

## S3 Bucket Rules

Recommended defaults:

- private bucket
- object ownership enforced
- public access blocked
- CORS enabled only for your frontend origins

Recommended CORS methods:

- `PUT`
- `GET`
- `HEAD`

Recommended allowed headers:

- `Content-Type`

If the project later uses custom metadata or checksums, the CORS rule can be expanded.

## Rollout Plan

### Phase 1: Real upload with minimal schema change

- add AWS env config
- add S3 helper
- add `POST /api/receipts/presign`
- add `POST /api/receipts`
- update frontend receipt upload flow
- keep Mongo receipt schema almost unchanged
- keep 10MB limit

This is the recommended first release.

### Phase 2: Better storage metadata and preview

- add `bucketName`, `storageProvider`, `objectKey`
- add admin "View file" action
- add presigned GET endpoint for secure preview

### Phase 3: Large file support

- introduce multipart upload for larger files
- optionally lift the 10MB limit
- add retry and resume support if needed

This phase is only needed if the product truly starts receiving larger PDFs or scans.

## Risks And Mitigations

- Risk: S3 CORS misconfiguration blocks browser upload
  - Mitigation: test with dev origin first and keep the rule minimal

- Risk: frontend says upload succeeded but finalize step fails
  - Mitigation: show clear toast, and optionally schedule cleanup of orphaned S3 objects later

- Risk: duplicate upload logic across pages
  - Mitigation: create shared helper `receipts.upload.ts`

- Risk: object key collisions
  - Mitigation: include timestamp and user id in generated key

- Risk: exposing bucket files publicly
  - Mitigation: keep bucket private and use presigned GET for viewing

## File-Level Change List

Backend files to update:

- `be/package.json`
- `be/src/config/env.ts`
- `be/src/modules/receipts/receipts.routes.ts`
- `be/src/modules/receipts/receipts.controller.ts`
- `be/src/modules/receipts/receipts.service.ts`

Backend files to add:

- `be/src/modules/receipts/receipts.storage.ts`

Frontend files to update:

- `src/web/api/receipts/receipts.api.ts`
- `src/web/api/receipts/receipts.types.ts`
- `src/web/components/ReceiptsPage.tsx`
- `src/web/components/ExpensesPage.tsx`
- `src/web/components/GroupDetailPage.tsx`

Frontend files to add:

- `src/web/api/receipts/receipts.upload.ts`

Optional follow-up files:

- `src/web/components/AdminPage.tsx`
- `be/src/modules/admin/admin.service.ts`

## Suggested Implementation Order

1. Add backend env and S3 helper
2. Add `POST /api/receipts/presign`
3. Add `POST /api/receipts`
4. Refactor frontend receipt API client
5. Refactor `ReceiptsPage.tsx`
6. Refactor `ExpensesPage.tsx`
7. Refactor `GroupDetailPage.tsx`
8. Run manual end-to-end test
9. Add admin preview as a follow-up

## Definition Of Done

The S3 migration is complete when:

- selecting a receipt uploads real file bytes to S3
- a Mongo receipt record is created only after successful upload
- `receiptId` continues to link receipts to expenses
- receipts still appear in user receipt list
- admin uploads tab still shows new receipts
- admin activity still shows `receipt_uploaded`
- invalid files are blocked consistently in frontend and backend

