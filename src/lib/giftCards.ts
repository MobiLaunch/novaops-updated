import { getSupabase } from "@/lib/supabase";

export interface GiftCard { id: string; code: string; initial_amount: number; balance: number; status: string; customer_id: number | null; created_at: string }

const sb = () => {
  const c = getSupabase();

  if (!c) throw new Error("Not connected");

  return c;
};

export async function lookupGiftCard(code: string): Promise<GiftCard> {
  const { data, error } = await sb().from("gift_cards").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();

  if (error) throw error;
  if (!data || data.status !== "active") throw new Error("No active gift card with that code");
  if (Number(data.balance) <= 0) throw new Error("This card has no balance left");

  return { ...data, balance: Number(data.balance), initial_amount: Number(data.initial_amount) } as GiftCard;
}

export async function redeemGiftCard(code: string, amount: number, saleRef: string): Promise<number> {
  const { data, error } = await sb().rpc("redeem_gift_card", { p_code: code, p_amount: Math.round(amount * 100) / 100, p_sale_ref: saleRef });

  if (error) throw error;

  return Number(data);
}

export async function issueGiftCard(amount: number, customerId: number | null, saleRef: string): Promise<GiftCard> {
  const { data, error } = await sb().rpc("issue_gift_card", { p_amount: amount, p_customer_id: customerId, p_sale_ref: saleRef });

  if (error) throw error;

  return data as GiftCard;
}

export async function listGiftCards(): Promise<GiftCard[]> {
  const { data, error } = await sb().from("gift_cards").select("*").order("created_at", { ascending: false }).limit(200);

  if (error) throw error;

  return (data || []).map((r: any) => ({ ...r, balance: Number(r.balance), initial_amount: Number(r.initial_amount) }));
}
