import { getSupabase } from "@/lib/supabase";

/** Non-secret storefront settings, shared with the website through the `site_settings` table. */
export interface ShopConfig {
  storefrontUrl: string;
  stripePublishableKey: string;
  /** Where happy customers are sent to leave a review, for example a Google review link. */
  reviewUrl: string;
  emailjs: { serviceId: string; bookingTemplate: string; orderTemplate: string; publicKey: string };
}

export const SHOP_CONFIG_ID = "shop-config";
export const DEFAULT_STOREFRONT = "https://www.shopmobicare.com";

export const emptyShopConfig = (): ShopConfig => ({
  storefrontUrl: DEFAULT_STOREFRONT,
  stripePublishableKey: "",
  reviewUrl: "",
  emailjs: { serviceId: "", bookingTemplate: "", orderTemplate: "", publicKey: "" },
});

export async function loadShopConfig(): Promise<ShopConfig> {
  const base = emptyShopConfig();
  const sb = getSupabase();

  if (!sb) return base;
  const { data } = await sb.from("site_settings").select("content").eq("id", SHOP_CONFIG_ID).maybeSingle();
  const c = (data?.content || {}) as Partial<ShopConfig>;

  return { ...base, ...c, emailjs: { ...base.emailjs, ...(c.emailjs || {}) } };
}

export async function saveShopConfig(config: ShopConfig): Promise<void> {
  const sb = getSupabase();

  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("site_settings").upsert({ id: SHOP_CONFIG_ID, content: config, updated_at: new Date().toISOString() });

  if (error) throw error;
}

/** Opens a page of the online shop in a new tab. */
export async function openStorefront(path = "/") {
  const { storefrontUrl } = await loadShopConfig();

  window.open(`${storefrontUrl}${path}`, "_blank", "noopener,noreferrer");
}
