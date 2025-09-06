# Nimbus Weather

Beautiful, fast, mobile‑first weather app with animated backdrops, PWA install, and resilient data fetching. Built with React + Vite + Tailwind and an Express proxy.

## Features
- Mobile‑first UI, safe‑area insets, large touch targets
- Animated, condition‑aware backdrops (rain, snow, fog, thunder, day/night) with Reduce‑Motion support
- PWA: install to home screen, offline cache for static assets, theme colors
- Global search with geocoding and reverse‑geocoding
- Resilient networking: retries, timeouts, Open‑Meteo fallbacks when primary API fails
- Charts (temperature, precipitation, wind), hourly and daily forecasts

## Tech Stack
- React 18, Vite 7, TypeScript
- Tailwind CSS (+ shadcn UI primitives)
- Express 5 (API proxy, SPA fallback)
- Recharts, lucide-react icons

## Folder Structure
```
client/              # React app
  components/        # UI + weather components
  pages/             # Routes (Index, NotFound)
  lib/               # Weather fetching, utilities
  hooks/             # Hooks (mobile detection, toast)
  global.css         # Tailwind layers + animations
server/              # Express app (API + SPA fallback)
  routes/            # /api routes (weather proxy)
  node-build.ts      # Production server entry
public/              # PWA assets (sw.js, manifest)
```

## Environment Variables
- WEATHERAPI_KEY: WeatherAPI.com API key (recommended for production)
- NODE_VERSION: set to your Node version on hosts that support it (e.g., 22)

Notes:
- When `WEATHERAPI_KEY` is missing, the app falls back to Open‑Meteo (geocoding + forecast) so development continues to work.
- Never commit secrets.

## Scripts
- dev: Vite dev server with Express middleware
- build: Builds SPA and server bundle
- start: Runs the production Node server from dist/
- test: Unit tests with Vitest

Use with npm:
```
npm install
npm run dev
```
…or pnpm (recommended by packageManager):
```
pnpm install
pnpm dev
```

## Local Development
1) Install deps (npm or pnpm)
2) Create a `.env` with `WEATHERAPI_KEY=xxxx` (optional; fallbacks exist)
3) `npm run dev` and open the printed URL

## Production Build
```
npm run build
npm start
```

## Deployment

### Render (Node Web Service)
- Build Command: `npm install --include=dev && npm run build`
- Start Command: `npm start`
- Environment: `WEATHERAPI_KEY=<your_key>`, `NODE_VERSION=22`
- The server auto‑serves the SPA from `dist/spa` and proxies `/api/weather/*`

### Netlify / Vercel
- Netlify/Vercel can build from the repo. Set `WEATHERAPI_KEY` in project settings.
- If hosting only the SPA without the Express server, point the client to your own proxy or remove `/api/*` usage and rely on Open‑Meteo only.

## PWA / Install
- Manifest: `/manifest.webmanifest`, Service Worker: `/sw.js`
- On Android (Chrome): Menu → Install app
- On iOS: Share → Add to Home Screen (no auto‑prompt per iOS policy)
- A header “Install app” button appears when `beforeinstallprompt` fires

## Accessibility & Performance
- Honors `prefers-reduced-motion`; animations reduce or disable accordingly
- Safe‑areas for notches, responsive charts
- Network timeouts + retries with exponential backoff

## Troubleshooting
- “Failed to fetch” in preview: check network tab; ensure Service Worker isn’t stale (unregister and hard‑refresh), confirm outbound to Open‑Meteo and/or set `WEATHERAPI_KEY`
- On Express v5, SPA fallback route uses a regex (already configured) to avoid `path-to-regexp` errors
- If dev dependencies aren’t installed on your host, set `NPM_CONFIG_PRODUCTION=false` or use the Render build command above

## License
MIT © 2025
