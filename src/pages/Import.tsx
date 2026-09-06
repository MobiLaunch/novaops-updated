import { useRef, useState } from "react";
import { Button } from "@heroui/react";
import { CheckCircle2, CircleAlert, FileUp, Package, Upload, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { parseCsvWithHeader, pick } from "@/lib/csv";
import { sbBulkImportCustomers, sbBulkImportInventory } from "@/lib/supabase";

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  error: string | null;
}

function ImportCard({
  title,
  description,
  icon: Icon,
  sampleHeader,
  onImport,
}: {
  title: string;
  description: string;
  icon: typeof Users;
  sampleHeader: string;
  onImport: (rows: Record<string, string>[], onProgress: (done: number) => void) => Promise<ImportResult>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();

    setFileName(file.name);
    setRows(parseCsvWithHeader(text));
    setResult(null);
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    setResult(null);
    const outcome = await onImport(rows, setProgress);

    setImporting(false);
    setResult(outcome);
  };

  return (
    <div className="rounded-[28px] border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="m-0 text-lg font-bold text-foreground">{title}</h3>
          <p className="m-0 text-sm text-muted">{description}</p>
        </div>
      </div>

      <p className="m-0 mb-3 text-xs text-muted">
        Expected columns: <code className="rounded bg-surface-tertiary px-1.5 py-0.5">{sampleHeader}</code> (any order, case-insensitive).
      </p>

      <input
        ref={inputRef}
        accept=".csv"
        className="hidden"
        type="file"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onPress={() => inputRef.current?.click()}>
          <FileUp className="size-4" />
          <span>{fileName || "Choose CSV file…"}</span>
        </Button>
        {rows.length > 0 && (
          <Button isDisabled={importing} variant="primary" onPress={handleImport}>
            <Upload className="size-4" />
            <span>{importing ? `Importing ${progress}/${rows.length}…` : `Import ${rows.length} row${rows.length !== 1 ? "s" : ""}`}</span>
          </Button>
        )}
      </div>

      {result &&
        (result.error ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger">
            <CircleAlert className="size-4 shrink-0" />
            Import failed — {result.error}. Nothing was changed.
          </div>
        ) : (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm ${
              result.failed > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
            }`}
          >
            <CheckCircle2 className="size-4 shrink-0" />
            Imported {result.imported} of {result.total}
            {result.failed > 0 ? ` — ${result.failed} skipped (no name, or the write was rejected)` : ""}.
          </div>
        ))}
    </div>
  );
}

export default function Import() {
  const importCustomers = (rows: Record<string, string>[], onProgress: (done: number) => void) =>
    sbBulkImportCustomers(
      rows.map((row) => ({
        name: pick(row, "name", "fullname", "customername"),
        phone: pick(row, "phone", "phonenumber"),
        email: pick(row, "email", "emailaddress"),
        address: pick(row, "address"),
      })),
      onProgress,
    ).then((r) => ({ total: rows.length, imported: r.imported, failed: r.failed, error: r.error }));

  const importInventory = (rows: Record<string, string>[], onProgress: (done: number) => void) =>
    sbBulkImportInventory(
      rows.map((row) => ({
        name: pick(row, "name", "item", "itemname"),
        sku: pick(row, "sku"),
        category: pick(row, "category") || "Parts",
        model: "",
        stock: Number(pick(row, "stock", "qty", "quantity")) || 0,
        low: Number(pick(row, "low", "lowstock", "reorderlevel")) || 5,
        cost: Number(pick(row, "cost")) || 0,
        price: Number(pick(row, "price")) || 0,
      })),
      onProgress,
    ).then((r) => ({ total: rows.length, imported: r.imported, failed: r.failed, error: r.error }));

  return (
    <div>
      <PageHeader
        description="Bulk-load existing customer and inventory data from a spreadsheet export."
        eyebrow="Data Import"
        title="Import"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ImportCard
          description="Matches existing customers by phone or email — safe to re-import."
          icon={Users}
          sampleHeader="name, phone, email, address"
          title="Import Customers"
          onImport={importCustomers}
        />
        <ImportCard
          description="Adds new parts and accessories to your inventory."
          icon={Package}
          sampleHeader="name, sku, category, stock, low, cost, price"
          title="Import Inventory"
          onImport={importInventory}
        />
      </div>
    </div>
  );
}
