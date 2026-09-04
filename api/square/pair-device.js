import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

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
