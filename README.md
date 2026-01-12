# E-commerce Project

This repo contains a Vite + React frontend and a Node + Express backend using MySQL.

Quick local run

1. Start backend (set DB env vars):

```powershell
Set-Location -Path 'd:\ecommerce-project\backend'
# Populate these from your provider or use values in `.env` (don't commit secrets)
$env:DB_HOST='your-db-host'
$env:DB_PORT='your-db-port'
$env:DB_USER='your-db-user'
$env:DB_PASSWORD='your-db-password'
$env:DB_NAME='your-db-name'
npm install
npm run start
```

2. Start frontend:

```powershell
Set-Location -Path 'd:\ecommerce-project\frontend'
npm install
# Use Vite env for API endpoint if needed
$env:VITE_API_URL='http://localhost:8081'
npm run dev
```

Deploy to Render

1. Push this repo to GitHub.
2. In Render, create a Web Service for the backend using `backend` as the working directory, and set these Environment Variables:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (use your Aiven credentials)
3. Create a Static Site for the frontend (build command: `npm install && npm run build`, publish directory: `frontend/dist`). In Static Site settings, set an Environment Variable:
   - `VITE_API_URL` to your backend service URL (e.g., `https://ecommerce-backend.onrender.com`)
4. Wait for builds to finish and visit the provided URLs.

Notes
- The backend expects the `orders` table to use `total_price` and an `items` JSON column. The code includes a compatibility layer.
- E2E test script: `backend/tests/e2e.js` — it creates test data then deletes it.
