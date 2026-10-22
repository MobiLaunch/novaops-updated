# NovaOps

Repair shop management: tickets, customers, inventory, point of sale, bookings, analytics and printing. Built with React, Vite, [Arc UI](https://uiarc.dev), Supabase and Square.

## Stack

- React 19, TypeScript, Vite, react-router
- Arc UI components (vendored into `src/components/arc` with the shadcn CLI)
- Zustand for state, Supabase for auth, data and realtime
- Square Web Payments SDK for card and Afterpay, with a serverless proxy in `api/`
- PWA support through `vite-plugin-pwa`; Electron compatible (hash routing, `electronAPI` bridge)

## Getting started

```bash
npm install
cp .env.example .env     # fill in the Supabase values at minimum
npm run dev              # http://localhost:5173
```

The `api/` functions run on Vercel. Locally, use `vercel dev` if you need the Square and trade-in routes.

No environment variables? Open **Sign in → Database** and paste a Supabase project URL and anon key. They are stored in the browser.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src` |
| `npm run preview` | Serve the production build |

## Database

Run the SQL files in `supabase/migrations/` in order, starting with `00000000_core_schema.sql`. See `SETUP_GUIDE.md` for the full walkthrough, including Square, EmailJS and deployment.

## Working with Arc

Add components with the shadcn CLI:

```bash
npx shadcn@latest add @uiarc/<component>
```

Files land in `src/components/arc/<component>/`. Treat them as vendored source: build NovaOps UI by composing them in `src/components/app` and `src/pages`. Styling uses Arc's CSS variables (`--surface`, `--border`, `--accent`, `--space-*`, `--radius-*`); there is no Tailwind. Dark mode is `data-theme="dark"` on `<html>`.

See `AGENTS.md` for the design rules.
