import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

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
