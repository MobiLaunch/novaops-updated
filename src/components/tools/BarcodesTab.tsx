import { useEffect, useRef, useState } from "react";
import { Download, Printer, Search } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Checkbox } from "@/components/arc/checkbox/checkbox";
import { Input } from "@/components/arc/input/input";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Select } from "@/components/arc/select/select";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { printBarcodeBatch, printBarcodeLabel } from "@/lib/print";
import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */
const FORMATS = [{ value: "CODE128", label: "CODE128" }, { value: "CODE39", label: "CODE39" }, { value: "EAN13", label: "EAN-13" }, { value: "UPC", label: "UPC-A" }, { value: "QR", label: "QR code" }];

export function BarcodesTab() {
  const { inventory, settings } = useAppStore();
  const cur = settings.currency || "$";
  const [mode, setMode] = useState("Generate");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [format, setFormat] = useState("CODE128");
  const [error, setError] = useState("");
  const [scan, setScan] = useState("");
  const [scanResult, setScanResult] = useState<{ found: boolean; item?: any } | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const svg = useRef<SVGSVGElement>(null);
  const qr = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode !== "Generate" || !value) return;

    const t = setTimeout(async () => {
      setError("");
      try {
        if (format === "QR") {
          const QR = (await import("qrcode")).default;

          if (qr.current) await QR.toCanvas(qr.current, value, { width: 180, margin: 2, color: { dark: "#1a1a1a", light: "#ffffff" } });
        } else {
          const JsBarcode = (await import("jsbarcode")).default;

          if (svg.current) JsBarcode(svg.current, value, { format, lineColor: "#1a1a1a", width: 2, height: 60, displayValue: true, fontSize: 13, margin: 10, background: "#ffffff" });
        }
      } catch (e) {
        const msg = (e as Error).message || "";

        setError(msg.includes("is not a valid") ? `"${value}" is not valid for ${format}` : msg || "Could not generate barcode");
      }
    }, 300);

    return () => clearTimeout(t);
  }, [value, format, mode]);

  const dataUrl = () => {
    if (format === "QR") return qr.current?.toDataURL() ?? null;
    if (!svg.current) return null;

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg.current))))}`;
  };
  const download = () => {
    const url = dataUrl();

    if (!url) return;
    Object.assign(document.createElement("a"), { href: url, download: `barcode-${value}.${format === "QR" ? "png" : "svg"}` }).click();
    toast.success("Downloaded", `barcode-${value}`);
  };
  const print = () => {
    void printBarcodeLabel({ sku: value, name: label || value, format: format === "QR" ? "QR" : "CODE128" });
    toast.success("Sent to printer", label || value);
  };
  const printBatch = () => {
    const items = inventory.filter((i) => selected.includes(i.id));

    void printBarcodeBatch(items.map((i: any) => ({ sku: i.sku || String(i.id), name: i.name, price: i.price, currency: cur, format: "CODE128" })));
    toast.success("Sent to printer", `${items.length} labels`);
  };
  const lookup = () => {
    const q = scan.toLowerCase().trim();

    if (!q) return;
    setScanResult((() => { const item = inventory.find((i: any) => i.sku === scan || String(i.id) === scan || i.name?.toLowerCase() === q); return { found: !!item, item }; })());
  };
  const useItem = (i: any) => { setValue(i.sku || String(i.id)); setLabel(i.name); setMode("Generate"); };

  return (
    <div className="nv-stack" style={{ marginTop: 16, gap: 16 }}>
      <SegmentedControl label="Mode" value={mode} onValueChange={(v: string) => setMode(v)} options={[{ value: "Generate", label: "Generate" }, { value: "Batch", label: "Batch print" }, { value: "Scan", label: "Scan lookup" }]} />

      {mode === "Generate" && (
        <div className="nv-grid cols-2">
          <div className="nv-panel nv-form">
            <Input label="Value" value={value} onChange={(e) => setValue(e.target.value)} />
            <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Select label="Format" value={format} onValueChange={setFormat} options={FORMATS} />
            {error && <Alert tone="danger" title={error} />}
            <div className="nv-actions"><Button onClick={print} disabled={!value || !!error}><Printer size={14} />Print</Button><Button variant="secondary" onClick={download} disabled={!value || !!error}><Download size={14} />Download</Button></div>
            <div>
              <h2>Pick from inventory</h2>
              <div className="nv-chip-row">{inventory.slice(0, 12).map((i: any) => <Button key={i.id} size="sm" variant="ghost" onClick={() => useItem(i)}>{i.name}</Button>)}</div>
            </div>
          </div>
          <div className="nv-panel" style={{ display: "grid", placeItems: "center", minHeight: 220, background: "#fff" }}>
            {!value ? <span className="nv-muted">Enter a value to preview</span> : format === "QR" ? <canvas ref={qr} /> : <svg ref={svg} />}
          </div>
        </div>
      )}

      {mode === "Batch" && (
        <div className="nv-panel">
          <div className="nv-actions" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>{selected.length} selected</h2>
            <div className="nv-actions">
              <Button size="sm" variant="ghost" onClick={() => setSelected(selected.length === inventory.length ? [] : inventory.map((i) => i.id))}>{selected.length === inventory.length ? "Clear" : "Select all"}</Button>
              <Button size="sm" onClick={printBatch} disabled={!selected.length}><Printer size={14} />Print labels</Button>
            </div>
          </div>
          {inventory.map((i: any) => (
            <div key={i.id} className="nv-row">
              <Checkbox label={i.name} checked={selected.includes(i.id)} onCheckedChange={() => setSelected((s) => (s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id]))} />
              <div className="nv-row-main"><span>SKU {i.sku || i.id}</span></div>
              <span>{formatCurrency(i.price, cur)}</span>
            </div>
          ))}
        </div>
      )}

      {mode === "Scan" && (
        <div className="nv-panel nv-form" style={{ maxWidth: 520 }}>
          <Input label="Scan or type a SKU, ID or name" value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} />
          <div><Button onClick={lookup}><Search size={14} />Look up</Button></div>
          {scanResult && (scanResult.found ? (
            <Alert tone="success" title={scanResult.item.name}>SKU {scanResult.item.sku || "none"} · {formatCurrency(scanResult.item.price, cur)} · {scanResult.item.stock} in stock</Alert>
          ) : <Alert tone="warning" title="No matching item" />)}
        </div>
      )}
    </div>
  );
}
