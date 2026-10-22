import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { BarChart } from "@/components/arc/bar-chart/bar-chart";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { DonutChart } from "@/components/arc/donut-chart/donut-chart";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Input } from "@/components/arc/input/input";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { SegmentedControl } from "@/components/arc/segmented-control/segmented-control";
import { Select } from "@/components/arc/select/select";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";
import { PageHead } from "@/components/app/PageHead";
import { useSquareData } from "@/hooks/useSquareData";
import { toast } from "@/hooks/useToast";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */
const RANGES = [{ value: "7", label: "7d" }, { value: "30", label: "30d" }, { value: "90", label: "3mo" }, { value: "365", label: "Year" }];
const PERIOD: Record<string, string> = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 3 months", "365": "Last year" };
const EXPENSE_CATS = ["Overhead", "Utilities", "Software", "Supplies", "Payroll", "Other"];

export default function Analytics() {
  const { tickets, customers, settings, expenses } = useAppStore();
  const cur = settings.currency || "$";
  const m = (n: number) => formatCurrency(n, cur);
  const [tab, setTab] = useState("overview");
  const [range, setRange] = useState("30");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: 0, category: "Overhead", date: new Date().toISOString().split("T")[0] });
  const square = useSquareData();
  const { isConfigured, fetchAll } = square;

  useEffect(() => {
    if (tab === "square" && isConfigured) void fetchAll(parseInt(range));
  }, [tab, range, isConfigured, fetchAll]);

  const d = useMemo(() => {
    const cutoff = new Date();

    cutoff.setDate(cutoff.getDate() - parseInt(range));

    const inRange = tickets.filter((t) => t.createdAt && new Date(t.createdAt) >= cutoff);
    const revenue = inRange.filter((t) => t.price > 0).reduce((a, t) => a + t.price, 0);
    const partsCost = inRange.reduce((a, t: any) => a + ((t.parts || []) as any[]).reduce((pa, p) => pa + (p.cost || 0) * (p.quantity || 1), 0), 0);
    const spend = partsCost + expenses.reduce((a, e) => a + e.amount, 0);
    const priced = inRange.filter((t) => t.price > 0);
    const months: { key: string; label: string; axisLabel: string; value: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);

      months.push({ key: `${dt.getFullYear()}-${dt.getMonth()}`, label: dt.toLocaleDateString([], { month: "long", year: "numeric" }), axisLabel: dt.toLocaleDateString([], { month: "short" }), value: 0 });
    }
    for (const t of tickets) {
      if (!t.createdAt) continue;

      const dt = new Date(t.createdAt);
      const slot = months.find((x) => x.key === `${dt.getFullYear()}-${dt.getMonth()}`);

      if (slot) slot.value += t.price || 0;
    }

    const counts = new Map<string, number>();

    tickets.forEach((t) => counts.set(t.status, (counts.get(t.status) || 0) + 1));

    const by = new Map<number, { name: string; revenue: number; count: number }>();

    for (const t of tickets) {
      const c = customers.find((x) => x.id === t.customerId);

      if (!c) continue;

      const e = by.get(c.id) ?? { name: c.name, revenue: 0, count: 0 };

      e.revenue += t.price || 0;
      e.count += 1;
      by.set(c.id, e);
    }

    return {
      revenue, partsCost, spend, net: revenue - spend, tax: revenue * ((parseFloat(settings.taxRate as any) || 0) / 100),
      avg: priced.length ? priced.reduce((a, t) => a + t.price, 0) / priced.length : 0, count: inRange.length,
      active: tickets.filter((t) => t.status !== "Closed" && t.status !== "Delivered").length,
      months, statuses: [...counts.entries()].map(([key, value]) => ({ key, label: key, value })).sort((a, b) => b.value - a.value),
      top: [...by.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6),
      expenseGroups: [
        { key: "parts", label: "Parts cost", value: partsCost },
        ...EXPENSE_CATS.map((c) => ({ key: c, label: c, value: expenses.filter((e) => e.category === c).reduce((a, e) => a + e.amount, 0) })),
      ].filter((x) => x.value > 0),
    };
  }, [tickets, customers, expenses, range, settings.taxRate]);

  const addExpense = async () => {
    if (!form.description || !form.amount) return;
    try {
      await useAppStore.getState().createExpense(form);
      toast.success("Expense logged", form.description);
      setAddOpen(false);
      setForm({ description: "", amount: 0, category: "Overhead", date: new Date().toISOString().split("T")[0] });
    } catch (e) {
      toast.danger("Could not log expense", (e as Error).message);
    }
  };
  const removeExpense = async (id: number) => {
    try { await useAppStore.getState().deleteExpense(id); toast.success("Expense removed"); } catch (e) { toast.danger("Could not delete", (e as Error).message); }
  };

  const exportReport = () => {
    const rows = [
      ["NovaOps Analytics Report"], ["Period", PERIOD[range]], [],
      ["Total revenue", m(d.revenue)], ["Tax collected", m(d.tax)], ["Total costs", m(d.spend)], ["Net profit", m(d.net)], [], ["EXPENSES"],
      ...expenses.map((e) => [`"${e.description}"`, m(e.amount), e.category, formatDate(e.date)]),
    ];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `novaops-analytics-${new Date().toISOString().split("T")[0]}.csv` });

    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHead title="Analytics" subtitle={PERIOD[range]}>
        <SegmentedControl label="Range" value={range} onValueChange={(v: string) => setRange(v)} options={RANGES} />
        <Button variant="secondary" onClick={exportReport}><Download size={14} />Export CSV</Button>
      </PageHead>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="square">Square</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="nv-grid cols-4" style={{ margin: "16px 0" }}>
            <MetricCard label="Revenue" value={d.revenue} context={PERIOD[range]} />
            <MetricCard label="Net profit" value={d.net} context={`After ${m(d.spend)} in costs`} />
            <MetricCard label="Active tickets" value={d.active} context={`${d.count} created this period`} />
            <MetricCard label="Average ticket" value={Math.round(d.avg)} context="Per priced job" />
          </div>
          <div className="nv-panel"><BarChart data={d.months} label="Revenue by month" period="Last 12 months" unit={cur} averageLabel="Monthly average" valueLabel="Revenue" categoryLabel="Month" formatValue={(v) => m(v)} /></div>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="nv-stack" style={{ marginTop: 16 }}>
            <div className="nv-actions" style={{ justifyContent: "space-between" }}>
              <strong style={{ fontWeight: 500 }}>Total costs {m(d.spend)}</strong>
              <Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} />Log expense</Button>
            </div>
            <div className="nv-grid cols-2">
              <div className="nv-panel">
                <h2>Cost breakdown</h2>
                {d.expenseGroups.length ? <DonutChart data={d.expenseGroups} label="Costs by category" formatValue={(v) => m(v)} totalLabel="Total costs" /> : <EmptyState title="No costs yet" description="Log an expense to see the breakdown." />}
              </div>
              <div className="nv-panel">
                <h2>Expenses</h2>
                {expenses.length === 0 ? <EmptyState title="No expenses" description="Rent, utilities, software and supplies go here." /> : expenses.map((e) => (
                  <div key={e.id} className="nv-row">
                    <div className="nv-row-main"><strong>{e.description}</strong><span>{formatDate(e.date)}</span></div>
                    <Badge>{e.category}</Badge>
                    <strong style={{ fontWeight: 500 }}>{m(e.amount)}</strong>
                    <Button size="sm" variant="ghost" aria-label="Delete expense" onClick={() => removeExpense(e.id as number)}><Trash2 size={14} /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="nv-grid cols-2" style={{ marginTop: 16 }}>
            <div className="nv-panel"><h2>Tickets by status</h2>{d.statuses.length ? <DonutChart data={d.statuses} label="Tickets by status" totalLabel="Tickets" /> : <EmptyState title="No tickets" description="Ticket status mix appears once you have tickets." />}</div>
            <div className="nv-panel">
              <h2>Top customers</h2>
              {d.top.length === 0 ? <EmptyState title="No customer data" description="Revenue per customer appears here." /> : d.top.map((c, i) => (
                <div key={c.name} className="nv-row"><span className="nv-muted">{i + 1}</span><div className="nv-row-main"><strong>{c.name}</strong><span>{c.count} tickets</span></div><strong style={{ fontWeight: 500 }}>{m(c.revenue)}</strong></div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="square">
          <div className="nv-stack" style={{ marginTop: 16 }}>
            {!isConfigured ? <Alert tone="info" title="Square isn't connected">Add your Square access token and location ID in Settings to import payments, payouts and customers.</Alert>
              : square.isLoading ? <Skeleton lines={5} label="Loading Square data" />
              : (
                <>
                  {Object.values(square.error).filter(Boolean).map((e) => <Alert key={e} tone="danger" title={e} />)}
                  <div className="nv-grid cols-4">
                    <MetricCard label="Square revenue" value={square.totalRevenue} context={`${square.payments.length} payments`} />
                    <MetricCard label="Fees" value={square.totalFees} context="Deducted by Square" />
                    <MetricCard label="Net revenue" value={square.netRevenue} context="After fees" />
                    <MetricCard label="Payouts" value={square.totalPayouts} context={`${square.payouts.length} deposits`} />
                  </div>
                  <div className="nv-grid cols-2">
                    <div className="nv-panel">
                      <h2>Payments ({square.payments.length})</h2>
                      {square.payments.length === 0 ? <EmptyState title="No payments" description="Nothing in this period." /> : square.payments.slice(0, 30).map((p: any) => (
                        <div key={p.id} className="nv-row">
                          <div className="nv-row-main"><strong>{p.cardBrand || "Payment"} {p.lastFour ? `••••${p.lastFour}` : ""}</strong><span>{formatDate(p.createdAt)}{p.note ? ` · ${p.note}` : ""}</span></div>
                          <Badge tone={p.status === "COMPLETED" ? "success" : "warning"}>{p.status.toLowerCase()}</Badge>
                          <strong style={{ fontWeight: 500 }}>{m(p.amount)}</strong>
                          {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="nv-muted">Receipt</a>}
                        </div>
                      ))}
                    </div>
                    <div className="nv-stack">
                      <div className="nv-panel">
                        <h2>Payouts ({square.payouts.length})</h2>
                        {square.payouts.length === 0 ? <p className="nv-muted">No payouts found.</p> : square.payouts.slice(0, 10).map((p: any) => (
                          <div key={p.id} className="nv-row"><div className="nv-row-main"><strong>{p.status === "PAID" ? "Deposited" : p.status}</strong><span>{p.arrivalDate || formatDate(p.createdAt)}</span></div><strong style={{ fontWeight: 500 }}>{m(p.amount)}</strong></div>
                        ))}
                      </div>
                      <div className="nv-panel">
                        <h2>Square customers ({square.sqCustomers.length})</h2>
                        {square.sqCustomers.length === 0 ? <p className="nv-muted">No customers found in Square.</p> : square.sqCustomers.slice(0, 10).map((c: any) => (
                          <div key={c.id} className="nv-row"><div className="nv-row-main"><strong>{c.name}</strong><span>{c.email || c.phone || "No contact"}</span></div></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent title="Log expense" description="Record a business cost">
          <div className="nv-form">
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="nv-form-row">
              <Input label="Amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              <Select label="Category" value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} options={EXPENSE_CATS.map((c) => ({ value: c, label: c }))} />
            </div>
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <div className="nv-actions" style={{ justifyContent: "flex-end" }}><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={addExpense} disabled={!form.description || !form.amount}>Log expense</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
