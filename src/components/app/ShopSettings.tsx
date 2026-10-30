import { useEffect, useState } from "react";
import { Save } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
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
      await saveShopConfig({ ...cfg, stripePublishableKey: key, storefrontUrl: cfg.storefrontUrl.trim().replace(/\/$/, "") });
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
