import type { DeviceOption } from "@/lib/deviceCatalogue";

import { fetchDeviceCatalogue, searchDevices } from "@/lib/deviceCatalogue";

/**
 * Identify a device from a code scanned or typed at the counter.
 *
 * The picker in DevicePicker is a fallback, not the main path — when the
 * device is in hand its IMEI is ground truth, and reading it off the SIM
 * tray, the box, or `*#06#` on the customer's own phone is faster and more
 * accurate than narrowing a list by eye.
 *
 * Resolution runs server-side (api/trade-in/lookup.js, identify_only) since
 * the IMEI service is HTTP-only from the browser's point of view and the
 * resolver already existed there for trade-ins.
 */

export type IdentifyMethod = "imei" | "model_number" | "unknown";

export interface IdentifiedDevice {
  /** What was scanned; goes to tickets.serial_number whatever else happens. */
  code: string;
  method: IdentifyMethod;
  /** Catalogue-canonical "Apple Phone", when the model matched one. */
  device: string;
  /** Catalogue-canonical "iPhone 15 Pro Max", or the raw resolved model. */
  model: string;
  /** Set when the resolver answered but nothing in the catalogue matched. */
  offCatalogue: boolean;
  storage?: string;
}

/** IMEIs are 15 digits and carry a Luhn check digit. */
export function isImei(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");

  if (digits.length !== 15) return false;
  let sum = 0;

  for (let i = 0; i < 15; i++) {
    let d = Number(digits[i]);

    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }

  return sum % 10 === 0;
}

/**
 * Match a resolved "Apple / iPhone 15 Pro Max" onto the shared catalogue so a
 * scanned ticket spells the device exactly like a picked one. Two rounds of
 * work went into giving both apps one vocabulary; a lookup that bypassed it
 * would put a second spelling of the same phone back into the table.
 */
function reconcile(options: DeviceOption[], brand: string, model: string): DeviceOption | null {
  if (!model) return null;
  // Exact model match first, preferring one whose device type names the brand.
  const exact = options.filter((o) => o.model.toLowerCase() === model.toLowerCase());

  if (exact.length) {
    return exact.find((o) => o.deviceType.toLowerCase().startsWith(brand.toLowerCase())) ?? exact[0];
  }

  const hits = searchDevices(options, `${brand} ${model}`, 1);

  // Only trust a search hit that actually contains the resolved model name —
  // otherwise "Galaxy Q99" would quietly become the nearest Galaxy.
  return hits.length && hits[0].search.includes(model.toLowerCase()) ? hits[0] : null;
}

export async function identifyDevice(raw: string): Promise<IdentifiedDevice | { error: string }> {
  const code = raw.trim();

  if (!code) return { error: "Scan or type an IMEI or model number." };

  const body = isImei(code)
    ? { imei: code, identify_only: true }
    : { model_number: code, identify_only: true };

  let payload: {
    ok?: boolean;
    error?: string;
    resolved_brand?: string;
    resolved_model?: string;
    resolved_storage?: string;
    lookup_method?: string;
  };

  try {
    const res = await fetch("/api/trade-in/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    payload = await res.json();
  } catch {
    return { error: "Lookup service unreachable. Enter the device by hand." };
  }

  const method: IdentifyMethod =
    payload.lookup_method === "imei" || payload.lookup_method === "model_number"
      ? payload.lookup_method
      : "unknown";

  if (!payload.ok || method === "unknown") {
    return {
      error: isImei(code)
        ? "That IMEI is valid but the lookup service doesn't know it. Pick the device below — the number is still saved."
        : "Not a recognised IMEI or model number. Pick the device below — the code is still saved.",
    };
  }

  const brand = payload.resolved_brand || "";
  const model = payload.resolved_model || "";
  const match = reconcile(await fetchDeviceCatalogue(), brand, model);

  return {
    code,
    method,
    device: match?.deviceType || brand,
    model: match?.model || model,
    offCatalogue: !match,
    storage: payload.resolved_storage || undefined,
  };
}
