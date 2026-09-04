import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

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
