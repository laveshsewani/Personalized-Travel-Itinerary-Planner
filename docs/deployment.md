# Production Deployment Guide & Post-Deploy Smoke-Test Checklist

## 1. Cloud Infrastructure Architecture

- **Frontend**: Hosted on [Vercel](https://vercel.com) as a Single Page Application (SPA).
- **Backend API**: Hosted on [Render](https://render.com) Web Service running FastAPI under Uvicorn.
- **Database & Auth**: [Supabase](https://supabase.com) PostgreSQL database with Row Level Security (RLS) policies and Supabase Auth.
- **LLM Gateway**: Groq Cloud (Llama-3 70B) or Together AI with graceful fallback to deterministic mock engine.

---

## 2. Production Environment Variables Reference

### Backend (Render Environment)
| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `PORT` | Yes | HTTP port Render binds to | Provided automatically by Render |
| `ENVIRONMENT` | Yes | App runtime stage | `production` |
| `CORS_ORIGINS` | Yes | Allowed client origins (comma-separated) | `https://your-app.vercel.app` |
| `SUPABASE_URL` | Yes | Project URL from Supabase dashboard | `https://xyzproject.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Public Anon Key | `eyJh...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Service-role administrative key | `eyJh...` |
| `LLM_PROVIDER` | Yes | Target LLM provider | `groq` (or `together`, `mock`) |
| `LLM_API_KEY` | Optional | API Key for Llama-3 inference | `gsk_...` |
| `LLM_MODEL` | Yes | Model ID | `llama3-70b-8192` |

### Frontend (Vercel Environment)
| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | Public URL of deployed backend on Render | `https://yatra-ai-backend.onrender.com` |
| `VITE_SUPABASE_URL` | Optional | Public Supabase project URL | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Optional | Public Supabase anonymous key | `eyJh...` |

---

## 3. Deployment Steps

### A. Supabase Setup
1. Create a new Supabase project at [https://database.new](https://database.new).
2. Open the **SQL Editor** in the Supabase dashboard.
3. Paste the contents of [`backend/db/schema.sql`](../backend/db/schema.sql) and click **Run**.
4. Verify the tables: `profiles`, `preferences`, `trips`, `trip_members`, `itinerary_days`, `itinerary_items`.
5. Under **Project Settings > API**, copy the `Project URL` and `anon public` key.

### B. Backend Deployment on Render
1. Create a new **Web Service** on [Render](https://dashboard.render.com).
2. Connect your GitHub repository.
3. Set **Root Directory**: `backend`
4. Set **Runtime**: `Python 3`
5. Set **Build Command**: `pip install -r requirements.txt`
6. Set **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
7. Add the environment variables listed in the table above.
8. Click **Deploy Web Service**.

### C. Frontend Deployment on Vercel
1. Import the Git repository in [Vercel](https://vercel.com/new).
2. Set **Root Directory**: `frontend`
3. Framework Preset: `Vite`
4. In **Environment Variables**, set:
   - `VITE_API_BASE_URL`: `https://<your-render-app>.onrender.com`
   - `VITE_SUPABASE_URL`: `<your-supabase-url>`
   - `VITE_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
5. Click **Deploy**.

---

## 4. Post-Deployment Smoke-Test Checklist

Verify the deployed application step-by-step:

- [ ] **1. Health Endpoint**:
  ```bash
  curl -I https://<your-backend-app>.onrender.com/health
  # Should return HTTP 200 OK with status: "healthy"
  ```
- [ ] **2. Swagger Docs**:
  Navigate to `https://<your-backend-app>.onrender.com/docs` and confirm all route schemas load.
- [ ] **3. CORS Verification**:
  Send a preflight request from the Vercel domain; verify `Access-Control-Allow-Origin` is present in headers.
- [ ] **4. Landing Page**:
  Visit `https://<your-vercel-app>.vercel.app`. Verify hero, typography, icons, and 3 scenario cards load.
- [ ] **5. Scenario Quick-Launch**:
  Click **Launch Plan** on the "Romantic Couple Vacation (Jaipur)" card. Confirm the wizard pre-populates Jaipur, ₹45,000 budget, and romantic style.
- [ ] **6. 5-Step Trip Builder**:
  Navigate step 1 to 5. Verify the ₹ budget slider formats amounts in Indian commas (`₹1,25,000`), destination autocomplete works, and interest chips toggle.
- [ ] **7. Itinerary Generation**:
  Click **Generate Itinerary Now**. Verify generation completes, redirects to `/trips/<id>`, and displays the multi-day timeline.
- [ ] **8. Interactive Map**:
  Verify Leaflet renders OpenStreetMap tiles with numbered markers corresponding to each activity of Day 1.
- [ ] **9. Activity Inline Edit & Reorder**:
  Click the Edit pencil on an activity card, modify title/cost, save, and verify instant update without page reload. Reorder items using arrow buttons.
- [ ] **10. Single-Day Regeneration**:
  Click **Regenerate this Day**, supply a custom prompt (e.g. "Add street food lunch"), submit, and confirm that only that day updates while other days remain intact.
- [ ] **11. Print / PDF Export**:
  Click **Print / PDF**; verify the browser print preview renders a clean, printer-friendly summary.
