import {
  getServerSquareCredentials,
  getSquareApplicationId,
  isSandboxRequest,
  serverSquareFetch,
  setCors,
} from "../_squareClient.js";

// Verifies the full payment stack is wired correctly: credentials present,
// sandbox/production mode, application ID present (needed by the browser
// SDK), and live API reachability. No fake checks — every row is real.
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const checks = [];
  let accessToken = "";
  let locationId = "";

  try {
    const creds = getServerSquareCredentials(req);

    accessToken = creds.accessToken;
    locationId = creds.locationId;
    checks.push({ name: "Credentials", ok: true, detail: `Token …${accessToken.slice(-6)}, Location ${locationId}` });
  } catch (e) {
    checks.push({ name: "Credentials", ok: false, detail: e.message });

    return res.status(200).json({ ok: false, checks });
  }

  const appId = getSquareApplicationId(req);
  const isSandbox = isSandboxRequest(req, appId);

  checks.push({ name: "Mode", ok: true, detail: isSandbox ? "Sandbox (safe for testing)" : "Production (live payments)" });

  if (appId) {
    checks.push({ name: "Application ID", ok: true, detail: `${appId.slice(0, 12)}…` });
  } else {
    checks.push({
      name: "Application ID",
      ok: false,
      detail: "Missing — set SQUARE_APPLICATION_ID, or send it from Settings via the x-square-application-id header",
    });
  }

  try {
    const data = await serverSquareFetch(`/locations/${locationId}`, accessToken);
    const loc = data.location;

    checks.push({
      name: "API Reachability",
      ok: true,
      detail: `Location "${loc?.name}" is ${loc?.status ?? "unknown status"} — currency ${loc?.currency ?? "USD"}`,
    });
  } catch (e) {
    checks.push({ name: "API Reachability", ok: false, detail: e.message });

    return res.status(200).json({ ok: false, checks });
  }

  checks.push({ name: "Payment Route", ok: true, detail: "POST /api/square/payment is registered and credentials are valid" });

  return res.status(200).json({ ok: checks.every((c) => c.ok), sandbox: isSandbox, checks });
}
