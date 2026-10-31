import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Select } from "@/components/arc/select/select";
import { Switch } from "@/components/arc/switch/switch";
import { Textarea } from "@/components/arc/textarea/textarea";
import { UploadButton } from "@/components/app/UploadButton";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Block { type: string; [k: string]: any }
export interface PageDef { slug: string; title: string; description?: string; published?: boolean; inMenu?: boolean; blocks: Block[] }

const TYPES: [string, string][] = [["heading", "Heading"], ["text", "Text"], ["image", "Photo"], ["video", "Video"], ["button", "Button"], ["spacer", "Spacer"]];
const BLANK: Record<string, Block> = {
  heading: { type: "heading", text: "New heading", size: "large" },
  text: { type: "text", text: "Write something here. Leave a blank line between paragraphs, start lines with - for a list, and use **bold** or [links](/shop)." },
  image: { type: "image", url: "", alt: "", caption: "" },
  video: { type: "video", url: "", poster: "" },
  button: { type: "button", label: "Learn more", link: "/" },
  spacer: { type: "spacer", size: "m" },
};
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/** Builds extra website pages from simple blocks. Each page lives at /p/<address> on the site. */
export function PagesEditor({ pages, onChange, onPreview }: { pages: PageDef[]; onChange: (p: PageDef[]) => void; onPreview: (slug: string) => void }) {
  const [sel, setSel] = useState(0);
  const page = pages[Math.min(sel, pages.length - 1)];
  const idx = pages.indexOf(page);
  const patch = (p: Partial<PageDef>) => onChange(pages.map((x, i) => (i === idx ? { ...x, ...p } : x)));
  const setBlocks = (blocks: Block[]) => patch({ blocks });
  const setBlock = (i: number, b: Partial<Block>) => setBlocks(page.blocks.map((x, j) => (j === i ? { ...x, ...b } : x)));
  const add = () => {
    const base = "new-page";
    let slug = base;
    let n = 2;

    while (pages.some((p) => p.slug === slug)) slug = `${base}-${n++}`;
    onChange([...pages, { slug, title: "New page", description: "", published: false, inMenu: false, blocks: [BLANK.heading, BLANK.text] }]);
    setSel(pages.length);
  };

  return (
    <div className="nv-stack">
      {pages.length > 0 && <Select label="Page" value={String(idx)} onValueChange={(v: string) => setSel(Number(v))} options={pages.map((p, i) => ({ value: String(i), label: `${p.title}${p.published ? "" : " (draft)"}` }))} />}
      <div className="nv-actions">
        <Button size="sm" variant="secondary" onClick={add}><Plus size={14} aria-hidden="true" />New page</Button>
        {page && <Button size="sm" variant="secondary" onClick={() => onPreview(page.slug)}><Eye size={14} aria-hidden="true" />Preview</Button>}
        {page && <Button size="sm" variant="ghost" onClick={() => { if (window.confirm(`Delete the page "${page.title}"?`)) { onChange(pages.filter((_, i) => i !== idx)); setSel(0); } }}><Trash2 size={14} aria-hidden="true" />Delete</Button>}
      </div>
      {!page ? <p className="nv-muted" style={{ margin: 0, fontSize: 13 }}>No custom pages yet. Make one for a sale, a service area, FAQs, anything you like.</p> : (
        <>
          <Input label="Title" value={page.title} onChange={(e) => patch({ title: e.target.value })} />
          <Input description={`Web address: /p/${page.slug}`} label="Address" value={page.slug} onChange={(e) => patch({ slug: slugify(e.target.value) || "page" })} />
          <Input label="Short description (under the title)" value={page.description || ""} onChange={(e) => patch({ description: e.target.value })} />
          <div className="nv-row"><div className="nv-row-main"><strong>Published</strong><span>Drafts are only visible in this preview.</span></div><Switch aria-label="Published" checked={!!page.published} onCheckedChange={(v: boolean) => patch({ published: v })} /></div>
          <div className="nv-row"><div className="nv-row-main"><strong>Show in the site menu</strong></div><Switch aria-label="Show in menu" checked={!!page.inMenu} onCheckedChange={(v: boolean) => patch({ inMenu: v })} /></div>

          {page.blocks.map((b, i) => (
            <div key={i} className="nv-panel nv-stack">
              <div className="nv-actions" style={{ justifyContent: "space-between" }}>
                <strong style={{ fontWeight: 500 }}>{TYPES.find(([t]) => t === b.type)?.[1]}</strong>
                <span className="nv-actions" style={{ gap: 4 }}>
                  <Button aria-label="Move block up" disabled={i === 0} size="sm" variant="ghost" onClick={() => { const n = [...page.blocks]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setBlocks(n); }}><ArrowUp size={14} aria-hidden="true" /></Button>
                  <Button aria-label="Move block down" disabled={i === page.blocks.length - 1} size="sm" variant="ghost" onClick={() => { const n = [...page.blocks]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setBlocks(n); }}><ArrowDown size={14} aria-hidden="true" /></Button>
                  <Button aria-label="Remove block" size="sm" variant="ghost" onClick={() => setBlocks(page.blocks.filter((_, j) => j !== i))}><Trash2 size={14} aria-hidden="true" /></Button>
                </span>
              </div>
              {b.type === "heading" && <><Input label="Heading" value={b.text || ""} onChange={(e) => setBlock(i, { text: e.target.value })} /><Select label="Size" value={b.size || "large"} onValueChange={(v: string) => setBlock(i, { size: v })} options={[{ value: "large", label: "Large" }, { value: "medium", label: "Medium" }]} /></>}
              {b.type === "text" && <Textarea label="Text" rows={5} value={b.text || ""} onChange={(e) => setBlock(i, { text: e.target.value })} />}
              {b.type === "image" && <><div className="nv-uprow"><Input label="Photo URL" placeholder="https://…" value={b.url || ""} onChange={(e) => setBlock(i, { url: e.target.value })} /><UploadButton kind="image" onUploaded={(u) => setBlock(i, { url: u })} /></div><Input label="Describe the photo (for screen readers)" value={b.alt || ""} onChange={(e) => setBlock(i, { alt: e.target.value })} /><Input label="Caption (optional)" value={b.caption || ""} onChange={(e) => setBlock(i, { caption: e.target.value })} /></>}
              {b.type === "video" && <><div className="nv-uprow"><Input label="Video URL (mp4 or webm)" placeholder="https://…" value={b.url || ""} onChange={(e) => setBlock(i, { url: e.target.value })} /><UploadButton kind="video" onUploaded={(u) => setBlock(i, { url: u })} /></div><div className="nv-uprow"><Input label="Poster image URL (optional)" value={b.poster || ""} onChange={(e) => setBlock(i, { poster: e.target.value })} /><UploadButton kind="image" onUploaded={(u) => setBlock(i, { poster: u })} /></div></>}
              {b.type === "button" && <><Input label="Button text" value={b.label || ""} onChange={(e) => setBlock(i, { label: e.target.value })} /><Input description="Use /shop for a page on this site, or a full https:// address." label="Link" value={b.link || ""} onChange={(e) => setBlock(i, { link: e.target.value })} /></>}
              {b.type === "spacer" && <Select label="Space" value={b.size || "m"} onValueChange={(v: string) => setBlock(i, { size: v })} options={[{ value: "s", label: "Small" }, { value: "m", label: "Medium" }, { value: "l", label: "Large" }]} />}
            </div>
          ))}
          <Select label="Add a block" value="" onValueChange={(v: string) => v && setBlocks([...page.blocks, { ...BLANK[v] }])} options={[{ value: "", label: "Choose…" }, ...TYPES.map(([value, label]) => ({ value, label }))]} />
        </>
      )}
    </div>
  );
}
