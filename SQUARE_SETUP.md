# Square Integration Setup

## Vercel Environment Variables

Add these three variables in your Vercel project dashboard under **Settings → Environment Variables**:

| Variable | Where to find it |
|---|---|
| `SQUARE_ACCESS_TOKEN` | Square Developer Dashboard → your app → Production Access Token |
| `SQUARE_APPLICATION_ID` | Square Developer Dashboard → your app → Application ID (starts with `sq0idp-`) |
| `SQUARE_LOCATION_ID` | Square Developer Dashboard → Locations → your location ID (starts with `L`) |

These are **server-only** and never exposed to the browser.

## App Settings (NovaOps → Settings page)

After deploying to Vercel:

1. Go to **Settings → Square Integration**
2. Click **Test Server Connection** — you should see your location name if the env vars are correct
3. Enter your **Terminal Device ID** (found in Square Dashboard → Devices → your Terminal → Device ID, starts with `device:`)
4. The Enable/Disable toggle activates Square in the POS

## Payment Flow

**With Device ID set:**
- Clicking "Charge Terminal" pushes the payment to your physical Square Terminal
- Customer taps/swipes/inserts on the terminal
- App polls every 2.5 seconds for completion
- If the terminal is offline, busy, or the customer cancels → automatically falls back to the browser card form

**Without Device ID (or as fallback):**
- Square's Web Payments SDK loads a card entry form in the browser
- Card is tokenized client-side, charged server-side via `/api/square/payment`

## Finding Your Terminal Device ID

1. Go to [Square Developer Dashboard](https://developer.squareup.com)
2. Navigate to **Sandbox/Production → Devices**
3. Find your Terminal and copy the **Device ID** (format: `device:XXXXXXXXXXXXXXXX`)

Alternatively, after connecting, you can call the Square Devices API:
```
GET https://connect.squareup.com/v2/devices
Authorization: Bearer YOUR_ACCESS_TOKEN
```
