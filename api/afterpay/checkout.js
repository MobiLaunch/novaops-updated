import { setCors } from "../_squareClient.js";

// Mocked Afterpay checkout-session creation — there's no live Afterpay
// merchant account wired up yet, so this simulates the REST round-trip
// (latency + a 95% approval rate) the same way the original Nuxt route did.
// Swap for a real Afterpay/Clearpay Merchant API call once credentials exist.
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
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
