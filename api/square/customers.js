import { getServerSquareCredentials, serverSquareFetch, setCors } from "../_squareClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { accessToken } = getServerSquareCredentials(req);
    const data = await serverSquareFetch("/customers/search", accessToken, {
      method: "POST",
      body: { limit: 100, query: { sort: { field: "CREATED_AT", order: "DESC" } } },
    });

    const customers = (data.customers || []).map((c) => ({
      id: c.id,
      name: [c.given_name, c.family_name].filter(Boolean).join(" ") || "No Name",
      email: c.email_address || "",
      phone: c.phone_number || "",
      createdAt: c.created_at,
      note: c.note || "",
    }));

    return res.status(200).json({ success: true, customers, count: customers.length });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch customers" });
  }
}
