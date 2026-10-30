import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, PackagePlus, Pencil, Printer, ScanLine, ShoppingCart, Ticket } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { Input } from "@/components/arc/input/input";
import { toast } from "@/hooks/useToast";
import { printBarcodeLabel } from "@/lib/print";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Found = { kind: "item"; item: any } | { kind: "ticket"; ticket: any } | { kind: "none"; code: string };

/** Looks a scanned or typed code up against inventory SKUs and ticket labels (TKT-123). */
export async function resolveCode(raw: string): Promise<Found> {
  const code = raw.trim();
  const st = useAppStore.getState();

  if (/^tkt-\d+$/i.test(code)) {
    const id = parseInt(code.slice(4), 10);
    let t: any = st.tickets.find((x) => x.id === id);

    if (!t) { const { data } = (await getSupabase()?.from("tickets").select("*").eq("id", id).maybeSingle()) ?? { data: null }; t = data && { ...data, customerId: data.customer_id }; }

    return t ? { kind: "ticket", ticket: t } : { kind: "none", code };
  }
  const lower = code.toLowerCase();
  const item = st.inventory.find((i: any) => (i.sku && i.sku.toLowerCase() === lower) || String(i.id) === code || i.name?.toLowerCase() === lower);

  return item ? { kind: "item", item } : { kind: "none", code };
}

/** Scan an item or ticket from anywhere: look it up, then add it to a sale, receive stock, or open it. */
export function ScanDialog({ open, onOpenChange, initialCode = "" }: { open: boolean; onOpenChange: (v: boolean) => void; initialCode?: string }) {
  const navigate = useNavigate();
  const inventory = useAppStore((s) => s.inventory);
  const cur = useAppStore((s) => s.settings.currency) || "$";
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [camera, setCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const supportsCamera = typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;

  const lookup = useCallback(async (value: string) => {
    if (!value.trim()) return;
    setFound(await resolveCode(value));
  }, []);

  useEffect(() => {
    if (!open) { setCamera(false); setFound(null); setCode(""); setCameraError(""); return; }
    if (initialCode) { setCode(initialCode); void lookup(initialCode); }
  }, [open, initialCode, lookup]);

  // Camera scanning where the browser supports BarcodeDetector (Chrome and Android).
  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const Detector = (window as any).BarcodeDetector;
        const detector = new Detector({ formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e", "code_39", "qr_code"] });

        timer = setInterval(async () => {
          if (!video.current) return;
          const hits = await detector.detect(video.current).catch(() => []);

          if (hits[0]?.rawValue) { setCamera(false); setCode(hits[0].rawValue); void lookup(hits[0].rawValue); }
        }, 250);
      } catch {
        setCameraError("The camera isn't available. Check the browser's camera permission.");
        setCamera(false);
      }
    })();

    return () => { cancelled = true; clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [camera, lookup]);

  // Keep the shown item fresh after receiving stock.
  const item = found?.kind === "item" ? inventory.find((i: any) => i.id === found.item.id) ?? found.item : null;

  const receive = async (n: number) => {
    if (!item) return;
    try {
      await useAppStore.getState().updateInventoryItem(item.id, { stock: (item.stock || 0) + n });
      toast.success("Stock updated", `${item.name}: ${(item.stock || 0) + n} on hand`);
    } catch (e) {
      toast.danger("Couldn't update stock", (e as Error).message);
    }
  };

  const go = (path: string) => { onOpenChange(false); navigate(path); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Scan an item" description="Scan a barcode, or type a SKU or ticket label such as TKT-123.">
        <div className="nv-form">
          <form className="nv-actions" style={{ alignItems: "end" }} onSubmit={(e) => { e.preventDefault(); void lookup(code); }}>
            <div style={{ flex: 1 }}><Input autoFocus label="Code" placeholder="SKU or TKT-123" value={code} onChange={(e) => setCode(e.target.value)} /></div>
            <Button type="submit"><ScanLine size={14} aria-hidden="true" />Look up</Button>
            {supportsCamera && <Button type="button" variant="secondary" onClick={() => { setCameraError(""); setCamera((c) => !c); }}><Camera size={14} aria-hidden="true" />{camera ? "Stop" : "Camera"}</Button>}
          </form>
          {camera && <video ref={video} aria-label="Camera preview" className="nv-scan-video" muted playsInline />}
          {cameraError && <Alert title={cameraError} tone="warning" />}

          {found?.kind === "none" && <Alert title="Nothing matches that code" tone="warning">Check the SKU, or add the item in Inventory.</Alert>}

          {item && (
            <div className="nv-panel" style={{ display: "grid", gap: 10 }}>
              <div className="nv-actions" style={{ justifyContent: "space-between" }}>
                <strong style={{ fontWeight: 500 }}>{item.name}</strong>
                <Badge tone={item.stock <= (item.low || 5) ? "danger" : "success"}>{item.stock} in stock</Badge>
              </div>
              <span className="nv-muted">{formatCurrency(Number(item.price) || 0, cur)} · SKU {item.sku || "none"}{item.category ? ` · ${item.category}` : ""}</span>
              <div className="nv-actions" style={{ gap: 8, flexWrap: "wrap" }}>
                {item.sku && <Button onClick={() => go(`/pos?add=${encodeURIComponent(item.sku)}`)}><ShoppingCart size={14} aria-hidden="true" />Add to sale</Button>}
                {[1, 5, 10].map((n) => <Button key={n} variant="secondary" onClick={() => void receive(n)}><PackagePlus size={14} aria-hidden="true" />+{n}</Button>)}
                <Button variant="ghost" onClick={() => void printBarcodeLabel({ sku: item.sku || String(item.id), name: item.name, price: Number(item.price) || 0, currency: cur, format: "CODE128" })}><Printer size={14} aria-hidden="true" />Label</Button>
                <Button variant="ghost" onClick={() => go(`/inventory?q=${encodeURIComponent(item.sku || item.name)}`)}><Pencil size={14} aria-hidden="true" />Edit</Button>
              </div>
            </div>
          )}

          {found?.kind === "ticket" && (
            <div className="nv-panel" style={{ display: "grid", gap: 10 }}>
              <div className="nv-actions" style={{ justifyContent: "space-between" }}>
                <strong style={{ fontWeight: 500 }}>Ticket #{found.ticket.id} · {found.ticket.device}</strong>
                <Badge>{found.ticket.status}</Badge>
              </div>
              <div className="nv-actions" style={{ gap: 8 }}>
                <Button onClick={() => go(`/bookings?ticket=${found.ticket.id}`)}><Ticket size={14} aria-hidden="true" />Open ticket</Button>
                <Button variant="secondary" onClick={() => go(`/pos?ticket=${found.ticket.id}`)}><ShoppingCart size={14} aria-hidden="true" />Take payment</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
