# Gadget2Go — Deployment Guide (Vercel + Render + MongoDB Atlas)

This guide walks you through deploying the existing app **without code changes**
using only free tiers.

Stack recap:
- Frontend (React + CRACO)  →  **Vercel** (Free)
- Backend  (FastAPI)        →  **Render** Web Service (Free)
- Database (MongoDB)        →  **MongoDB Atlas** Free (M0)

---

## 0. Prerequisites

1. GitHub account with this repository pushed (use the **Save to Github** button in
   the Emergent chat to push the latest code, including the new files
   `render.yaml`, `vercel.json`, and `backend/runtime.txt`).
2. Accounts on: <https://cloud.mongodb.com>, <https://render.com>, <https://vercel.com>.

---

## 1. MongoDB Atlas (Free Tier)

1. Create a free **M0 cluster** in any region (e.g. AWS Singapore).
2. **Database Access**  →  Add a database user (username + strong password).
   Save these — you will need them.
3. **Network Access**  →  Add IP address `0.0.0.0/0` (Allow from anywhere)
   — required because Render's outbound IPs are not static on free tier.
4. **Connect** → **Drivers** → copy the **SRV connection string**, e.g.:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<user>` and `<password>` with the credentials from step 2.
   **Do NOT add a database name to the path** — the backend reads it from `DB_NAME`.

Keep this string handy as your `MONGO_URL`.

---

## 2. Backend on Render

### Option A — Blueprint (recommended, uses `render.yaml`)

1. Render dashboard → **New +** → **Blueprint** → select your repo.
2. Render detects `render.yaml` and shows the service `gadget2go-backend`.
3. It will ask you to fill in the `sync: false` env vars:
   - `MONGO_URL` = the Atlas SRV string from §1
   - `CORS_ORIGINS` = put `*` for now (we'll tighten this after Vercel deploy)
4. Click **Apply** → Render builds and deploys.
5. Once live, the service URL will look like
   `https://gadget2go-backend.onrender.com`.
   Test health: open `https://gadget2go-backend.onrender.com/api/`
   → should return `{"message":"Gadget2Go API","ok":true}`.

### Option B — Manual (no Blueprint)

1. Render dashboard → **New +** → **Web Service** → connect repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3 (it will read `runtime.txt` → 3.11.9)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free
3. Environment variables (Render → Environment tab):
   ```
   MONGO_URL      = <Atlas SRV string from §1>
   DB_NAME        = gadget2go
   CORS_ORIGINS   = *           # tighten after Vercel deploy
   PYTHON_VERSION = 3.11.9
   ```
4. **Create Web Service** → wait for first build (~5 min).

> Render free tier sleeps after 15 min of inactivity. First request after sleep
> takes ~30s to wake. This is expected.

---

## 3. Frontend on Vercel

1. Vercel dashboard → **Add New** → **Project** → import your repo.
2. **Configure Project** — Vercel will detect `vercel.json` at the repo root.
   - **Framework Preset:** *Other* (let `vercel.json` handle it)
   - **Root Directory:** leave as `./` (the `vercel.json` cd's into `frontend`)
3. Add Environment Variable:
   ```
   REACT_APP_BACKEND_URL = https://gadget2go-backend.onrender.com
   ```
   (Use the URL Render gave you in §2. **No trailing slash, no `/api`.**)
4. Click **Deploy**. First build takes ~3 min.
5. After deploy, your Vercel URL will look like `https://gadget2go-xxxx.vercel.app`.

---

## 4. Final CORS Lockdown

1. Go back to Render → your backend service → **Environment**.
2. Edit `CORS_ORIGINS` and set it to your Vercel URL (comma-separated if multiple):
   ```
   CORS_ORIGINS = https://gadget2go-xxxx.vercel.app,https://gadget2go-xxxx-yourname.vercel.app
   ```
   Include both the production domain and any preview/branch domains you use.
3. Click **Save Changes** → Render restarts the service automatically.

---

## 5. Verification Checklist

- [ ] `https://gadget2go-backend.onrender.com/api/` returns the JSON greeting.
- [ ] Visiting your Vercel URL loads the React app.
- [ ] Open the browser dev console — no CORS errors on network calls.
- [ ] Sign up / log in works (an admin seed user is created automatically the
      first time the backend talks to an empty Atlas DB).
  - Default seeded admin: `admin@g2g.app` / `admin123`
  - Default seeded user:  `aria@g2g.app` / `demo1234`

---

## 6. Things You Still Need to Configure Manually

The code is fully env-driven, so the **only** secrets you must enter by hand are:

| Where  | Variable                | Value                                       |
|--------|-------------------------|---------------------------------------------|
| Render | `MONGO_URL`             | Atlas SRV connection string                 |
| Render | `DB_NAME`               | `gadget2go` (or any name you prefer)        |
| Render | `CORS_ORIGINS`          | Your Vercel URL(s), comma-separated         |
| Vercel | `REACT_APP_BACKEND_URL` | Your Render backend URL (no trailing slash) |

No secrets are committed to the repo (`.env` is git-ignored).

---

## 7. Troubleshooting

**Backend build fails on Render**
- Confirm `backend/runtime.txt` contains `python-3.11.9`.
- Check the build log — if `bcrypt` or `cryptography` fail to compile, Render's
  Python 3.11 image already includes the needed system libs; just retry.

**Frontend build fails on Vercel with "command not found: yarn"**
- Vercel includes yarn classic by default. If you set a custom Node version
  below 16, switch back to Node 18 or 20 in *Project Settings → General*.

**CORS error in browser console**
- Ensure `CORS_ORIGINS` on Render exactly matches the Vercel URL
  (`https://`, no trailing slash). After editing, wait ~30s for Render to restart.

**WebSocket (chat real-time) doesn't connect**
- Render's free tier supports WebSockets. The frontend builds the WS URL from
  `REACT_APP_BACKEND_URL`, so make sure that env var was set **before** the
  Vercel build (env vars added afterwards require a Redeploy).

**MongoDB connection timeouts**
- In Atlas → Network Access → confirm `0.0.0.0/0` is allowed.
- Double-check the SRV string has the password URL-encoded if it contains
  special characters (`@`, `:`, `/`, etc.).

**500 on first request after long idle**
- Render free tier cold start. Wait 30s and retry. Consider a free uptime
  pinger (e.g. UptimeRobot) hitting `/api/` every 10 min to keep it warm.
