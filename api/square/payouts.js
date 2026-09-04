import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const days = parseInt(req.query.days, 10) || 90;
    const beginTime = new Date();

    beginTime.setDate(beginTime.getDate() - days);

    const data = await serverSquareFetch(
      `/payouts?location_id=${locationId}&begin_time=${beginTime.toISOString()}&sort_order=DESC&limit=50`,
      accessToken,
    );

    const payouts = (data.payouts || []).map((p) => ({
      id: p.id,
      amount: (p.amount_money?.amount || 0) / 100,
      currency: p.amount_money?.currency || "USD",
      status: p.status,
      arrivalDate: p.arrival_date || null,
      createdAt: p.created_at,
      type: p.type || "BATCH",
    }));

    return res.status(200).json({ success: true, payouts, count: payouts.length });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch payouts" });
  }
}
