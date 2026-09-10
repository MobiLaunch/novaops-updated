#!/usr/bin/env node
/**
 * Does the IMEI lookup actually work, and on how many of your devices?
 *
 * The ticket form's Scan IMEI field is only as good as its resolver, and that
 * resolver has never been exercised against real hardware — the development
 * sandbox's egress policy blocks imei.info outright, so every test there ran
 * against a stub. This runs it for real.
 *
 * Usage — grab five or six devices off the bench, dial *#06# on each:
 *
 *   node scripts/check-imei-lookup.mjs 3512...  3546...  3578...
 *   node scripts/check-imei-lookup.mjs --file imeis.txt
 *
 * By default it calls imei.info the same way the server does. To test the
 * whole deployed path instead — your Vercel function, its timeout, its
 * network — point it at the running site:
 *
 *   node scripts/check-imei-lookup.mjs --via https://your-site.vercel.app 3512...
 *
 * Nothing is written anywhere and no IMEI leaves this process except to the
 * service being tested.
 */

const args = process.argv.slice(2);
let via = null;
const imeis = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--via") via = args[++i];
  else if (args[i] === "--file") {
    const { readFileSync } = await import("node:fs");

    imeis.push(...readFileSync(args[++i], "utf8").split(/\s+/).filter(Boolean));
  } else imeis.push(args[i]);
}

if (!imeis.length) {
  console.error("Give it some IMEIs. See the header of this file for usage.");
  process.exit(1);
}

/** Same check the server runs: 15 digits, Luhn. */
function luhnOk(raw) {
  const d = raw.replace(/\D/g, "");

  if (d.length !== 15) return false;
  let sum = 0;

  for (let i = 0; i < 15; i++) {
    let n = Number(d[i]);

    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }

  return sum % 10 === 0;
}

/** Never print a customer's full IMEI to a terminal someone may screenshot. */
const mask = (s) => `${s.slice(0, 8)}•••${s.slice(-2)}`;

async function direct(imei) {
  const res = await fetch(`https://www.imei.info/api/?imei=${imei}&format=json`, {
    headers: { Accept: "application/json", "User-Agent": "NovaOps/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  const text = await res.text();
  let json = null;

  try {
    json = JSON.parse(text);
  } catch {
    return { http: res.status, kind: "non-JSON response", sample: text.slice(0, 90).replace(/\s+/g, " ") };
  }

  return {
    http: res.status,
    kind: json?.BrandName && json?.DeviceName ? "hit" : "no device in response",
    brand: json?.BrandName,
    model: json?.DeviceName,
    storage: json?.Storage,
    keys: Object.keys(json || {}).slice(0, 8).join(", "),
  };
}

async function viaDeployment(imei) {
  const res = await fetch(`${via.replace(/\/$/, "")}/api/trade-in/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imei, identify_only: true }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => null);

  return {
    http: res.status,
    kind: json?.resolved_model ? "hit" : json?.lookup_status || "no model returned",
    brand: json?.resolved_brand,
    model: json?.resolved_model,
    storage: json?.resolved_storage,
    keys: `lookup_status=${json?.lookup_status ?? "-"} method=${json?.lookup_method ?? "-"}`,
  };
}

console.log(via ? `Testing through ${via}\n` : "Testing imei.info directly\n");

const timings = [];
let hits = 0;
let checked = 0;

for (const raw of imeis) {
  const imei = raw.replace(/\D/g, "");

  if (!luhnOk(imei)) {
    console.log(`${mask(imei || raw)}  SKIPPED — not 15 digits with a valid check digit`);
    continue;
  }
  checked++;
  const started = Date.now();
  let out;

  try {
    out = await (via ? viaDeployment(imei) : direct(imei));
  } catch (err) {
    console.log(`${mask(imei)}  FAILED — ${err.name === "TimeoutError" ? "timed out" : err.message}`);
    continue;
  }
  const ms = Date.now() - started;

  timings.push(ms);

  if (out.kind === "hit") {
    hits++;
    console.log(`${mask(imei)}  ${String(ms).padStart(5)}ms  ${out.brand} — ${out.model}${out.storage ? ` (${out.storage})` : ""}`);
  } else {
    console.log(`${mask(imei)}  ${String(ms).padStart(5)}ms  MISS (http ${out.http}, ${out.kind})`);
    if (out.keys) console.log(`${" ".repeat(13)}fields: ${out.keys}`);
    if (out.sample) console.log(`${" ".repeat(13)}body:   ${out.sample}`);
  }
  // The free endpoint is rate limited; don't let the test be the reason it fails.
  await new Promise((r) => setTimeout(r, 1200));
}

timings.sort((a, b) => a - b);
const median = timings.length ? timings[Math.floor(timings.length / 2)] : 0;

console.log(`\n${hits}/${checked} identified${checked ? ` (${Math.round((hits / checked) * 100)}%)` : ""}, median ${median}ms`);

if (checked && hits / checked < 0.8) {
  console.log(
    "\nCoverage under 80%. imei.info's free endpoint is probably not a good\n" +
    "enough primary source — worth pricing a paid TAC API, or hosting a TAC\n" +
    "table and falling back to imei.info only for prefixes it doesn't have.",
  );
}
if (median > 3000) {
  console.log("\nMedian over 3s. The server gives up at 5s, so some scans will time out at the counter.");
}
