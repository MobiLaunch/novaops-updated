// Thin client for the /api/square/* and /api/afterpay/* serverless
// functions (api/_squareClient.js). Credentials configured from the
// Settings page are sent as headers so a shop can use Square without env
// vars / a redeploy; when unset, the server falls back to its own env vars.

function squareHeaders(): Record<string, string> {
  const accessToken = localStorage.getItem("square_access_token") || "";
  const locationId = localStorage.getItem("square_location_id") || "";
  const applicationId = localStorage.getItem("square_application_id") || "";
  const sandbox = localStorage.getItem("square_sandbox") || "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (accessToken) headers["x-square-access-token"] = accessToken;
  if (locationId) headers["x-square-location-id"] = locationId;
  if (applicationId) headers["x-square-application-id"] = applicationId;
  if (sandbox) headers["x-square-sandbox"] = sandbox;

  return headers;
}

export function getSquareCredentials() {
  return {
    accessToken: localStorage.getItem("square_access_token") || "",
    locationId: localStorage.getItem("square_location_id") || "",
    applicationId: localStorage.getItem("square_application_id") || "",
    sandbox: localStorage.getItem("square_sandbox") === "true",
    deviceId: localStorage.getItem("square_device_id") || "",
  };
}

export function saveSquareCredentials(patch: Partial<ReturnType<typeof getSquareCredentials>>) {
  if (patch.accessToken !== undefined) localStorage.setItem("square_access_token", patch.accessToken);
  if (patch.locationId !== undefined) localStorage.setItem("square_location_id", patch.locationId);
  if (patch.applicationId !== undefined) localStorage.setItem("square_application_id", patch.applicationId);
  if (patch.sandbox !== undefined) localStorage.setItem("square_sandbox", String(patch.sandbox));
  if (patch.deviceId !== undefined) localStorage.setItem("square_device_id", patch.deviceId);
}

async function squareRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: squareHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();

  if (!res.ok) throw new Error(data?.error || "Square request failed");

  return data as T;
}

export interface PaymentReadiness {
  ok: boolean;
  sandbox: boolean;
  checks: { name: string; ok: boolean; detail: string }[];
}

export const testSquareConnection = () =>
  squareRequest<{ success: boolean; locationName: string; status: string }>("/api/square/connection-test");

export const checkPaymentReadiness = () => squareRequest<PaymentReadiness>("/api/square/payment-readiness");

export const pairSquareDevice = () =>
  squareRequest<{ deviceCodeId: string; pairingCode: string; status: string }>("/api/square/pair-device", { method: "POST" });

export const checkDeviceStatus = (deviceCodeId: string) =>
  squareRequest<{ status: string; deviceId?: string; pairingCode: string }>(`/api/square/device-status?deviceCodeId=${deviceCodeId}`);

export const chargeCard = (sourceId: string, amountCents: number, referenceId: string, note?: string) =>
  squareRequest<{ success: boolean; paymentId: string; status: string }>("/api/square/payment", {
    method: "POST",
    body: { sourceId, amountCents, referenceId, note },
  });

export const startTerminalCheckout = (amountCents: number, deviceId: string, referenceId: string, note?: string) =>
  squareRequest<{ success: boolean; checkoutId: string; status: string }>("/api/square/terminal", {
    method: "POST",
    body: { amountCents, deviceId, referenceId, note },
  });

export const getTerminalCheckoutStatus = (checkoutId: string) =>
  squareRequest<{ status: string; checkoutId: string }>(`/api/square/terminal-status?checkoutId=${checkoutId}`);

export const afterpayCheckout = (amountCents: number) =>
  squareRequest<{ status: string; token: string; redirectUrl: string; amount: number; message: string }>("/api/afterpay/checkout", {
    method: "POST",
    body: { amountCents },
  });

// ─── Accounting: real processor-side history (Accounting page) ─────────────
// These read what Square actually settled — independent of what NovaOps
// itself recorded — so Accounting can reconcile internal card/terminal
// totals against real deposits and processing fees.

export interface SquarePayment {
  id: string;
  amount: number;
  currency: string;
  tip: number;
  fee: number;
  status: string;
  cardBrand: string | null;
  lastFour: string | null;
  receiptUrl: string | null;
  createdAt: string;
  orderId: string | null;
  referenceId: string | null;
  note: string;
}

export interface SquarePayout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrivalDate: string | null;
  createdAt: string;
  type: string;
}

export const getSquarePayments = (days = 30) =>
  squareRequest<{ success: boolean; payments: SquarePayment[]; count: number }>(`/api/square/payments?days=${days}`);

export const getSquarePayouts = (days = 90) =>
  squareRequest<{ success: boolean; payouts: SquarePayout[]; count: number }>(`/api/square/payouts?days=${days}`);
