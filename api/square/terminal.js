import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
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
