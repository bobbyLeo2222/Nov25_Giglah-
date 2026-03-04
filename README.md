# GigLah

Full-stack app:
- Frontend: React + Vite (build output in `dist/`)
- Backend: Express API in `server/`

## Local development

```bash
npm install
npm run dev
```

## Production (DigitalOcean App Platform)

This repo is set up so a single Node service can serve both:
- API routes under `/api/*`
- The built frontend from `dist/` (including SPA fallback to `dist/index.html`)

Recommended App Platform settings:
- **Build Command:** `npm run build`
- **Run Command:** `npm start`

Minimum environment variables to set in DigitalOcean:
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN` (e.g. `https://your-app.ondigitalocean.app`)

Frontend API config:
- Do **not** set `VITE_API_BASE` to `http://localhost:5001` in production (that points to the end-user’s computer).
- If you host API + frontend on the same DigitalOcean app, leave `VITE_API_BASE` unset so the frontend uses the current site origin.

If you use the email / Cloudinary / Google features, also set the corresponding variables from `server/.env` in DigitalOcean (do not commit secrets).
