import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

// Both /api/afterpay/* endpoints in one dynamic route — see
// api/square/[action].js for why (Vercel's Hobby-plan 12-function cap).

// Mocked Afterpay checkout-session creation — there's no live Afterpay
// merchant account wired up yet, so this simulates the REST round-trip
// (latency + a 95% approval rate) the same way the original Nuxt route did.
// Swap for a real Afterpay/Clearpay Merchant API call once credentials exist.
async function checkout(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};

  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (Math.random() > 0.95) {
    return res.status(402).json({ error: "Afterpay declined the transaction." });
  }

  const token = `afterpay-checkout-${Date.now()}`;

  return res.status(200).json({
    status: "APPROVED",
    token,
    redirectUrl: `https://portal.afterpay.com/checkout/?token=${token}`,
    amount: body.amountCents,
    message: "Afterpay checkout session created successfully.",
  });
}

// Processes the Afterpay credit token through Square's Payments API — Square
// tokenizes Afterpay/Clearpay the same way it tokenizes a card.
async function process(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sourceId, amountCents } = req.body || {};

  if (!sourceId || !amountCents) {
    return res.status(400).json({ error: "Missing sourceId or amountCents for Afterpay payment" });
  }

  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const data = await serverSquareFetch("/payments", accessToken, {
      method: "POST",
      body: {
        idempotency_key: `afterpay-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        source_id: sourceId,
        amount_money: { amount: amountCents, currency: "USD" },
        location_id: locationId,
        autocomplete: true,
        note: "NovaOps Afterpay POS Checkout",
      },
    });

    if (data.payment?.status === "COMPLETED") {
      return res.status(200).json({ success: true, paymentId: data.payment.id, status: data.payment.status });
    }

    return res.status(400).json({ error: `Afterpay transaction failed: ${data.payment?.status || "Unknown error"}` });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Afterpay payment request failed" });
  }
}

const ACTIONS = { checkout, process };

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = ACTIONS[req.query.action];

  if (!action) return res.status(404).json({ error: `Unknown Afterpay action "${req.query.action}"` });

  return action(req, res);
}
