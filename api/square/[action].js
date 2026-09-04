import {
  getServerSquareCredentials,
  getSquareApplicationId,
  isSandboxRequest,
  serverSquareFetch,
  setCors,
} from "../_squareClient.js";

// Every /api/square/* endpoint in one dynamic route. Vercel's Hobby plan
// caps a deployment at 12 serverless functions; this used to be 11
// separate files. Consolidating to Vercel's [param] dynamic-route
// convention keeps every existing URL identical (the client in
// src/lib/square.ts never changes) while collapsing them into one function.

async function connectionTest(req, res) {
  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const data = await serverSquareFetch(`/locations/${locationId}`, accessToken);

    return res.status(200).json({ success: true, locationName: data.location?.name, status: "Connected" });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Connection failed" });
  }
}

async function customers(req, res) {
  try {
    const { accessToken } = getServerSquareCredentials(req);
    const data = await serverSquareFetch("/customers/search", accessToken, {
      method: "POST",
      body: { limit: 100, query: { sort: { field: "CREATED_AT", order: "DESC" } } },
    });

    const rows = (data.customers || []).map((c) => ({
      id: c.id,
      name: [c.given_name, c.family_name].filter(Boolean).join(" ") || "No Name",
      email: c.email_address || "",
      phone: c.phone_number || "",
      createdAt: c.created_at,
      note: c.note || "",
    }));

    return res.status(200).json({ success: true, customers: rows, count: rows.length });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch customers" });
  }
}

async function deviceStatus(req, res) {
  const { deviceCodeId } = req.query;

  try {
    const { accessToken } = getServerSquareCredentials(req);
    const data = await serverSquareFetch(`/devices/codes/${deviceCodeId}`, accessToken);

    return res.status(200).json({
      status: data.device_code?.status,
      deviceId: data.device_code?.device_id,
      pairingCode: data.device_code?.code,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to check device status" });
  }
}

async function orders(req, res) {
  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const days = parseInt(req.query.days, 10) || 30;
    const beginTime = new Date();

    beginTime.setDate(beginTime.getDate() - days);

    const data = await serverSquareFetch("/orders/search", accessToken, {
      method: "POST",
      body: {
        location_ids: [locationId],
        query: {
          filter: { date_time_filter: { created_at: { start_at: beginTime.toISOString() } } },
          sort: { sort_field: "CREATED_AT", sort_order: "DESC" },
        },
        limit: 100,
      },
    });

    const rows = (data.orders || []).map((o) => ({
      id: o.id,
      total: (o.total_money?.amount || 0) / 100,
      subtotal: (o.total_money?.amount || 0) / 100 - (o.total_tax_money?.amount || 0) / 100,
      tax: (o.total_tax_money?.amount || 0) / 100,
      discount: (o.total_discount_money?.amount || 0) / 100,
      tip: (o.total_tip_money?.amount || 0) / 100,
      state: o.state,
      lineItems: (o.line_items || []).map((li) => ({
        name: li.name,
        quantity: parseInt(li.quantity, 10) || 1,
        amount: (li.total_money?.amount || 0) / 100,
      })),
      createdAt: o.created_at,
      closedAt: o.closed_at || null,
    }));

    return res.status(200).json({ success: true, orders: rows, count: rows.length });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch orders" });
  }
}

async function pairDevice(req, res) {
  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const data = await serverSquareFetch("/devices/codes", accessToken, {
      method: "POST",
      body: {
        idempotency_key: `novaops-pair-${Date.now()}`,
        device_code: { product_type: "TERMINAL_API", location_id: locationId },
      },
    });

    return res.status(200).json({
      deviceCodeId: data.device_code?.id,
      pairingCode: data.device_code?.code,
      status: data.device_code?.status,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to generate pairing code" });
  }
}

async function paymentReadiness(req, res) {
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

async function payment(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sourceId, amountCents, referenceId, note } = req.body || {};

  if (!sourceId || !amountCents) {
    return res.status(400).json({ error: "Missing sourceId or amountCents" });
  }

  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const data = await serverSquareFetch("/payments", accessToken, {
      method: "POST",
      body: {
        source_id: sourceId,
        idempotency_key: `${referenceId || "novaops"}-${Date.now()}`,
        amount_money: { amount: amountCents, currency: "USD" },
        location_id: locationId,
        reference_id: referenceId || "novaops-pos",
        note: note || "NovaOps Sale",
      },
    });

    return res.status(200).json({ success: true, paymentId: data.payment?.id, status: data.payment?.status });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Payment failed" });
  }
}

async function payments(req, res) {
  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const days = parseInt(req.query.days, 10) || 30;
    const beginTime = new Date();

    beginTime.setDate(beginTime.getDate() - days);

    const data = await serverSquareFetch("/payments/search", accessToken, {
      method: "POST",
      body: {
        query: {
          filter: { location_ids: [locationId], created_at: { start_at: beginTime.toISOString() } },
          sort: { sort_field: "CREATED_AT", sort_order: "DESC" },
        },
        limit: 100,
      },
    });

    const rows = (data.payments || []).map((p) => ({
      id: p.id,
      amount: (p.amount_money?.amount || 0) / 100,
      currency: p.amount_money?.currency || "USD",
      tip: (p.tip_money?.amount || 0) / 100,
      fee: (p.processing_fee || []).reduce((a, f) => a + (f.amount_money?.amount || 0), 0) / 100,
      status: p.status,
      cardBrand: p.card_details?.card?.card_brand || null,
      lastFour: p.card_details?.card?.last_4 || null,
      receiptUrl: p.receipt_url || null,
      createdAt: p.created_at,
      orderId: p.order_id || null,
      referenceId: p.reference_id || null,
      note: p.note || "",
    }));

    return res.status(200).json({ success: true, payments: rows, count: rows.length });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch payments" });
  }
}

async function payouts(req, res) {
  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const days = parseInt(req.query.days, 10) || 90;
    const beginTime = new Date();

    beginTime.setDate(beginTime.getDate() - days);

    const data = await serverSquareFetch(
      `/payouts?location_id=${locationId}&begin_time=${beginTime.toISOString()}&sort_order=DESC&limit=50`,
      accessToken,
    );

    const rows = (data.payouts || []).map((p) => ({
      id: p.id,
      amount: (p.amount_money?.amount || 0) / 100,
      currency: p.amount_money?.currency || "USD",
      status: p.status,
      arrivalDate: p.arrival_date || null,
      createdAt: p.created_at,
      type: p.type || "BATCH",
    }));

    return res.status(200).json({ success: true, payouts: rows, count: rows.length });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch payouts" });
  }
}

async function terminalStatus(req, res) {
  const { checkoutId } = req.query;

  if (!checkoutId) return res.status(400).json({ error: "Missing checkoutId" });

  try {
    const { accessToken } = getServerSquareCredentials(req);
    const data = await serverSquareFetch(`/terminals/checkouts/${checkoutId}`, accessToken);

    return res.status(200).json({ status: data.checkout?.status, checkoutId: data.checkout?.id });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Status check failed" });
  }
}

async function terminal(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { amountCents, deviceId, referenceId, note } = req.body || {};

  if (!amountCents || !deviceId) {
    return res.status(400).json({ error: "Missing amountCents or deviceId" });
  }

  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const data = await serverSquareFetch("/terminals/checkouts", accessToken, {
      method: "POST",
      body: {
        idempotency_key: `${referenceId || "novaops"}-${Date.now()}`,
        checkout: {
          amount_money: { amount: amountCents, currency: "USD" },
          device_options: { device_id: deviceId, skip_receipt_screen: false, collect_signature: false },
          location_id: locationId,
          reference_id: referenceId || "novaops-pos",
          note: note || "NovaOps Sale",
          payment_type: "CARD_PRESENT",
        },
      },
    });

    return res.status(200).json({ success: true, checkoutId: data.checkout?.id, status: data.checkout?.status });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Terminal request failed" });
  }
}

const ACTIONS = {
  "connection-test": connectionTest,
  customers,
  "device-status": deviceStatus,
  orders,
  "pair-device": pairDevice,
  "payment-readiness": paymentReadiness,
  payment,
  payments,
  payouts,
  "terminal-status": terminalStatus,
  terminal,
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = ACTIONS[req.query.action];

  if (!action) return res.status(404).json({ error: `Unknown Square action "${req.query.action}"` });

  return action(req, res);
}
