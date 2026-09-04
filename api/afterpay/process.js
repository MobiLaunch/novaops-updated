import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

// Processes the Afterpay credit token through Square's Payments API — Square
// tokenizes Afterpay/Clearpay the same way it tokenizes a card.
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
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
