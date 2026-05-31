# Deploying MarginBoard

Source stays on GitHub. Both halves auto-deploy on every push to the default
branch — that is the CI/CD: push, the platforms rebuild.

- **Frontend → Vercel** (Next.js)
- **Backend → Render** (Docker, free tier)

The full 94 MB Online Retail II CSV is not in git. A ~700 KB stratified sample
(`backend/data/sample/online_retail_II.csv`, ~8k rows spanning the full
2009–2011 range) is committed and baked into the backend image, so the
deployed app serves real — if smaller — numbers. Every page still works;
the totals are just lower than the full dataset.

---

## 1. Push to GitHub

```bash
git add .
git commit -m "Add deploy config (Render blueprint, sample dataset, Dockerfile fixes)"
git push origin master
```

`.github/workflows/` already runs lint + type check + tests + frontend build
on push — that gate is independent of the deploys below.

---

## 2. Backend on Render

The repo includes [`render.yaml`](../render.yaml), so Render can provision
everything from the blueprint.

1. Render dashboard → **New → Blueprint** → connect the GitHub repo.
2. Render reads `render.yaml` and proposes the `marginboard-api` service.
3. Set the env vars marked `sync: false` (they are intentionally not in the
   blueprint):
   - `CORS_ORIGINS` — leave blank for now; fill in after step 3 once the
     Vercel URL exists.
   - `ADMIN_TOKEN` — optional; only if you want `/api/admin/refresh` enabled.
4. Create. First build takes a few minutes (Docker image + deps). When the
   health check at `/health` passes, note the service URL, e.g.
   `https://marginboard-api.onrender.com`.

The blueprint already sets `RAW_DATA_DIR=/app/data/sample` so the backend uses
the committed sample, and `PREWARM_ON_STARTUP=true` to train artifacts on boot
(fast on the sample).

> **Free-tier behaviour.** The service sleeps after ~15 minutes idle. The next
> request wakes it, which means a cold start plus the startup prewarm — the
> first hit after idle can take 30–60s. Subsequent requests are fast. This is
> normal for a free service; mention it in the README demo link if you like.

---

## 3. Frontend on Vercel

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory:** `frontend`. Vercel auto-detects Next.js.
3. **Environment Variable:**
   - `NEXT_PUBLIC_API_URL` = `https://marginboard-api.onrender.com/api`
     (your Render URL + `/api`).
4. Deploy. Note the resulting URL, e.g. `https://marginboard.vercel.app`.

`NEXT_PUBLIC_*` is baked at build time, so if you change the API URL later you
must redeploy the frontend (a new push does this automatically).

---

## 4. Wire CORS back

Now that the Vercel URL exists, finish the loop:

1. Render → `marginboard-api` → Environment → set
   `CORS_ORIGINS = https://marginboard.vercel.app`
   (exact origin, **no trailing slash**; comma-separate if you add a custom
   domain later).
2. Save — Render redeploys automatically.

Open the Vercel URL. The dashboard should load live data from Render.

---

## CI/CD summary

| Trigger | What happens |
|---|---|
| Push to `master` | GitHub Actions runs lint / types / tests / FE build |
| Push touching `frontend/**` | Vercel rebuilds + redeploys the frontend |
| Push touching `backend/**` | Render rebuilds + redeploys the backend |

No manual deploy steps after the one-time setup above.

---

## Troubleshooting

- **Frontend loads but every page says "Failed to load data."** CORS origin
  mismatch, or `NEXT_PUBLIC_API_URL` is wrong / missing `/api`. Check the
  browser console for the blocked origin and confirm it matches
  `CORS_ORIGINS` exactly.
- **First request after idle hangs, then works.** Render free-tier cold start.
  Expected.
- **Backend build OOM or very slow.** You're probably pointing `RAW_DATA_DIR`
  at the full CSV. Keep it on `/app/data/sample` for the free tier — 512 MB RAM
  is not enough to train on 1M rows.
- **Want the full dataset in the demo.** Upgrade the Render instance RAM and
  attach a persistent disk holding the real CSV, then point `RAW_DATA_DIR` at
  it. Out of scope for the free tier.

---

## Alternative: Hugging Face Spaces for the backend

For an ML-focused portfolio, HF Spaces is a strong free alternative — **16 GB
RAM**, so it can train on the full dataset without OOM, and it Docker-deploys
the same `backend/Dockerfile`. Trade-off: it reads as an "ML demo" host rather
than a SaaS backend. Either choice is defensible; Render is used above because
it pairs cleanly with Vercel and keeps the SaaS framing.
