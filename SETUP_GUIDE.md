# NovaOps — Complete Setup Guide

**Version 3.0 · Nuxt 3 + Supabase + Square**

---

## What is NovaOps?

NovaOps is a full-stack repair shop management system built with Nuxt 3, Supabase, and Tailwind CSS. It includes:

- **Tickets** — multi-step repair ticket creation, time tracking, photo uploads, signature capture
- **Customers** — CRM with history, driver's license, tags, and notes
- **POS** — Point of Sale with Square Terminal integration
- **Inventory** — parts & accessories with low-stock alerts
- **Calendar** — appointments and house calls
- **Analytics** — revenue, P&L, service breakdown charts
- **Forms** — printable invoices and estimates
- **Brand Manager** — Facebook, Instagram, Google Business, Yelp social connections
- **Messages** — customer email threading UI
- **Barcodes** — scan and label generation
- **Reports** — exportable business reports
- **Screen Lock** — PIN-protected auto-lock after inactivity

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18 LTS or 20 LTS |
| npm | 9+ |
| Supabase account | Free tier is sufficient |
| Square Developer account | Optional — only for card payments |

---

## 1. Clone / Extract the Project

```bash
unzip novaops-fixed-3.zip
cd novaops-fixed
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com) and sign up.
2. Click **New Project**, pick a region close to your customers.
3. Wait ~2 minutes for the project to boot.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NUXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NUXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` *(never expose this in the browser)*

---

## 4. Run the Database Migrations

Open the **Supabase SQL Editor** (`Database → SQL Editor → New Query`) and run each file in order:

### Step 4a — Core schema (required first)

Paste and run the contents of:
```
supabase/migrations/00000000_core_schema.sql
```

This creates `profiles`, `tickets`, `customers`, `inventory`, `house_calls`, and `appointments` tables, with:
- Row Level Security (RLS) policies — every row is scoped to its owner
- `updated_at` auto-triggers
- An `on_auth_user_created` trigger that auto-creates a `profiles` row on registration

### Step 4b — Brand Manager tables (optional, for social features)

```
supabase/migrations/20240101_brand_manager.sql
supabase/migrations/20240201_social_wiring.sql
```

### Step 4c — Enable Realtime

In the SQL editor run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE
  tickets, customers, inventory, house_calls, appointments;
```

Or enable via **Database → Replication → supabase_realtime** in the dashboard.

---

## 5. Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` and fill in **at minimum** the Supabase values:

```env
# Required
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Server-side only (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Optional — Square POS integration
SQUARE_ACCESS_TOKEN=EAAAl...
SQUARE_LOCATION_ID=L...
SQUARE_APPLICATION_ID=sq0idp-...

# Optional — social login buttons on login page
NUXT_PUBLIC_SOCIAL_GOOGLE=true
NUXT_PUBLIC_SOCIAL_FACEBOOK=true

# Optional — Brand Manager social OAuth
BRAND_OAUTH_REDIRECT_BASE=https://yourapp.vercel.app
FB_APP_ID=...
FB_APP_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The root `/` redirects to `/login`. Register a new account, complete profile setup (saves to Supabase), then you're taken to `/dashboard`.

---

## 7. First Login Flow

1. Visit `/register` → enter business name, email, password
2. Supabase creates the `auth.users` row and triggers `handle_new_user()` which creates the `profiles` row
3. You're redirected to `/profile-setup` to fill in business details → saved to Supabase
4. Redirected to `/dashboard`

For subsequent logins: `/login` → authenticated → `/dashboard`

---

## 8. Square POS Setup (Optional)

### Get credentials

1. Go to [https://developer.squareup.com](https://developer.squareup.com)
2. Create an application
3. Under **Credentials**, copy:
   - Access Token (Production or Sandbox)
   - Location ID
   - Application ID (for Web Payments SDK)

### Enter in NovaOps

1. Go to **Settings** → **Square Terminal Integration**
2. Enter your Access Token and Location ID
3. Toggle **Sandbox** mode if using test credentials
4. Click **Test Connection** to verify
5. Click **Save Credentials**

### Pair a Square Terminal

1. Go to **POS** page
2. Click **Square Setup** in the top-right
3. Click **Pair Terminal** — a 4-digit code appears
4. On your physical Square Terminal, go to **Settings → Connect** and enter the code
5. The device ID is stored in `localStorage` per browser session

---

## 9. Social / OAuth Login (Optional)

To enable **Sign in with Google** or **Sign in with Facebook** buttons:

1. In Supabase Dashboard → **Authentication → Providers** — enable Google and/or Facebook
2. Follow Supabase's provider setup docs to get OAuth credentials
3. Set in `.env`:
   ```env
   NUXT_PUBLIC_SOCIAL_GOOGLE=true
   NUXT_PUBLIC_SOCIAL_FACEBOOK=true
   ```

---

## 10. Brand Manager / Social Review Integration (Optional)

The Brand Manager allows connecting Facebook Pages, Instagram, Google Business Profile, and Yelp to:
- View reviews and comments in one inbox
- Reply to reviews (Google, Facebook)
- Schedule posts
- Auto-respond to reviews based on rating or keyword

### Setup per platform

Each platform requires registering a developer app and setting OAuth credentials in `.env`:

| Platform | Developer Console |
|----------|------------------|
| Facebook / Instagram | [developers.facebook.com](https://developers.facebook.com) |
| Google Business Profile | [console.cloud.google.com](https://console.cloud.google.com) |
| Yelp | [yelp.com/developers](https://www.yelp.com/developers) |

Set `BRAND_OAUTH_REDIRECT_BASE` to your deployed app URL (e.g. `https://yourshop.vercel.app`).

Register this redirect URI on each platform:
```
https://yourshop.vercel.app/api/brand/callback/{platform}
```
where `{platform}` is `facebook`, `instagram`, `google`, or `yelp`.

---

## 11. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect the repo to Vercel and set environment variables in:
**Vercel Dashboard → Project → Settings → Environment Variables**

The `nuxt.config.ts` auto-detects `VERCEL=1` and uses the Vercel Nitro preset.

---

## 12. Screen Lock PIN

The app auto-locks after **3 minutes of inactivity**. The default PIN is `1234`.

To change it: **Settings → Business Information → Screen Lock PIN**

---

## 13. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘T / Ctrl+T | New Ticket |
| ⌘H / Ctrl+H | Calendar |
| ⌘U / Ctrl+U | Customers |
| ⌘R / Ctrl+R | POS Register |
| ⌘I / Ctrl+I | New Invoice |
| ⌘B / Ctrl+B | Barcodes |
| ⌘D / Ctrl+D | Dashboard |
| ⌘, / Ctrl+, | Settings |

---

## 14. Data Export / Backup

Click the **Download** icon in the sidebar rail (bottom of the icon column) to export a full JSON backup of tickets, customers, inventory, and settings.

For database-level backups, use the Supabase Dashboard → **Database → Backups**.

---

## Architecture Overview

```
novaops/
├── pages/                 # Nuxt file-based routing
│   ├── index.vue          # Redirects → /login
│   ├── login.vue          # Email + social login
│   ├── register.vue       # Account creation
│   ├── profile-setup.vue  # First-login business profile
│   ├── dashboard.vue      # KPI overview
│   ├── tickets.vue        # Repair ticket list
│   ├── customers.vue      # Customer CRM
│   ├── pos.vue            # Point of Sale
│   ├── inventory.vue      # Stock management
│   ├── calendar.vue       # Appointments & house calls
│   ├── analytics.vue      # Revenue & P&L charts
│   ├── forms.vue          # Invoices & estimates
│   ├── reports.vue        # Business reports
│   ├── messages.vue       # Customer messaging
│   ├── services.vue       # Service catalog
│   ├── barcodes.vue       # Barcode scan & print
│   ├── import.vue         # Data import
│   ├── accounting.vue     # Expense tracking
│   ├── settings.vue       # All settings
│   ├── website-settings.vue  # Brand Manager / portal
│   ├── display.vue        # Customer-facing display
│   └── lock.vue           # Screen lock PIN entry
│
├── stores/
│   └── app.ts             # Pinia store — all CRUD + Supabase + Realtime
│
├── composables/
│   ├── useBrandManager.ts # Social platform OAuth & data
│   ├── useNotifications.ts # In-app notification state
│   ├── useScreenLock.ts   # Activity timer + lock redirect
│   ├── useWeather.ts      # Geolocation weather widget
│   └── useSupabaseStatus.ts
│
├── server/
│   ├── api/square/        # Square Terminal API proxy
│   └── routes/api/brand/  # Social OAuth callbacks & publish
│
├── supabase/migrations/   # SQL files to run in Supabase SQL Editor
│   ├── 00000000_core_schema.sql     ← Run FIRST
│   ├── 20240101_brand_manager.sql   ← Optional (social)
│   └── 20240201_social_wiring.sql   ← Optional (social)
│
├── plugins/
│   └── supabase.client.ts # Singleton Supabase client
│
├── middleware/
│   └── auth.ts            # Route guard — redirects unauthenticated users
│
└── layouts/
    ├── default.vue        # App shell with sidebar rail + drawers
    └── auth.vue           # Minimal layout for login/register
```

---

## Troubleshooting

### "Supabase not configured" warning on login

Your `.env` is missing or the variable names are wrong. Ensure:
```env
NUXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
Restart `npm run dev` after editing `.env`.

### Dashboard shows no data after login

1. Check the **Supabase Table Editor** — do your tables have rows?
2. Make sure the migrations ran and RLS policies are in place
3. Open browser DevTools → Network tab and look for failing Supabase API calls

### Square "Payment failed" on Terminal checkout

- Verify Square credentials in Settings and click **Test Connection**
- Make sure you're using Production credentials if testing with a real terminal
- The terminal must be powered on and connected to the internet

### Screen lock appears immediately

The PIN is incorrect. Default is `1234`. Change it in **Settings → Screen Lock PIN**.

### Realtime updates not appearing

Make sure Realtime is enabled for the tables. In Supabase SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE tickets, customers, inventory, house_calls, appointments;
```

---

## Bug Fixes in This Build (v3.0-patched)

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `pages/profile-setup.vue` | Saved data to `localStorage` instead of Supabase — profile was lost on other devices/sessions | Rewritten to `upsert` into `profiles` table via Supabase |
| 2 | `pages/pos.vue` | Early `return` in `completeSale()` when no Square terminal paired didn't reset `processing = true`, permanently disabling the checkout button | Added `processing.value = false` before the early return |
| 3 | `stores/app.ts` | Realtime `UPDATE` events replaced normalized camelCase records with raw snake_case from Supabase | Applied the same `normalizeTicket/Customer/Inventory/etc.` functions in the UPDATE branch |
| 4 | `stores/app.ts` | Realtime `DELETE` filter checked `old.profile_id` which can be absent in some Postgres configs, silently dropping deletes | Allowed DELETE events through when `profile_id` is absent (delete is safe — it no-ops if ID isn't found locally) |
| 5 | `stores/app.ts` | `createAppointment` didn't persist the `title` field | Added `title` to the insert payload |
| 6 | `composables/useNotifications.ts` | Used `localStorage` for notifications, contaminating state across user sessions on shared devices | Switched to pure in-memory `useState` with no localStorage dependency |
| 7 | `supabase/migrations/` | Missing core schema migration — `profiles`, `tickets`, `customers`, `inventory`, `house_calls`, `appointments` tables were not in any migration file | Added `00000000_core_schema.sql` with all tables, RLS policies, indexes, and `handle_new_user()` trigger |

---

*NovaOps v3.0 — Built with Nuxt 3, Supabase, Tailwind CSS, shadcn/ui*

---

## 15. Supabase Connection UI (No env vars required)

NovaOps now supports **connecting to Supabase without any `.env` file**. This is ideal for:
- Electron desktop builds where env vars can't be set per-user
- Distributing the app to non-technical shop owners
- Self-hosted deployments where each user brings their own Supabase project

### How it works

1. On first launch (no credentials), the **login page** shows a green "Connect your database first" banner
2. Click **"I have a project"** to open the connection modal
3. Paste the Supabase **Project URL** and **anon / public key** (found in Supabase Dashboard → Project Settings → API)
4. NovaOps tests the connection, stores credentials in `localStorage`, then reloads
5. On subsequent loads, the stored credentials are used automatically

You can also manage the connection from **Settings → Supabase Database** — change credentials or disconnect.

**Priority order**: env vars → localStorage credentials

---

## 16. Electron Desktop App

Run NovaOps as a native desktop app with a custom M3 Expressive titlebar.

### Development

```bash
npm install
npm run electron:dev
```

### What the custom titlebar includes

- **Left**: NovaOps branding (draggable drag region)
- **Center**: Current page name + icon pill (updates live with route changes)
- **Right**: Window control buttons — fullscreen, minimize, maximize/restore, close
  - Spring-scale hover animations
  - Color-coded: indigo (minimize), cyan (maximize), red (close)
  - Fullscreen: bar auto-hides, reappears on hover at screen top edge

### Production build

```bash
npm run electron:build       # Windows .exe
npm run electron:build:mac   # macOS .dmg
npm run electron:build:linux # Linux .AppImage
```

See `ELECTRON_SETUP.md` for full API documentation.
