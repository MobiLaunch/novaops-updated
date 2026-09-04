// Square API client — raw fetch, no SDK. Shared by every api/square/*
// serverless function (and the Afterpay-via-Square endpoint).
//
// Credentials, in priority order:
//   1. Per-request headers (x-square-access-token / x-square-location-id /
//      x-square-application-id / x-square-sandbox) — lets the Settings page
//      configure Square per-shop without a redeploy.
//   2. Environment variables (SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID,
//      SQUARE_APPLICATION_ID, SQUARE_SANDBOX).
//
// Leading underscore keeps Vercel from treating this file as its own route.

const SQUARE_VERSION = "2025-01-23";

export function getServerSquareCredentials(req) {
  const headerToken = req.headers["x-square-access-token"];
  const headerLocation = req.headers["x-square-location-id"];

  const accessToken = headerToken || process.env.SQUARE_ACCESS_TOKEN || "";
  const locationId = headerLocation || process.env.SQUARE_LOCATION_ID || "";

  if (!accessToken || !locationId) {
    throw new Error("Square credentials missing. Configure them in Settings or environment variables.");
  }

  return { accessToken, locationId };
}

export function getSquareApplicationId(req) {
  return (
    req.headers["x-square-application-id"] ||
    process.env.SQUARE_APPLICATION_ID ||
    ""
  );
}

export function isSandboxRequest(req, appId) {
  return (
    process.env.SQUARE_SANDBOX === "true" ||
    (appId || "").startsWith("sandbox-") ||
    req.headers["x-square-sandbox"] === "true"
  );
}

function getSquareBaseUrl(accessToken) {
  const appId = process.env.SQUARE_APPLICATION_ID || "";
  const sandbox =
    appId.startsWith("sandbox-") ||
    accessToken.toLowerCase().includes("sandbox") ||
    process.env.SQUARE_SANDBOX === "true";

  return sandbox ? "https://connect.squareupsandbox.com/v2" : "https://connect.squareup.com/v2";
}

export async function serverSquareFetch(path, accessToken, options = {}) {
  const baseUrl = getSquareBaseUrl(accessToken);

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": SQUARE_VERSION,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.errors?.[0]?.detail || data?.errors?.[0]?.code || "Square API error";

    throw new Error(msg);
  }

  return data;
}

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-square-access-token, x-square-location-id, x-square-application-id, x-square-sandbox",
  );
}
