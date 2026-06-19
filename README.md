
  # Splitly

  ## Frontend

  Run `npm i` in the project root.

  Run `npm run dev` to start the Vite frontend.

  ## Backend and MongoDB

  The backend lives in `be/`.

  1. Run `npm i --prefix be`
  2. Copy `be/.env.example` to `be/.env`
  3. Start MongoDB
  4. Run `npm run backend`

  Quick local MongoDB option with Docker:

  1. Run `npm run db:up`
  2. Run `npm run backend`

  Default local backend env:

  - `MONGODB_URI=mongodb://127.0.0.1:27017`
  - `MONGODB_DB=Splitly`

  Optional password reset email env:

  - `FRONTEND_URL=http://localhost:5173`
  - `EMAIL_FROM=Splitly <no-reply@yourdomain.com>`
  - `RESEND_API_KEY=your_resend_key`
  - `RESEND_API_URL=https://api.resend.com/emails`

  If `RESEND_API_KEY` is not set, password reset OTP codes and reset links are logged in the backend terminal for local development.

  Open Swagger at `http://localhost:5000`

  Raw OpenAPI JSON is available at `http://localhost:5000/docs.json`

  Test the connection at `GET http://localhost:5000/health` and `GET http://localhost:5000/api/test`.
  
