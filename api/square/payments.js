import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const days = parseInt(req.query.days, 10) || 30;
    const beginTime = new Date();

    beginTime.setDate(beginTime.getDate() - days);

    const data = await serverSquareFetch("/payments/search", accessToken, {
      method: "POST",
      body: {
        query: {
          filter: { location_ids: [locationId], created_at: { start_at: beginTime.toISOString() } },
          sort: { sort_field: "CREATED_AT", sort_order: "DESC" },
        },
        limit: 100,
      },
    });

    const payments = (data.payments || []).map((p) => ({
      id: p.id,
      amount: (p.amount_money?.amount || 0) / 100,
      currency: p.amount_money?.currency || "USD",
      tip: (p.tip_money?.amount || 0) / 100,
      fee: (p.processing_fee || []).reduce((a, f) => a + (f.amount_money?.amount || 0), 0) / 100,
      status: p.status,
      cardBrand: p.card_details?.card?.card_brand || null,
      lastFour: p.card_details?.card?.last_4 || null,
      receiptUrl: p.receipt_url || null,
      createdAt: p.created_at,
      orderId: p.order_id || null,
      referenceId: p.reference_id || null,
      note: p.note || "",
    }));

    return res.status(200).json({ success: true, payments, count: payments.length });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch payments" });
  }
}
