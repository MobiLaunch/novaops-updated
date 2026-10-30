import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Select } from "@/components/arc/select/select";
import { Switch } from "@/components/arc/switch/switch";
import { Textarea } from "@/components/arc/textarea/textarea";
import { toast } from "@/hooks/useToast";
import defaults from "@/lib/siteDefaults.json";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

const CONFIG_ID = "mobicare-config";

const SECTIONS: { key: keyof typeof defaults; label: string; hint: string }[] = [
  { key: "brand", label: "Brand", hint: "Business name, sub label and tagline in the header and footer." },
  { key: "hero", label: "Homepage hero", hint: "The banner at the top of the homepage." },
  { key: "heroPoints", label: "Hero highlights", hint: "The three small badges under the hero buttons." },
  { key: "trustItems", label: "Trust bar", hint: "The highlights strip under the hero." },
  { key: "howItWorks", label: "How it works", hint: "Three steps further down the homepage." },
  { key: "ctaStrip", label: "Call to action", hint: "The banner near the bottom of the homepage." },
  { key: "repairBanner", label: "Repairs page intro", hint: "Heading and intro on the Repairs page." },
  { key: "about", label: "About page", hint: "Your story." },
  { key: "business", label: "Business info", hint: "Contact details and opening hours." },
  { key: "footer", label: "Footer", hint: "Footer text, toggles and extra links." },
  { key: "social", label: "Social links", hint: "Leave blank to hide an icon." },
  { key: "seo", label: "SEO and analytics", hint: "Page titles, search description and tracking ids." },
  { key: "repairServices", label: "Repair services", hint: "The service cards on the homepage and in the booking form. Live per-model prices come from your POS price list." },
  { key: "houseCallPricing", label: "House call rates", hint: "Fallback rates, used only when your POS price list has no house call prices." },
  { key: "appearance", label: "Appearance", hint: "Colors, font, logo and light or dark mode. Leave a color empty to use the default." },
];

// Lists the shop can grow or shrink; every other list keeps its fixed length so the layout never breaks.
const GROWABLE = new Set(["hours", "extraLinks", "story", "repairServices", "variants"]);
const HIDDEN_ID = new Set(["id"]);

// Fields that are a choice, not free text.
const ENUMS: Record<string, { value: string; label: string }[]> = {
  colorScheme: [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }],
  logoType: [{ value: "icon", label: "Default icon and text" }, { value: "image", label: "Custom image" }],
  fontFamily: (defaults as any).__fonts.map((f: any) => ({ value: f.id, label: f.label })),
  icon: ["smartphone", "battery_full", "water_drop", "ev_station", "photo_camera", "storage"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
};
const LABELS: Record<string, string> = { badgeText: "Badge text", headlineLine1: "Headline line 1", headlineAccent: "Headline accent word", primaryCta: "Primary button", secondaryCta: "Secondary button", subLabel: "Sub label", desc: "Description", siteTitle: "Site title", googleAnalyticsId: "Google Analytics ID", facebookPixelId: "Facebook Pixel ID", ogImage: "Social preview image URL", copyrightName: "Copyright name", showHours: "Show business hours", showSocial: "Show social icons", twitter: "X / Twitter", logoUrl: "Logo URL", logoAlt: "Logo description", logoType: "Logo", bgBase: "Page background", bgSurface: "Card background", bgElevated: "Raised background", accentColor: "Accent color", accentColorDeep: "Accent color, deep shade", fontUrl: "Custom font URL", fontFamily: "Font", colorScheme: "Color scheme", priceRange: "Price range", residentialFirstHour: "Residential, first hour ($)", residentialAdditionalHourRate: "Residential, each extra hour ($)", commercialFirstHour: "Commercial, first hour ($)", commercialAdditionalHourRate: "Commercial, each extra hour ($)", href: "Link URL" };
const label = (k: string) => LABELS[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const isLong = (k: string, v: string) => v.length > 70 || /description|lead|body|story|headline$|subtext/i.test(k);
const clone = (v: Json) => JSON.parse(JSON.stringify(v));
const blankOf = (v: Json): Json => (Array.isArray(v) ? [] : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankOf(x)])) : typeof v === "boolean" ? false : typeof v === "number" ? 0 : "");

function ColorField({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);

  return (
    <div className="nv-actions" style={{ alignItems: "end", gap: 10 }}>
      <input aria-label={`${label(name)} swatch`} className="nv-swatch" type="color" value={valid ? value : "#12c887"} onChange={(e) => onChange(e.target.value)} />
      <div style={{ flex: 1 }}><Input description={valid ? undefined : "Using the default"} label={label(name)} maxLength={7} placeholder="#12c887" value={value} onChange={(e) => onChange(e.target.value)} /></div>
      {value && <Button size="sm" variant="ghost" onClick={() => onChange("")}>Use default</Button>}
    </div>
  );
}

function Field({ name, value, onChange }: { name: string; value: Json; onChange: (v: Json) => void }) {
  if (HIDDEN_ID.has(name)) return null;
  // Trust-bar icons use a different set of names and are not editable; only service icons are.
  if (name === "icon" && typeof value === "string" && !ENUMS.icon.some((o) => o.value === value)) return null;
  if (typeof value === "string" && ENUMS[name]) return <Select label={label(name)} options={ENUMS[name]} value={value} onValueChange={onChange} />;
  if (typeof value === "string" && /color|^bg[A-Z]/i.test(name)) return <ColorField name={name} value={value} onChange={onChange} />;
  if (typeof value === "boolean") {
    return (
      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <span>{label(name)}</span>
        <Switch aria-label={label(name)} checked={value} onCheckedChange={onChange} />
      </div>
    );
  }
  if (typeof value === "number") return <Input label={label(name)} type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />;
  if (typeof value === "string") {
    return isLong(name, value)
      ? <Textarea label={label(name)} rows={Math.min(8, Math.max(3, Math.ceil(value.length / 70)))} value={value} onChange={(e) => onChange(e.target.value)} />
      : <Input label={label(name)} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
  if (Array.isArray(value)) {
    const growable = GROWABLE.has(name);
    const sample = value[0] ?? "";

    return (
      <div style={{ display: "grid", gap: 10 }}>
        {(growable || typeof sample === "object") && <strong style={{ fontWeight: 500 }}>{label(name)}</strong>}
        {value.map((item: Json, i: number) => (
          <div key={i} className={typeof item === "object" ? "nv-panel" : undefined} style={{ display: "grid", gap: 10 }}>
            <div className="nv-actions" style={{ alignItems: "end" }}>
              <div style={{ flex: 1 }}>
                <Field name={typeof item === "object" ? `${label(name)} ${i + 1}` : `${label(name)} ${i + 1}`} value={item} onChange={(v) => onChange(value.map((x: Json, j: number) => (j === i ? v : x)))} />
              </div>
              {growable && <Button aria-label={`Remove ${label(name)} ${i + 1}`} size="sm" variant="ghost" onClick={() => onChange(value.filter((_: Json, j: number) => j !== i))}><Trash2 size={14} aria-hidden="true" /></Button>}
            </div>
          </div>
        ))}
        {growable && <div><Button size="sm" variant="secondary" onClick={() => onChange([...value, name === "repairServices" ? { ...blankOf(sample), id: `svc-${Date.now().toString(36)}`, icon: "smartphone" } : blankOf(sample)])}><Plus size={14} aria-hidden="true" />Add</Button></div>}
      </div>
    );
  }
  if (value && typeof value === "object") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {Object.entries(value).map(([k, v]) => <Field key={k} name={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />)}
      </div>
    );
  }

  return null;
}

/** Edits the website's content in place. Saved to the shared database, so the site updates on its next load. */
export function SiteEditor() {
  const [content, setContent] = useState<Record<string, Json>>({});
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState<string>(SECTIONS[0].key);
  const [draft, setDraft] = useState<Json>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const section = SECTIONS.find((s) => s.key === key)!;
  const base = useMemo(() => (defaults as Record<string, Json>)[key], [key]);

  const load = useCallback(async () => {
    const sb = getSupabase();

    if (!sb) return setLoading(false);
    const { data } = await sb.from("site_settings").select("content").eq("id", CONFIG_ID).maybeSingle();

    setContent((data?.content as Record<string, Json>) || {});
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Start from what the site shows now: saved content over the built-in defaults.
  useEffect(() => {
    const saved = content[key];

    setDraft(clone(Array.isArray(base) ? (saved ?? base) : { ...base, ...(saved || {}) }));
    setDirty(false);
  }, [key, content, base]);

  const save = async () => {
    const sb = getSupabase();

    if (!sb) return;
    setSaving(true);
    try {
      const { data: latest } = await sb.from("site_settings").select("content").eq("id", CONFIG_ID).maybeSingle();
      const next = { ...((latest?.content as Record<string, Json>) || {}), [key]: draft };
      const { error } = await sb.from("site_settings").upsert({ id: CONFIG_ID, content: next, updated_at: new Date().toISOString() });

      if (error) throw error;
      setContent(next);
      setDirty(false);
      toast.success(`${section.label} saved`, "The website shows it on its next page load.");
    } catch (e) {
      toast.danger("Couldn't save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nv-form" style={{ maxWidth: 760 }}>
      <Select label="Section" value={key} onValueChange={(v) => !dirty || window.confirm("Discard unsaved changes?") ? setKey(v) : undefined} options={SECTIONS.map((s) => ({ value: s.key, label: s.label }))} />
      <p className="nv-muted" style={{ margin: 0, fontSize: 14 }}>{section.hint}</p>

      {loading || draft === null ? <p className="nv-muted">Loading…</p> : (
        <div onChangeCapture={() => setDirty(true)} style={{ display: "grid", gap: 14 }}>
          <Field name={key} value={draft} onChange={(v) => { setDraft(v); setDirty(true); }} />
        </div>
      )}

      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <Button variant="ghost" onClick={() => { setDraft(clone(base)); setDirty(true); }}><RotateCcw size={14} aria-hidden="true" />Reset to defaults</Button>
        <Button disabled={!dirty} loading={saving} onClick={save}><Save size={14} aria-hidden="true" />Save {section.label.toLowerCase()}</Button>
      </div>
    </div>
  );
}
