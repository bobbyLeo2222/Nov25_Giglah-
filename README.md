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

If you use the email / Cloudinary / Google features, also set the corresponding variables from `server/.env` in DigitalOcean (do not commit secrets).
