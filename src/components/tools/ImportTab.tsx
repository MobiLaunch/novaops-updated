import { useState } from "react";
import { Download, FileDown, Upload } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { FileDropzone } from "@/components/arc/file-dropzone/file-dropzone";
import { toast } from "@/hooks/useToast";
import { importRows, readRows, type ImportKey } from "@/lib/importData";
import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */
const TYPES = [
  { key: "customers", label: "Customers", desc: "Name, phone, email columns" },
  { key: "inventory", label: "Inventory", desc: "Name, SKU, price, stock columns" },
  { key: "tickets", label: "Tickets", desc: "Device, issue, status, price columns" },
] as const;
const TEMPLATES: Record<string, string> = {
  customers: "name,phone,email,notes\nJane Smith,(555) 123-4567,jane@email.com,VIP customer\n",
  inventory: "name,sku,price,stock,category\niPhone 14 Screen,IPH14-SCR,89.99,5,Screens\n",
  tickets: "device,issue,status,price,customerId\niPhone 13,Cracked screen,Open,120,\n",
};

const download = (content: string, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));

  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
};

export function ImportTab() {
  const [results, setResults] = useState<Record<string, string>>({});
  const [log, setLog] = useState<{ id: number; message: string; time: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const counts = useAppStore((s) => ({ customers: s.customers.length, inventory: s.inventory.length, tickets: s.tickets.length }));

  const process = async (file: File, key: string) => {
    setBusy(key);
    try {
      const rows = await readRows(file, key as ImportKey);

      if (!rows.length) return setResults((r) => ({ ...r, [key]: "No rows found in the file." }));
      await importRows(key as ImportKey, rows);
      const msg = `Imported ${rows.length} ${key}`;

      setResults((r) => ({ ...r, [key]: msg }));
      setLog((l) => [{ id: Date.now(), message: msg, time: new Date().toLocaleTimeString() }, ...l]);
      toast.success("Import complete", msg);
    } catch (e) {
      setResults((r) => ({ ...r, [key]: `Import failed: ${(e as Error).message || "check the format and try again."}` }));
    } finally {
      setBusy(null);
    }
  };

  const exportData = (key: string, format: "csv" | "json") => {
    const data: any[] = (useAppStore.getState() as any)[key] ?? [];
    const stamp = new Date().toISOString().split("T")[0];

    if (format === "json") return download(JSON.stringify(data, null, 2), `${key}-export-${stamp}.json`, "application/json");
    if (!data.length) return void toast.warning("Nothing to export", "No data available");

    const headers = Object.keys(data[0]);

    download([headers.join(","), ...data.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n"), `${key}-export-${stamp}.csv`, "text/csv");
  };

  return (
    <div className="nv-stack" style={{ marginTop: 16, gap: 16 }}>
      <div className="nv-grid cols-3">
        {TYPES.map((t) => (
          <div key={t.key} className="nv-panel nv-stack">
            <div><strong style={{ fontWeight: 500 }}>{t.label}</strong><div className="nv-muted" style={{ fontSize: 13 }}>{t.desc}</div></div>
            <FileDropzone accept=".csv,.json" multiple={false} maxFiles={1} label={`Import ${t.label.toLowerCase()}`} description="Drop a CSV or JSON file" onFilesChange={(files) => files[0] && process(files[0], t.key)} />
            {busy === t.key && <span className="nv-muted">Importing…</span>}
            {results[t.key] && <span role="status">{results[t.key]}</span>}
            <div className="nv-actions">
              <Button size="sm" variant="ghost" onClick={() => download(TEMPLATES[t.key], `${t.key}-template.csv`, "text/csv")}><FileDown size={14} />Template</Button>
              <Button size="sm" variant="secondary" onClick={() => exportData(t.key, "csv")}><Download size={14} />CSV ({counts[t.key]})</Button>
              <Button size="sm" variant="secondary" onClick={() => exportData(t.key, "json")}><Upload size={14} style={{ transform: "rotate(180deg)" }} />JSON</Button>
            </div>
          </div>
        ))}
      </div>
      {log.length > 0 && (
        <div className="nv-panel"><h2>Import log</h2>{log.map((l) => <div key={l.id} className="nv-row"><div className="nv-row-main"><strong>{l.message}</strong></div><span className="nv-muted">{l.time}</span></div>)}</div>
      )}
    </div>
  );
}
