import { useEffect, useState } from "react";
import { Save } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Switch } from "@/components/arc/switch/switch";
import { toast } from "@/hooks/useToast";
import { emptyShopConfig, loadShopConfig, saveShopConfig, type ShopConfig } from "@/lib/shopConfig";

/** Storefront integrations that used to live in each browser's local storage. */
export function ShopSettings() {
  const [cfg, setCfg] = useState<ShopConfig>(emptyShopConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadShopConfig().then((c) => { setCfg(c); setLoading(false); });
  }, []);

  const mail = (k: keyof ShopConfig["emailjs"]) => (e: React.ChangeEvent<HTMLInputElement>) => setCfg((c) => ({ ...c, emailjs: { ...c.emailjs, [k]: e.target.value } }));

  const save = async () => {
    const key = cfg.stripePublishableKey.trim();

    if (key && !key.startsWith("pk_")) return toast.warning("Check the Stripe key", 'Publishable keys start with "pk_".');
    setSaving(true);
    try {
      await saveShopConfig({ ...cfg, stripePublishableKey: key, reviewUrl: cfg.reviewUrl.trim(), storefrontUrl: cfg.storefrontUrl.trim().replace(/\/$/, "") });
      toast.success("Shop settings saved", "The website picks these up on its next page load.");
    } catch (e) {
      toast.danger("Couldn't save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nv-form" style={{ maxWidth: 720 }}>
      <Alert title="Saved once, used everywhere" tone="info">These settings live in the shared database, so they work from any computer. Secret keys (Stripe secret, service role) never go here. They stay in the hosting provider&apos;s environment variables.</Alert>

      <h3 className="nv-h3">Storefront</h3>
      <Input description="Used for refunds and links back to the shop." disabled={loading} label="Website address" value={cfg.storefrontUrl} onChange={(e) => setCfg((c) => ({ ...c, storefrontUrl: e.target.value }))} />

      <h3 className="nv-h3">Reviews</h3>
      <Input description="Paste your Google review link. Tickets that are done get an Ask for a review button that emails it to the customer." disabled={loading} label="Review link" placeholder="https://g.page/r/..." value={cfg.reviewUrl} onChange={(e) => setCfg((c) => ({ ...c, reviewUrl: e.target.value }))} />

      <h3 className="nv-h3">Loyalty points</h3>
      <div className="nv-row"><div className="nv-row-main"><strong>Reward repeat customers</strong><span>Customers earn points on register sales and can spend them as a discount.</span></div><Switch aria-label="Loyalty points" checked={cfg.loyalty.enabled} disabled={loading} onCheckedChange={(v: boolean) => setCfg((c) => ({ ...c, loyalty: { ...c.loyalty, enabled: v } }))} /></div>
      {cfg.loyalty.enabled && (
        <div className="nv-form-row">
          <Input description="Points earned per 1 spent" disabled={loading} label="Earn rate" min={0} step="0.1" type="number" value={cfg.loyalty.pointsPerDollar} onChange={(e) => setCfg((c) => ({ ...c, loyalty: { ...c.loyalty, pointsPerDollar: Math.max(0, Number(e.target.value)) } }))} />
          <Input description="Points needed for one reward" disabled={loading} label="Reward costs (points)" min={1} type="number" value={cfg.loyalty.redeemPoints} onChange={(e) => setCfg((c) => ({ ...c, loyalty: { ...c.loyalty, redeemPoints: Math.max(1, Math.round(Number(e.target.value))) } }))} />
          <Input description="Discount for one reward" disabled={loading} label="Reward is worth" min={0} step="0.5" type="number" value={cfg.loyalty.redeemValue} onChange={(e) => setCfg((c) => ({ ...c, loyalty: { ...c.loyalty, redeemValue: Math.max(0, Number(e.target.value)) } }))} />
        </div>
      )}

      <h3 className="nv-h3">Stripe</h3>
      <Input description="Starts with pk_live_ or pk_test_. Safe to store here; it is designed to be public." disabled={loading} label="Publishable key" value={cfg.stripePublishableKey} onChange={(e) => setCfg((c) => ({ ...c, stripePublishableKey: e.target.value }))} />

      <h3 className="nv-h3">EmailJS notifications</h3>
      <div className="nv-form-row">
        <Input disabled={loading} label="Service ID" value={cfg.emailjs.serviceId} onChange={mail("serviceId")} />
        <Input disabled={loading} label="Public key" value={cfg.emailjs.publicKey} onChange={mail("publicKey")} />
      </div>
      <div className="nv-form-row">
        <Input disabled={loading} label="Booking template ID" value={cfg.emailjs.bookingTemplate} onChange={mail("bookingTemplate")} />
        <Input disabled={loading} label="Order template ID" value={cfg.emailjs.orderTemplate} onChange={mail("orderTemplate")} />
      </div>

      <div><Button disabled={loading} loading={saving} onClick={save}><Save size={14} aria-hidden="true" />Save shop settings</Button></div>
    </div>
  );
}
