import { useState } from "react";

import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Switch } from "@/components/arc/switch/switch";
import { Textarea } from "@/components/arc/textarea/textarea";
import { toast } from "@/hooks/useToast";
import { getDocuments, saveDocuments, type ShopDocuments } from "@/lib/documents";

export function DocumentsSettings() {
  const [d, setD] = useState<ShopDocuments>(getDocuments);
  const set = <K extends keyof ShopDocuments>(k: K, v: ShopDocuments[K]) => setD((s) => ({ ...s, [k]: v }));

  return (
    <div className="nv-stack" style={{ marginTop: 16, maxWidth: 680, gap: 16 }}>
      <div className="nv-panel nv-form">
        <h2>Service agreement</h2>
        <Textarea label="Liability waiver" rows={3} description="Printed on service agreements" value={d.liabilityWaiver} onChange={(e) => set("liabilityWaiver", e.target.value)} />
        <Switch label="Require a signature at check-in" checked={d.requireWaiverSignature} onCheckedChange={(v: boolean) => set("requireWaiverSignature", v)} />
        <Textarea label="Service terms" rows={3} value={d.serviceTerms} onChange={(e) => set("serviceTerms", e.target.value)} />
        <Input label="Payment terms" value={d.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
      </div>
      <div className="nv-panel nv-form">
        <h2>Warranty</h2>
        <div className="nv-form-row">
          <Input label="Default warranty days" type="number" min={0} value={d.warrantyDays} onChange={(e) => set("warrantyDays", Number(e.target.value))} />
          <Input label="Coverage" value={d.warrantyCoverage} onChange={(e) => set("warrantyCoverage", e.target.value)} />
        </div>
        <Switch label="Water damage voids the warranty" checked={d.warrantyExcludeWater} onCheckedChange={(v: boolean) => set("warrantyExcludeWater", v)} />
      </div>
      <div className="nv-panel nv-form">
        <h2>Trade-ins</h2>
        <Switch label="Accept trade-ins" checked={d.tradeInEnabled} onCheckedChange={(v: boolean) => set("tradeInEnabled", v)} />
        <Switch label="Require ID for trade-ins" checked={d.tradeInRequireId} onCheckedChange={(v: boolean) => set("tradeInRequireId", v)} />
        <Textarea label="Trade-in policy" rows={3} value={d.tradeInPolicy} onChange={(e) => set("tradeInPolicy", e.target.value)} />
        <Input label="Support email" type="email" value={d.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
      </div>
      <div><Button onClick={() => { saveDocuments(d); toast.success("Documents saved", "New tickets and forms will use these defaults"); }}>Save documents</Button></div>
    </div>
  );
}
