# Deploying FitFlow to Vercel

FitFlow is a static, local-first web app. Vercel only serves the built files; all user data lives in each browser's IndexedDB.

## 1. What this project actually is

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 (`@vitejs/plugin-react`, Tailwind 4 via `@tailwindcss/vite`) |
| Package manager | npm (`package-lock.json`) |
| Build command | `npm run build` (runs `tsc -b && vite build`) |
| Output directory | `dist` |
| Router | **None.** The four tabs (Today, Calendar, Progress, Me) and the workout screens are React/Zustand state, not URLs. The app only ever uses `/`. |
| PWA | `vite-plugin-pwa`, `generateSW`, `registerType: 'autoUpdate'` |
| Database | Dexie 4 over IndexedDB, database name `fitflow` |
| Backend / auth / env vars | None |

Scripts in `package.json`: `dev`, `build`, `preview`, `lint`, `test`. There is no separate `typecheck` script; type checking is part of `build`.

## 2. Vercel project settings

```text
Framework Preset:  Vite
Build Command:     npm run build
Output Directory:  dist
Install Command:   npm install      (default; `npm ci` also works)
Node.js Version:   22.x (or 24.x)   — must be ≥ 20.19 / ≥ 22.12 (Vite 8 requirement)
Environment Vars:  none
Root Directory:    (repository root)
```

No `vercel.json` is needed or present (see §3).

## 3. Routing — why there is no `vercel.json`

There is no client-side router, so there are no deep links to rewrite. Refreshing always reloads `/`, which opens on Today. Paths such as `/calendar` or `/progress` are **not** app URLs; on Vercel they return 404, and nothing in the app links to them. The web manifest `start_url` and `scope` are both `/`.

If a router is ever added (e.g. React Router with real URLs), add this minimal fallback at that time:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## 4. PWA

Build output includes `dist/sw.js`, `dist/workbox-*.js`, `dist/registerSW.js`, `dist/manifest.webmanifest` and `dist/icon.svg`.

- The service worker precaches the app shell (`js, css, html, svg`, about 800 KiB). User data is not cached by it; it is in IndexedDB.
- `autoUpdate` activates a new service worker on the next load after a deploy, so users pick up new versions without manual cache clearing.
- The manifest uses one SVG icon (`sizes: any`). Chrome reports no installability or manifest errors.
- Vercel serves static files with `cache-control: public, max-age=0, must-revalidate`, so `sw.js` and `index.html` are revalidated on each load. No custom headers are required.
- **Known limitation:** iOS ignores SVG for `apple-touch-icon`, so "Add to Home Screen" on iPhone shows a generic icon/screenshot. Adding 180×180 and 512×512 PNG icons would fix this; it does not affect functionality.
- `start_url: '/'` means the app must be hosted at the domain root, not under a sub-path.

## 5. IndexedDB / Dexie — read this before deploying

- Data is stored **per browser, per device, per origin**. The Vercel site does not contain or receive any workout data.
- **Each origin has its own database.** Your local dev site (`localhost:5173`), the production domain, and every Vercel *preview* URL (`*-git-branch-*.vercel.app`) are all separate. Changing the production domain later also means a fresh, empty database.
- Clearing site data, using a private window, or some browsers' storage clean-up can delete the database.
- **To move data to production:** in the old origin open **Me → Data → Export Data**, then in the new origin **Me → Data → Import Data**. Photos are **not** included in the export.
- Schema versions 1–3 (`bodyPhotos` added in v3) upgrade in place; existing data is kept. On first ever load the exercise library is seeded and a default profile is created when first edited. These are intended production defaults, not test data.

## 6. Environment variables

None are required and none are used (`import.meta.env.DEV` is the only reference, used only to log errors in development). `.gitignore` now excludes `.env`, `.env.*` (except `.env.example`) and `.vercel`. Remember that anything in a `VITE_*` variable would be bundled into the public JavaScript and is **not** secret.

## 7. Deploying

1. Push the repository to GitHub.
2. In Vercel: **Add New → Project → import the repo**. Settings from §2 are detected automatically for a Vite project.
3. Deploy. Later pushes to the production branch redeploy automatically.

Before pushing, run locally:

```bash
npm run lint
npm test
npm run build
```

## 8. Known warnings (not blockers)

- **`Some chunks are larger than 500 kB`.** One JavaScript file of about 790 KB (about 225 KB gzipped). Most of it is Recharts, which only the Progress page uses. Future, optional optimisation: lazy-load the Progress page. Do not just raise `chunkSizeWarningLimit`.
- **`npm warn deprecated glob@11.1.0`** during install. Transitive dependency of the PWA plugin's build tooling; build-time only.

## 9. After deploying — manual checklist

Open the production URL on a phone and a desktop browser:

- [ ] Today loads with no console errors; date and "Plan My Week" (or today's workout) show.
- [ ] Me → set training days → Calendar → Plan week → Accept.
- [ ] Today → Start Workout → log two sets → the rest bar counts down → Next exercise → Finish.
- [ ] **Refresh** the browser: workout, weight, calories, sleep are still there.
- [ ] Calendar shows today as completed; tap the day and see the exercises.
- [ ] Today → ⋯ → **Reset today's workout** → Cancel does nothing; Reset returns the workout to "Start Workout" and leaves body/nutrition/recovery data alone.
- [ ] Progress shows your weight and strength.
- [ ] Me → Export Data downloads a JSON file; importing it back works.
- [ ] Go offline (DevTools → Network → Offline) and reload: the app still opens.
- [ ] Chrome/Edge show an install option; after installing, it opens standalone.
- [ ] `curl -I https://<your-domain>/sw.js` shows `cache-control` with `max-age=0` (or `must-revalidate`).
- [ ] After a second deploy, reload twice: the new version appears without clearing site data.

## 10. Backups

Because data never leaves the browser, **Export Data is the only backup**. Export regularly (and always before changing domains or clearing browser data). Photos must be saved separately from the export.
