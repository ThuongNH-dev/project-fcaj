
  # Splitly

  ## Frontend

  Run `npm i` in the project root.

  Run `npm run dev` to start the Vite frontend.

  ## Backend and MongoDB

  The backend lives in `be/`.

  1. Run `npm i --prefix be`
  2. Create `be/.env`
  3. Set `MONGODB_URI` and `MONGODB_DB`
  4. Run `npm run backend`

  Open Swagger at `http://localhost:5000`

  Raw OpenAPI JSON is available at `http://localhost:5000/docs.json`

  Test the connection at `GET http://localhost:5000/health` and `GET http://localhost:5000/api/test`.
  
