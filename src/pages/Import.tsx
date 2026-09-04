import { useRef, useState } from "react";
import { Button } from "@heroui/react";
import { CheckCircle2, FileUp, Package, Upload, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { parseCsvWithHeader, pick } from "@/lib/csv";
import { sbFindOrCreateCustomer, sbUpsertInventoryItem } from "@/lib/supabase";

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
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

      {result && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="size-4" />
          Imported {result.imported} of {result.total}
          {result.failed > 0 ? ` — ${result.failed} failed` : ""}.
        </div>
      )}
    </div>
  );
}

export default function Import() {
  const importCustomers = async (rows: Record<string, string>[], onProgress: (done: number) => void): Promise<ImportResult> => {
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = pick(row, "name", "fullname", "customername");

      if (name) {
        const { data } = await sbFindOrCreateCustomer({
          name,
          phone: pick(row, "phone", "phonenumber"),
          email: pick(row, "email", "emailaddress"),
          address: pick(row, "address"),
        });

        if (data) imported++;
        else failed++;
      } else {
        failed++;
      }
      onProgress(i + 1);
    }

    return { total: rows.length, imported, failed };
  };

  const importInventory = async (rows: Record<string, string>[], onProgress: (done: number) => void): Promise<ImportResult> => {
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = pick(row, "name", "item", "itemname");

      if (name) {
        const { data } = await sbUpsertInventoryItem({
          name,
          sku: pick(row, "sku"),
          category: pick(row, "category") || "Parts",
          stock: Number(pick(row, "stock", "qty", "quantity")) || 0,
          low: Number(pick(row, "low", "lowstock", "reorderlevel")) || 5,
          cost: Number(pick(row, "cost")) || 0,
          price: Number(pick(row, "price")) || 0,
        });

        if (data) imported++;
        else failed++;
      } else {
        failed++;
      }
      onProgress(i + 1);
    }

    return { total: rows.length, imported, failed };
  };

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
