Deployment guide — Frontend: Vercel, Backend: Render

Overview
- Frontend: Vite + React app (root of repository). Deploy to Vercel.
- Backend: Node/Express (in `backend/`). Deploy to Render as a Web Service.

What I changed
- Centralized runtime API URL helper: `src/utils/apiUrl.js`.
- Updated frontend components to use `apiUrl(...)` so production uses `VITE_API_URL`.
- Backend already supports `process.env.PORT` and includes `start` script.

Environment variables (set these in the Render / Vercel dashboards)

Backend (Render service envs)
- `MONGO_URI` : MongoDB connection string
- `JWT_SECRET` : JWT signing secret
- `GROQ_API_KEY` : (optional) GROQ key if used
- `OPENAI_API_KEY` : (optional) OpenAI key if used
- `PORT` : optional (Render provides this), leave unset or set to 5001 for local

Frontend (Vercel project envs)
- `VITE_API_URL` : Full backend URL, e.g. `https://your-backend-service.onrender.com` (no trailing slash)

Local development
1. Install deps for both projects:

   ```powershell
   npm install
   cd backend; npm install; cd ..
   ```

2. Run development servers (concurrently):

   ```powershell
   npm run backend:dev   # runs backend with nodemon on PORT=5001
   npm run dev           # runs Vite dev server
   ```

3. Vite dev server proxies `/api` to `http://localhost:5001` (see `vite.config.js`).

Production build & preview
1. Build frontend:
   ```powershell
   npm run build
   npm run preview
   ```

2. Start backend (production):
   ```powershell
   cd backend
   npm start
   ```

Deploying backend to Render (recommended)
1. Create a new Web Service on Render, connect your GitHub repo and select the `backend/` folder as the root.
2. Build Command: leave empty (no build step required) or `npm install`.
3. Start Command: `npm start` (this runs `node server.js` by default).
4. Add environment variables listed above in Render's dashboard.
5. Deploy — Render will provide a public URL like `https://your-app.onrender.com`.

Deploying frontend to Vercel
1. Create a new project on Vercel and point it to your repo root.
2. Vercel detects Vite and will run `npm run build` by default.
3. In Vercel project settings, add the environment variable `VITE_API_URL` with the Render URL (e.g. `https://your-app.onrender.com`).
4. Deploy.

Notes and troubleshooting
- Make sure the backend allows CORS (current backend uses `cors()` without origin restriction).
- If you limit CORS, add the Vercel domain to allowed origins.
- If using MongoDB Atlas, add Render's IP ranges or use SRV connection string.

Health-check endpoint
- The backend now exposes `GET /api/health` which returns a JSON payload indicating service readiness.
- Use it to verify your Render deployment quickly: `curl https://your-backend.onrender.com/api/health` should return `{ "success": true, "status": "ok", ... }`.

If you'd like, I can:
- Add a sample `render.yaml` for fully reproducible Render infra.
- Create a `vercel.json` with routes (not required for a standard Vite app).
