import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const data = await serverSquareFetch(`/locations/${locationId}`, accessToken);

    return res.status(200).json({ success: true, locationName: data.location?.name, status: "Connected" });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Connection failed" });
  }
}
