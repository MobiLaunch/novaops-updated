import { type Event, getHeader, runtimeConfig } from "./nitro.js";

const SQUARE_VERSION = "2025-01-23";

/** Sandbox is chosen by Application ID prefix, the request header, the SQUARE_SANDBOX env var, or the token itself. */
function baseUrl(accessToken: string, event?: Event): string {
  const appId = (event && getHeader(event, "x-square-application-id")) || process.env.SQUARE_APPLICATION_ID || "";
  const sandbox =
    appId.startsWith("sandbox-") ||
    (event && getHeader(event, "x-square-sandbox") === "true") ||
    accessToken.toLowerCase().includes("sandbox") ||
    process.env.SQUARE_SANDBOX === "true";

  return sandbox ? "https://connect.squareupsandbox.com/v2" : "https://connect.squareup.com/v2";
}

/** Credentials come from request headers (saved in Settings), falling back to the function environment. */
export function getServerSquareCredentials(event?: Event) {
  const config = runtimeConfig();
  const accessToken = (event && getHeader(event, "x-square-access-token")) || config.squareAccessToken;
  const locationId = (event && getHeader(event, "x-square-location-id")) || config.squareLocationId;

  if (!accessToken || !locationId) throw new Error("Square credentials missing. Configure them in Settings or environment variables.");

  return { accessToken, locationId };
}

export async function serverSquareFetch(path: string, accessToken: string, options: { method?: string; body?: unknown; event?: Event } = {}) {
  const res = await fetch(`${baseUrl(accessToken, options.event)}${path}`, {
    method: options.method ?? "GET",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "Square-Version": SQUARE_VERSION },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();

  if (!res.ok) throw new Error(data?.errors?.[0]?.detail || data?.errors?.[0]?.code || "Square API error");

  return data;
}
