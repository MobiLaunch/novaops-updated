import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { accessToken, locationId } = getServerSquareCredentials(req);
    const days = parseInt(req.query.days, 10) || 30;
    const beginTime = new Date();

    beginTime.setDate(beginTime.getDate() - days);

    const data = await serverSquareFetch("/orders/search", accessToken, {
      method: "POST",
      body: {
        location_ids: [locationId],
        query: {
          filter: { date_time_filter: { created_at: { start_at: beginTime.toISOString() } } },
          sort: { sort_field: "CREATED_AT", sort_order: "DESC" },
        },
        limit: 100,
      },
    });

    const orders = (data.orders || []).map((o) => ({
      id: o.id,
      total: (o.total_money?.amount || 0) / 100,
      subtotal: (o.total_money?.amount || 0) / 100 - (o.total_tax_money?.amount || 0) / 100,
      tax: (o.total_tax_money?.amount || 0) / 100,
      discount: (o.total_discount_money?.amount || 0) / 100,
      tip: (o.total_tip_money?.amount || 0) / 100,
      state: o.state,
      lineItems: (o.line_items || []).map((li) => ({
        name: li.name,
        quantity: parseInt(li.quantity, 10) || 1,
        amount: (li.total_money?.amount || 0) / 100,
      })),
      createdAt: o.created_at,
      closedAt: o.closed_at || null,
    }));

    return res.status(200).json({ success: true, orders, count: orders.length });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch orders" });
  }
}
