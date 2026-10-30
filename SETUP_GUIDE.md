# NovaOps — Complete Setup Guide

**Version 6.0 · React + Arc UI + Supabase + Square**

---

## What is NovaOps?

NovaOps is a full-stack repair shop management system built with React, Vite, Arc UI, and Supabase. It includes:

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
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
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
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Server-side only (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Optional — Square POS integration
SQUARE_ACCESS_TOKEN=EAAAl...
SQUARE_LOCATION_ID=L...
SQUARE_APPLICATION_ID=sq0idp-...

# Optional — social login buttons on login page
VITE_SOCIAL_GOOGLE=true
VITE_SOCIAL_FACEBOOK=true

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
   VITE_SOCIAL_GOOGLE=true
   VITE_SOCIAL_FACEBOOK=true
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

Vercel detects the Vite project automatically. `vercel.json` rewrites every non-`/api` path to `index.html` for client-side routing, and the files in `api/` deploy as serverless functions.

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
├── src/
│   ├── main.tsx             # Entry: fonts, Arc tokens, global CSS
│   ├── App.tsx              # Router, auth gate, toast provider
│   ├── layouts/             # AppShell (sidebar, top bar, global dialogs), AuthLayout
│   ├── pages/               # Dashboard, Bookings, Customers, Inventory, POS, Library, Analytics, Tools, Settings, auth pages
│   ├── components/
│   │   ├── arc/             # Arc UI components (vendored by the shadcn CLI, do not edit)
│   │   ├── app/             # NovaOps dialogs and widgets built on Arc
│   │   └── tools/           # Barcodes, import/export and forms tabs
│   ├── hooks/               # Toasts, notifications, screen lock, Square data, weather, email
│   ├── lib/
│   │   ├── store.ts         # Zustand store: all CRUD, Supabase, realtime
│   │   ├── supabase.ts      # Singleton client (env vars or Settings-saved credentials)
│   │   └── print.ts         # Receipts, labels, house call sheets
│   └── styles/app.css       # Layout and page classes
│
├── api/                     # Vercel serverless functions (Square proxy, trade-in lookup, email)
├── supabase/migrations/     # SQL files to run in the Supabase SQL Editor
└── vite.config.ts           # Vite, PWA manifest, chunking
```

---

*NovaOps v6.0: built with React, Vite, Arc UI, Supabase and Square.*
