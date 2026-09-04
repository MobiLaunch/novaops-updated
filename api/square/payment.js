import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
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
