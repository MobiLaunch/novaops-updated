import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Select } from "@/components/arc/select/select";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { toast } from "@/hooks/useToast";
import defaults from "@/lib/siteDefaults.json";
import { loadShopConfig } from "@/lib/shopConfig";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const CONFIG_ID = "mobicare-config";
type Json = any;

const PALETTES: { id: string; label: string; values: Record<string, string> }[] = [
  { id: "default", label: "Mobicare green", values: { accentColor: "", accentColorDeep: "", bgBase: "", bgSurface: "", bgElevated: "" } },
  { id: "ocean", label: "Ocean", values: { accentColor: "#0ea5e9", accentColorDeep: "#0369a1", bgBase: "#f4f9fc", bgSurface: "#ffffff", bgElevated: "#e8f2f8" } },
  { id: "sunset", label: "Sunset", values: { accentColor: "#f97316", accentColorDeep: "#c2410c", bgBase: "#fff8f3", bgSurface: "#ffffff", bgElevated: "#ffeede" } },
  { id: "violet", label: "Violet", values: { accentColor: "#8b5cf6", accentColorDeep: "#6d28d9", bgBase: "#f8f6ff", bgSurface: "#ffffff", bgElevated: "#eee9ff" } },
  { id: "rose", label: "Rose", values: { accentColor: "#e11d48", accentColorDeep: "#9f1239", bgBase: "#fff6f8", bgSurface: "#ffffff", bgElevated: "#ffe6ec" } },
  { id: "gold", label: "Gold", values: { accentColor: "#ca8a04", accentColorDeep: "#854d0e", bgBase: "#fdfaf1", bgSurface: "#ffffff", bgElevated: "#f6efd8" } },
  { id: "slate", label: "Slate", values: { accentColor: "#334155", accentColorDeep: "#0f172a", bgBase: "#f6f7f9", bgSurface: "#ffffff", bgElevated: "#e9ecf1" } },
];
const COLOR_KEYS: [string, string][] = [["accentColor", "Accent"], ["accentColorDeep", "Accent (hover)"], ["bgBase", "Page background"], ["bgSurface", "Card background"], ["bgElevated", "Raised background"]];
const seg = (items: [string, string][]) => items.map(([value, label]) => ({ value, label }));

function Color({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (v: string) => void }) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);

  return (
    <div className="nv-colorrow">
      <input aria-label={`${label} swatch`} className="nv-swatch" name={name} type="color" value={valid ? value : "#12c887"} onChange={(e) => onChange(e.target.value)} />
      <div style={{ minWidth: 0 }}><Input label={label} maxLength={7} placeholder="Default" value={value} onChange={(e) => onChange(e.target.value)} /></div>
      {value && <Button size="sm" variant="ghost" onClick={() => onChange("")}>Reset</Button>}
    </div>
  );
}

/** Visual design controls for the storefront with a live preview. Unsaved changes preview instantly; Save publishes them. */
export function DesignStudio() {
  const [saved, setSaved] = useState<Record<string, Json>>({});
  const [appearance, setAppearance] = useState<Json>(null);
  const [hero, setHero] = useState<Json>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [site, setSite] = useState("");
  const [device, setDevice] = useState("phone");
  const frame = useRef<HTMLIFrameElement>(null);

  const load = useCallback(async () => {
    const sb = getSupabase();
    const cfg = await loadShopConfig();

    setSite(cfg.storefrontUrl.replace(/\/$/, ""));
    const { data } = (await sb?.from("site_settings").select("content").eq("id", CONFIG_ID).maybeSingle()) ?? { data: null };
    const content = (data?.content as Record<string, Json>) || {};

    setSaved(content);
    setAppearance({ ...(defaults as any).appearance, ...(content.appearance || {}) });
    setHero({ ...(defaults as any).hero, ...(content.hero || {}) });
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const send = useCallback(() => {
    if (!site || !frame.current?.contentWindow || !appearance) return;
    frame.current.contentWindow.postMessage({ source: "novaops-design", appearance, hero: { mediaType: hero?.mediaType, mediaUrl: hero?.mediaUrl, mediaPoster: hero?.mediaPoster, mediaDim: hero?.mediaDim } }, site);
  }, [site, appearance, hero]);

  // Push the draft to the preview on every change, and again shortly after load (the page fetches its saved design first).
  useEffect(() => {
    send();
    const t = [setTimeout(send, 800), setTimeout(send, 2500)];

    return () => t.forEach(clearTimeout);
  }, [send]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.origin === site && e.data?.source === "mobicare-site") send(); };

    window.addEventListener("message", onMsg);

    return () => window.removeEventListener("message", onMsg);
  }, [site, send]);

  const setA = (patch: Record<string, string>) => { setAppearance((a: Json) => ({ ...a, ...patch })); setDirty(true); };
  const setH = (patch: Record<string, Json>) => { setHero((h: Json) => ({ ...h, ...patch })); setDirty(true); };
  const activePalette = useMemo(() => PALETTES.find((p) => Object.entries(p.values).every(([k, v]) => (appearance?.[k] || "") === v))?.id, [appearance]);

  const save = async () => {
    const sb = getSupabase();

    if (!sb) return;
    setSaving(true);
    try {
      const { data: latest } = await sb.from("site_settings").select("content").eq("id", CONFIG_ID).maybeSingle();
      const base = (latest?.content as Record<string, Json>) || {};
      const next = { ...base, appearance: { ...(base.appearance || {}), ...appearance }, hero: { ...((defaults as any).hero), ...(base.hero || {}), mediaType: hero.mediaType, mediaUrl: hero.mediaUrl, mediaPoster: hero.mediaPoster, mediaDim: hero.mediaDim } };
      const { error } = await sb.from("site_settings").upsert({ id: CONFIG_ID, content: next, updated_at: new Date().toISOString() });

      if (error) throw error;
      setSaved(next);
      setDirty(false);
      toast.success("Design published", "The website shows it on its next page load.");
    } catch (e) {
      toast.danger("Couldn't save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !appearance || !hero) return <p className="nv-muted">Loading…</p>;
  const media = hero.mediaType || "none";

  return (
    <div className="nv-design">
      <div className="nv-design-controls nv-form">
        <section className="nv-stack">
          <strong>Color palette</strong>
          <div className="nv-palettes">
            {PALETTES.map((p) => (
              <button key={p.id} aria-pressed={activePalette === p.id} className="nv-palette" type="button" onClick={() => setA(p.values)}>
                <span style={{ background: p.values.accentColor || "#12c887" }} /><span style={{ background: p.values.accentColorDeep || "#0a8a5c" }} /><span style={{ background: p.values.bgBase || "#f2f7f1" }} />
                <em>{p.label}</em>
              </button>
            ))}
          </div>
          {COLOR_KEYS.map(([k, l]) => <Color key={k} label={l} name={k} value={appearance[k] || ""} onChange={(v) => setA({ [k]: v })} />)}
          <SegmentedControl label="Light or dark" value={appearance.colorScheme || "light"} onValueChange={(v: string) => setA({ colorScheme: v })} options={seg([["light", "Light"], ["dark", "Dark"]])} />
          <p className="nv-muted" style={{ margin: 0, fontSize: 13 }}>Background colors apply to light mode. Dark mode keeps its own backgrounds and uses your accent.</p>
        </section>

        <section className="nv-stack">
          <strong>Fonts</strong>
          <Select label="Typeface" value={appearance.fontFamily || "system"} onValueChange={(v: string) => setA({ fontFamily: v })} options={(defaults as any).__fonts.map((f: any) => ({ value: f.id, label: f.label }))} />
          {appearance.fontFamily === "custom" && <Input label="Font stylesheet URL" placeholder="https://fonts.googleapis.com/css2?family=…" value={appearance.fontUrl || ""} onChange={(e) => setA({ fontUrl: e.target.value })} />}
        </section>

        <section className="nv-stack">
          <strong>Shape</strong>
          <SegmentedControl label="Button corners" value={appearance.radiusControl || ""} onValueChange={(v: string) => setA({ radiusControl: v })} options={seg([["", "Default"], ["sharp", "Sharp"], ["small", "Small"], ["medium", "Medium"], ["large", "Large"], ["pill", "Pill"]])} />
          <SegmentedControl label="Card corners" value={appearance.radiusSurface || ""} onValueChange={(v: string) => setA({ radiusSurface: v })} options={seg([["", "Default"], ["sharp", "Sharp"], ["small", "Small"], ["medium", "Medium"], ["large", "Large"]])} />
        </section>

        <section className="nv-stack">
          <strong>Texture, motion and loader</strong>
          <SegmentedControl label="Background texture" value={appearance.texture || "none"} onValueChange={(v: string) => setA({ texture: v })} options={seg([["none", "None"], ["grain", "Grain"], ["dots", "Dots"], ["grid", "Grid"], ["lines", "Lines"], ["paper", "Paper"]])} />
          <SegmentedControl label="Animations" value={appearance.motion || "full"} onValueChange={(v: string) => setA({ motion: v })} options={seg([["full", "Full"], ["subtle", "Subtle"], ["none", "None"]])} />
          <SegmentedControl label="Loading spinner" value={appearance.spinner || "ring"} onValueChange={(v: string) => setA({ spinner: v })} options={seg([["ring", "Ring"], ["dots", "Dots"], ["pulse", "Pulse"], ["bars", "Bars"]])} />
        </section>

        <section className="nv-stack">
          <strong>Homepage banner media</strong>
          <SegmentedControl label="Background" value={media} onValueChange={(v: string) => setH({ mediaType: v })} options={seg([["none", "None"], ["image", "Photo"], ["video", "Video"]])} />
          {media !== "none" && <Input label={media === "video" ? "Video URL (mp4 or webm)" : "Photo URL"} placeholder="https://…" value={hero.mediaUrl || ""} onChange={(e) => setH({ mediaUrl: e.target.value })} />}
          {media === "video" && <Input label="Poster image URL (shown while loading)" placeholder="https://…" value={hero.mediaPoster || ""} onChange={(e) => setH({ mediaPoster: e.target.value })} />}
          {media !== "none" && <Input description="Higher is more readable text over the media." label="Overlay strength (0–100)" max={100} min={0} type="number" value={hero.mediaDim ?? 55} onChange={(e) => setH({ mediaDim: Math.max(0, Math.min(100, Number(e.target.value))) })} />}
          <Input label="Logo image URL" placeholder="https://…" value={appearance.logoUrl || ""} onChange={(e) => setA({ logoUrl: e.target.value, logoType: e.target.value ? "image" : appearance.logoType })} />
        </section>

        <div className="nv-actions nv-design-actions">
          <Button variant="ghost" onClick={() => { setAppearance({ ...(defaults as any).appearance }); setHero((h: Json) => ({ ...h, mediaType: "none", mediaUrl: "", mediaPoster: "", mediaDim: 55 })); setDirty(true); }}><RotateCcw size={14} aria-hidden="true" />Reset design</Button>
          <Button disabled={!dirty} loading={saving} onClick={save}><Save size={14} aria-hidden="true" />Publish design</Button>
        </div>
      </div>

      <div className="nv-design-preview">
        <SegmentedControl label="Preview size" value={device} onValueChange={setDevice} options={seg([["phone", "Phone"], ["wide", "Desktop"]])} />
        <div className="nv-design-frame" data-device={device}>
          {site ? <iframe ref={frame} src={`${site}/?preview=1`} title="Website preview" onLoad={send} /> : <p className="nv-muted">Add your website address in Shop settings to see a preview.</p>}
        </div>
        <p className="nv-muted" style={{ margin: 0, fontSize: 13 }}>{dirty ? "Previewing unpublished changes." : `Showing the published design${saved.appearance ? "" : " (defaults)"}.`}</p>
      </div>
    </div>
  );
}
