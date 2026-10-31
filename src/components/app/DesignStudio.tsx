import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, RotateCcw, Save, X } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Select } from "@/components/arc/select/select";
import { Switch } from "@/components/arc/switch/switch";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Textarea } from "@/components/arc/textarea/textarea";
import { UploadButton } from "@/components/app/UploadButton";
import { PagesEditor, type PageDef } from "@/components/app/PagesEditor";
import copyRegistry from "@/lib/siteCopy.json";
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
type CopyEntry = { key: string; group: string; label: string; text: string; long?: boolean };
const COPY = copyRegistry as CopyEntry[];
const SECTION_NAMES: Record<string, string> = { business: "Business info", footer: "Footer", about: "About page", hero: "Homepage banner", heroPoints: "Banner highlight", trustItems: "Trust bar", howItWorks: "How it works step", ctaStrip: "Bottom banner" };
const clone = (v: Json) => JSON.parse(JSON.stringify(v ?? null));
const getIn = (o: Json, path: string[]): Json => path.reduce((a, k) => (a == null ? a : a[k]), o);
const setIn = (o: Json, path: string[], v: Json): Json => {
  const next = clone(o);
  let cur = next;

  path.slice(0, -1).forEach((k) => { cur = cur[k]; });
  cur[path[path.length - 1]] = v;

  return next;
};
const HOME_BLOCKS: [string, string][] = [["hero", "Banner and trust bar"], ["services", "Repair services"], ["how", "How it works"], ["featured", "Best sellers"], ["protect", "Protection promo"], ["cta", "Bottom banner"]];
const META_PAGES: [string, string][] = [["/", "Home"], ["/shop", "Shop"], ["/repairs", "Repairs"], ["/protection", "Protection"], ["/about", "About"], ["/repair-status", "Repair status"], ["/shipping", "Shipping policy"], ["/returns", "Returns policy"], ["/refunds", "Refund policy"], ["/privacy", "Privacy policy"], ["/login", "Sign in"], ["/signup", "Sign up"]];
const MENU_ITEMS: [string, string][] = [["/", "Home"], ["/shop", "Shop"], ["/repairs", "Repairs"], ["/protection", "Protection"], ["/about", "About"]];
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
  const [copy, setCopy] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<Record<string, Json>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [group, setGroup] = useState(COPY[0].group);
  const [pagePath, setPagePath] = useState("/");
  const [policies, setPolicies] = useState<Record<string, Json>>({});
  const [outlines, setOutlines] = useState<Record<string, Json>>({});
  const [textMap, setTextMap] = useState<Record<string, string>>({});
  const [layout, setLayout] = useState<Json>({});
  const [announcement, setAnnouncement] = useState<Json>({ enabled: false, text: "", link: "", linkLabel: "", tone: "brand" });
  const [pages, setPages] = useState<PageDef[]>([]);
  const [meta, setMeta] = useState<Record<string, Json>>({});
  const [menu, setMenu] = useState<Json>({});
  const [mode, setMode] = useState("edit");
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
    setCopy(content.copy || {});
    setPolicies(content.policies || {});
    setTextMap(content.textMap || {});
    setLayout(content.layout || {});
    setAnnouncement({ enabled: false, text: "", link: "", linkLabel: "", tone: "brand", ...(content.announcement || {}) });
    setPages(content.pages || []);
    setMeta(content.meta || {});
    setMenu(content.menu || {});
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const send = useCallback(() => {
    if (!site || !frame.current?.contentWindow || !appearance) return;
    frame.current.contentWindow.postMessage({ source: "novaops-design", appearance, copy, policies, textMap, layout, announcement, pages, meta, menu, mode, sections, hero: { ...(sections.hero || {}), mediaType: hero?.mediaType, mediaUrl: hero?.mediaUrl, mediaPoster: hero?.mediaPoster, mediaDim: hero?.mediaDim } }, site);
  }, [site, appearance, hero, copy, policies, textMap, layout, announcement, pages, meta, menu, mode, sections]);

  // Push the draft to the preview on every change, and again shortly after load (the page fetches its saved design first).
  useEffect(() => {
    send();
    const t = [setTimeout(send, 800), setTimeout(send, 2500)];

    return () => t.forEach(clearTimeout);
  }, [send]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== site || e.data?.source !== "mobicare-site") return;
      if (e.data.type === "edit" && typeof e.data.path === "string") setEditing(e.data.path);
      else if (e.data.type === "policy-outline") setOutlines((o) => ({ ...o, [e.data.path]: { ...(o[e.data.path] || {}), ...e.data.outline, sections: e.data.outline.sections ?? o[e.data.path]?.sections } }));
      else send();
    };

    window.addEventListener("message", onMsg);

    return () => window.removeEventListener("message", onMsg);
  }, [site, send]);

  const setA = (patch: Record<string, string>) => { setAppearance((a: Json) => ({ ...a, ...patch })); setDirty(true); };
  const setH = (patch: Record<string, Json>) => { setHero((h: Json) => ({ ...h, ...patch })); setDirty(true); };
  const sectionValue = (name: string) => sections[name] ?? clone((saved as any)[name] ?? (defaults as any)[name]);
  const setCopyKey = (key: string, v: string) => { setCopy((c) => ({ ...c, [key]: v })); setDirty(true); };
  const setSectionPath = (path: string[], v: string) => { setSections((sec) => ({ ...sec, [path[0]]: setIn(sectionValue(path[0]), path.slice(1), v) })); setDirty(true); };
  // What the click-to-edit panel is editing: a page-text override or a field inside a content section.
  const target = useMemo(() => {
    if (!editing) return null;
    if (editing.startsWith("copy.")) {
      const key = editing.slice(5);
      const entry = COPY.find((c) => c.key === key);

      return entry ? { label: `${entry.group}: ${entry.label}`, value: copy[key] ?? entry.text, long: !!entry.long, set: (v: string) => setCopyKey(key, v), reset: copy[key] !== undefined ? () => { setCopy((c) => { const n = { ...c }; delete n[key]; return n; }); setDirty(true); } : undefined } : null;
    }
    if (editing === "announcement.text") {
      return { label: "Announcement bar", value: announcement.text || "", long: false, set: (v: string) => { setAnnouncement((a: Json) => ({ ...a, text: v })); setDirty(true); }, reset: undefined };
    }
    if (editing.startsWith("page:")) {
      const [, slug, field] = editing.split(":");
      const pi = pages.findIndex((p) => p.slug === slug);
      const pg = pages[pi];
      const m = /^b\.(\d+)\.(\w+)$/.exec(field);
      const value = pg ? (m ? pg.blocks[Number(m[1])]?.[m[2]] : (pg as any)[field]) : undefined;

      if (typeof value !== "string") return null;

      return { label: `${pg.title} · ${m ? m[2] : field}`, value, long: m?.[2] === "text" || field === "description", set: (v: string) => { setPages((all) => all.map((p, i) => (i !== pi ? p : m ? { ...p, blocks: p.blocks.map((b, j) => (j === Number(m[1]) ? { ...b, [m[2]]: v } : b)) } : { ...p, [field]: v }))); setDirty(true); }, reset: undefined };
    }
    if (editing.startsWith("text:")) {
      const original = editing.slice(5);
      const has = textMap[original] !== undefined;

      return {
        label: `Wording: “${original.length > 48 ? `${original.slice(0, 48)}…` : original}”`,
        value: has ? textMap[original] : original,
        long: original.length > 70,
        set: (v: string) => { setTextMap((m) => ({ ...m, [original]: v })); setDirty(true); },
        reset: has ? () => { setTextMap((m) => { const n = { ...m }; delete n[original]; return n; }); setDirty(true); } : undefined,
        note: "Changes this wording everywhere it appears on the site.",
      };
    }
    if (editing.startsWith("policy:")) {
      const [, pagePathKey, field] = editing.split(":");
      const ov = policies[pagePathKey];
      const out = outlines[pagePathKey];
      const m = /^s\.(\d+)\.(title|body)$/.exec(field);
      const idx = m ? Number(m[1]) : -1;
      const base = ov ?? (out ? { title: out.title, lead: out.lead, sections: out.sections } : null);
      const value = m ? base?.sections?.[idx]?.[m[2]] : base?.[field];
      const name = pagePathKey.replace("/", "");

      if (typeof value !== "string") return { label: `${name} page`, value: "", long: false, set: () => undefined, reset: undefined, note: "Reopen this page in the preview so its text can load, then click it again." };
      const edit = (v: string) => {
        const cur = clone(ov ?? { title: out.title, lead: out.lead, sections: out.sections ?? [] });

        if (m) { cur.sections = cur.sections || []; cur.sections[idx] = { ...(cur.sections[idx] || { title: "", body: "" }), [m[2]]: v }; } else cur[field] = v;
        setPolicies((p) => ({ ...p, [pagePathKey]: cur }));
        setDirty(true);
      };

      return { label: `${name[0].toUpperCase()}${name.slice(1)} page · ${m ? `section ${idx + 1} ${m[2]}` : field}`, value, long: m?.[2] === "body" || field === "lead", set: edit, reset: ov ? () => { setPolicies((p) => { const n = { ...p }; delete n[pagePathKey]; return n; }); setDirty(true); } : undefined, note: ov ? undefined : "Editing starts a custom version of this page. Use Restore to go back to the built-in text.", resetLabel: "Restore this page's original text" };
    }
    const path = editing.split(".");
    const sec = sectionValue(path[0]);
    const value = getIn(sec, path.slice(1));

    if (typeof value !== "string") return null;
    const field = path.slice(1).filter((x) => Number.isNaN(Number(x))).join(" ");

    return { label: `${SECTION_NAMES[path[0]] || path[0]}${field ? ` · ${field.replace(/([A-Z])/g, " $1").toLowerCase()}` : ""}`, value, long: value.length > 70, set: (v: string) => setSectionPath(path, v), reset: undefined };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, copy, sections, saved, policies, outlines, textMap, announcement, pages]);

  const homeOrder: string[] = useMemo(() => {
    const o: string[] = (layout.home?.order || []).filter((id: string) => HOME_BLOCKS.some(([b]) => b === id));

    return [...o, ...HOME_BLOCKS.map(([id]) => id).filter((id) => !o.includes(id))];
  }, [layout]);
  const homeHidden: string[] = layout.home?.hidden || [];
  const setHome = (order: string[], hidden: string[]) => { setLayout((l: Json) => ({ ...l, home: { order, hidden } })); setDirty(true); };
  const move = (id: string, d: number) => {
    const i = homeOrder.indexOf(id);
    const j = i + d;

    if (j < 0 || j >= homeOrder.length) return;
    const next = [...homeOrder];

    [next[i], next[j]] = [next[j], next[i]];
    setHome(next, homeHidden);
  };
  const menuOrder: string[] = useMemo(() => {
    const o: string[] = (menu.order || []).filter((id: string) => MENU_ITEMS.some(([m]) => m === id));

    return [...o, ...MENU_ITEMS.map(([id]) => id).filter((id) => !o.includes(id))];
  }, [menu]);
  const menuHidden: string[] = menu.hidden || [];
  const setMenuState = (order: string[], hidden: string[]) => { setMenu({ order, hidden }); setDirty(true); };
  const moveMenu = (id: string, d: number) => {
    const i = menuOrder.indexOf(id);
    const j = i + d;

    if (j < 0 || j >= menuOrder.length) return;
    const next = [...menuOrder];

    [next[i], next[j]] = [next[j], next[i]];
    setMenuState(next, menuHidden);
  };
  const setMetaField = (path: string, field: "title" | "description", v: string) => { setMeta((m) => ({ ...m, [path]: { ...(m[path] || {}), [field]: v } })); setDirty(true); };
  const activePalette = useMemo(() => PALETTES.find((p) => Object.entries(p.values).every(([k, v]) => (appearance?.[k] || "") === v))?.id, [appearance]);

  const save = async () => {
    const sb = getSupabase();

    if (!sb) return;
    setSaving(true);
    try {
      const { data: latest } = await sb.from("site_settings").select("content").eq("id", CONFIG_ID).maybeSingle();
      const base = (latest?.content as Record<string, Json>) || {};
      const next: Record<string, Json> = { ...base, appearance: { ...(base.appearance || {}), ...appearance }, hero: { ...((defaults as any).hero), ...(base.hero || {}), ...(sections.hero || {}), mediaType: hero.mediaType, mediaUrl: hero.mediaUrl, mediaPoster: hero.mediaPoster, mediaDim: hero.mediaDim }, copy, policies, textMap, layout, announcement, pages, meta, menu };
      Object.entries(sections).forEach(([name, v]) => { if (name !== "hero") next[name] = v; });
      const { error } = await sb.from("site_settings").upsert({ id: CONFIG_ID, content: next, updated_at: new Date().toISOString() });

      if (error) throw error;
      setSaved(next);
      setSections({});
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
          {media !== "none" && <div className="nv-uprow"><Input label={media === "video" ? "Video URL (mp4 or webm)" : "Photo URL"} placeholder="https://…" value={hero.mediaUrl || ""} onChange={(e) => setH({ mediaUrl: e.target.value })} /><UploadButton kind={media === "video" ? "video" : "image"} onUploaded={(u) => setH({ mediaUrl: u })} /></div>}
          {media === "video" && <div className="nv-uprow"><Input label="Poster image URL (shown while loading)" placeholder="https://…" value={hero.mediaPoster || ""} onChange={(e) => setH({ mediaPoster: e.target.value })} /><UploadButton kind="image" onUploaded={(u) => setH({ mediaPoster: u })} /></div>}
          {media !== "none" && <Input description="Higher is more readable text over the media." label="Overlay strength (0–100)" max={100} min={0} type="number" value={hero.mediaDim ?? 55} onChange={(e) => setH({ mediaDim: Math.max(0, Math.min(100, Number(e.target.value))) })} />}
          <div className="nv-uprow"><Input label="Logo image URL" placeholder="https://…" value={appearance.logoUrl || ""} onChange={(e) => setA({ logoUrl: e.target.value, logoType: e.target.value ? "image" : appearance.logoType })} /><UploadButton kind="image" onUploaded={(u) => setA({ logoUrl: u, logoType: "image" })} /></div>
        </section>

        <section className="nv-stack">
          <strong>Announcement bar</strong>
          <div className="nv-row"><div className="nv-row-main"><strong>Show a banner above the header</strong><span>For sales, holiday hours or notices. Visitors can dismiss it.</span></div><Switch aria-label="Show announcement" checked={!!announcement.enabled} onCheckedChange={(v: boolean) => { setAnnouncement((a: Json) => ({ ...a, enabled: v })); setDirty(true); }} /></div>
          <Input label="Message" value={announcement.text || ""} onChange={(e) => { setAnnouncement((a: Json) => ({ ...a, text: e.target.value })); setDirty(true); }} />
          <div className="nv-form-row">
            <Input label="Link text (optional)" value={announcement.linkLabel || ""} onChange={(e) => { setAnnouncement((a: Json) => ({ ...a, linkLabel: e.target.value })); setDirty(true); }} />
            <Input label="Link address" placeholder="/shop or https://…" value={announcement.link || ""} onChange={(e) => { setAnnouncement((a: Json) => ({ ...a, link: e.target.value })); setDirty(true); }} />
          </div>
          <SegmentedControl label="Style" value={announcement.tone || "brand"} onValueChange={(v: string) => { setAnnouncement((a: Json) => ({ ...a, tone: v })); setDirty(true); }} options={seg([["brand", "Brand color"], ["dark", "Dark"], ["warning", "Amber"]])} />
        </section>

        <section className="nv-stack">
          <strong>Extra pages</strong>
          <PagesEditor pages={pages} onChange={(p) => { setPages(p); setDirty(true); }} onPreview={(slug) => setPagePath(`/p/${slug}`)} />
        </section>

        <section className="nv-stack">
          <strong>Homepage layout</strong>
          <p className="nv-muted" style={{ margin: 0, fontSize: 13 }}>Reorder the homepage sections or hide the ones you don't want. The preview updates as you go.</p>
          {homeOrder.map((id, i) => (
            <div key={id} className="nv-row" style={{ opacity: homeHidden.includes(id) ? 0.55 : 1 }}>
              <div className="nv-row-main"><strong>{HOME_BLOCKS.find(([b]) => b === id)?.[1]}</strong></div>
              <Button aria-label={`Move ${id} up`} disabled={i === 0} size="sm" variant="ghost" onClick={() => move(id, -1)}><ArrowUp size={14} aria-hidden="true" /></Button>
              <Button aria-label={`Move ${id} down`} disabled={i === homeOrder.length - 1} size="sm" variant="ghost" onClick={() => move(id, 1)}><ArrowDown size={14} aria-hidden="true" /></Button>
              <Switch aria-label={`Show ${id}`} checked={!homeHidden.includes(id)} onCheckedChange={(v: boolean) => setHome(homeOrder, v ? homeHidden.filter((h) => h !== id) : [...homeHidden, id])} />
            </div>
          ))}
          {(layout.home?.order?.length || homeHidden.length) ? <div><Button size="sm" variant="ghost" onClick={() => { setLayout((l: Json) => ({ ...l, home: undefined })); setDirty(true); }}>Restore default layout</Button></div> : null}
        </section>

        <section className="nv-stack">
          <strong>Site menu</strong>
          <p className="nv-muted" style={{ margin: 0, fontSize: 13 }}>Reorder or hide the main menu links. Extra pages are added to the menu from their own settings.</p>
          {menuOrder.map((id, i) => (
            <div key={id} className="nv-row" style={{ opacity: menuHidden.includes(id) ? 0.55 : 1 }}>
              <div className="nv-row-main"><strong>{MENU_ITEMS.find(([m]) => m === id)?.[1]}</strong></div>
              <Button aria-label={`Move ${id} up in menu`} disabled={i === 0} size="sm" variant="ghost" onClick={() => moveMenu(id, -1)}><ArrowUp size={14} aria-hidden="true" /></Button>
              <Button aria-label={`Move ${id} down in menu`} disabled={i === menuOrder.length - 1} size="sm" variant="ghost" onClick={() => moveMenu(id, 1)}><ArrowDown size={14} aria-hidden="true" /></Button>
              <Switch aria-label={`Show ${id} in menu`} checked={!menuHidden.includes(id)} onCheckedChange={(v: boolean) => setMenuState(menuOrder, v ? menuHidden.filter((h) => h !== id) : [...menuHidden, id])} />
            </div>
          ))}
        </section>

        <section className="nv-stack">
          <strong>Page titles and search descriptions</strong>
          <p className="nv-muted" style={{ margin: 0, fontSize: 13 }}>What shows in the browser tab and in Google results. Leave blank to keep the built-in wording.</p>
          <details>
            <summary style={{ cursor: "pointer" }}>Edit for each page</summary>
            <div className="nv-stack" style={{ marginTop: 10 }}>
              {META_PAGES.map(([path, name]) => (
                <div key={path} className="nv-stack">
                  <strong style={{ fontWeight: 500 }}>{name}</strong>
                  <Input label="Title" placeholder="Built-in title" value={meta[path]?.title || ""} onChange={(e) => setMetaField(path, "title", e.target.value)} />
                  <Textarea label="Description" placeholder="Built-in description" rows={2} value={meta[path]?.description || ""} onChange={(e) => setMetaField(path, "description", e.target.value)} />
                </div>
              ))}
            </div>
          </details>
        </section>

        <section className="nv-stack">
          <strong>Page text</strong>
          <p className="nv-muted" style={{ margin: 0, fontSize: 13 }}>Click any text in the preview to change it. Wording you change by clicking applies everywhere that exact text appears. These pages are also listed here.</p>
          {Object.keys(textMap).length > 0 && (
            <details>
              <summary style={{ cursor: "pointer" }}>Custom wording ({Object.keys(textMap).length})</summary>
              <div className="nv-stack" style={{ marginTop: 8 }}>
                {Object.entries(textMap).map(([orig, now]) => (
                  <div key={orig} className="nv-row">
                    <div className="nv-row-main"><strong>{now}</strong><span>was: {orig}</span></div>
                    <Button size="sm" variant="ghost" aria-label={`Restore ${orig}`} onClick={() => { setTextMap((m) => { const n = { ...m }; delete n[orig]; return n; }); setDirty(true); }}>Restore</Button>
                  </div>
                ))}
              </div>
            </details>
          )}
          <Select label="Page" value={group} onValueChange={setGroup} options={[...new Set(COPY.map((c) => c.group))].map((g) => ({ value: g, label: g }))} />
          {COPY.filter((c) => c.group === group).map((c) => c.long
            ? <Textarea key={c.key} label={c.label} rows={3} value={copy[c.key] ?? c.text} onChange={(e) => setCopyKey(c.key, e.target.value)} />
            : <Input key={c.key} label={c.label} value={copy[c.key] ?? c.text} onChange={(e) => setCopyKey(c.key, e.target.value)} />)}
        </section>

        <div className="nv-actions nv-design-actions">
          <Button variant="ghost" onClick={() => { setAppearance({ ...(defaults as any).appearance }); setHero((h: Json) => ({ ...h, mediaType: "none", mediaUrl: "", mediaPoster: "", mediaDim: 55 })); setDirty(true); }}><RotateCcw size={14} aria-hidden="true" />Reset design</Button>
          <Button disabled={!dirty} loading={saving} onClick={save}><Save size={14} aria-hidden="true" />Publish design</Button>
        </div>
      </div>

      <div className="nv-design-preview">
        <Select label="Preview page" value={pagePath} onValueChange={setPagePath} options={[["/", "Home"], ["/repairs", "Repairs"], ["/about", "About"], ["/protection", "Protection"], ["/shop", "Shop"], ["/repair-status", "Repair status"], ["/login", "Sign in"], ["/signup", "Sign up"], ["/shipping", "Shipping policy"], ["/returns", "Returns policy"], ["/refunds", "Refund policy"], ["/privacy", "Privacy policy"], ...pages.map((p) => [`/p/${p.slug}`, `${p.title}${p.published ? "" : " (draft)"}`])].map(([value, label]) => ({ value, label }))} />
        <SegmentedControl label="Preview mode" value={mode} onValueChange={setMode} options={seg([["edit", "Edit text"], ["browse", "Browse (open menus, cart, forms)"]])} />
        <SegmentedControl label="Preview size" value={device} onValueChange={setDevice} options={seg([["phone", "Phone"], ["wide", "Desktop"]])} />
        {target && (
          <div className="nv-panel nv-stack nv-editpanel" role="group" aria-label="Edit text">
            <div className="nv-actions" style={{ justifyContent: "space-between" }}>
              <strong style={{ fontWeight: 500, textTransform: target.label.startsWith("Wording") ? "none" : "capitalize" }}>{target.label}</strong>
              <Button aria-label="Close editor" size="sm" variant="ghost" onClick={() => setEditing(null)}><X size={14} aria-hidden="true" /></Button>
            </div>
            {target.long
              ? <Textarea autoFocus label="Text" rows={4} value={target.value} onChange={(e) => target.set(e.target.value)} />
              : <Input autoFocus label="Text" value={target.value} onChange={(e) => target.set(e.target.value)} />}
            {(target as any).note && <p className="nv-muted" style={{ margin: 0, fontSize: 13 }}>{(target as any).note}</p>}
            {target.reset && <div><Button size="sm" variant="ghost" onClick={target.reset}>{(target as any).resetLabel || "Restore original wording"}</Button></div>}
          </div>
        )}
        <div className="nv-design-frame" data-device={device}>
          {site ? <iframe key={pagePath} ref={frame} src={`${site}${pagePath}?preview=1`} title="Website preview" onLoad={send} /> : <p className="nv-muted">Add your website address in Shop settings to see a preview.</p>}
        </div>
        <p className="nv-muted" style={{ margin: 0, fontSize: 13 }}>{dirty ? "Previewing unpublished changes." : `Showing the published design${saved.appearance ? "" : " (defaults)"}.`}</p>
      </div>
    </div>
  );
}
