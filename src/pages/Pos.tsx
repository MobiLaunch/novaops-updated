import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Banknote, CreditCard, Hash, Minus, Plus, Printer, ShoppingBag, Trash2, Wallet } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { SearchField } from "@/components/arc/search-field/search-field";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { CustomerSelect } from "@/components/app/CustomerSelect";
import { PageHead } from "@/components/app/PageHead";
import { useSquarePayments } from "@/hooks/useSquarePayments";
import { addNotification } from "@/hooks/useNotifications";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { printReceipt, type ReceiptData } from "@/lib/print";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const METHODS = [
  { value: "Cash", label: "Cash", icon: Banknote },
  { value: "Card", label: "Card", icon: CreditCard },
  { value: "Afterpay", label: "Afterpay", icon: Wallet },
  { value: "Other", label: "Other", icon: Hash },
];

interface CartLine { id: string | number | null; name: string; price: number; quantity: number; sku?: string; isService?: boolean; isTicket?: boolean; ticketId?: number }

export default function Pos() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { inventory, services, settings, tickets } = useAppStore();
  const cur = settings.currency || "$";
  const m = (n: number) => formatCurrency(n, cur);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [method, setMethod] = useState("Cash");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [keypad, setKeypad] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: number; amount: number; method: string; customer?: string } | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [ticketMode, setTicketMode] = useState<number | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [mobile, setMobile] = useState<"products" | "cart">("products");

  const appId = (settings.squareApplicationId || import.meta.env.VITE_SQUARE_APPLICATION_ID || "").trim();
  const locId = (settings.squareLocationId || import.meta.env.VITE_SQUARE_LOCATION_ID || "").trim();
  const sandbox = settings.squareSandbox || import.meta.env.VITE_SQUARE_SANDBOX === "true" || appId.startsWith("sandbox-");
  const squareConfigured = !!(settings.squareAccessToken && settings.squareLocationId);
  const sdkReady = squareConfigured && !!appId && !!locId;
  const sq = useSquarePayments(appId, locId, sandbox);

  const items = useMemo(() => {
    const names = new Set(inventory.map((i) => (i.name || "").toLowerCase()));
    const extra = services.filter((s: any) => s.active !== false && !names.has((s.name || "").toLowerCase())).map((s: any) => ({ id: `svc-${s.id}`, name: s.name, price: s.price || 0, category: s.category || "Services", itemType: "service", stock: 9999, sku: "", description: s.description || "" }));

    return [...inventory, ...extra] as any[];
  }, [inventory, services]);
  const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))], [items]);
  const visible = items.filter((i) => {
    const s = q.toLowerCase();
    const isSvc = (i.itemType || "product") === "service";

    return (!s || (i.name || "").toLowerCase().includes(s) || (i.sku || "").toLowerCase().includes(s) || (i.description || "").toLowerCase().includes(s)) && (cat === "all" || i.category === cat) && (isSvc || i.stock > 0);
  });

  const taxRate = Number(settings.taxRate) || 0;
  const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const add = useCallback((item: any) => {
    const isService = (item.itemType || "product") === "service";

    setCart((c) => {
      const ex = c.find((i) => i.id === item.id);

      if (ex && !isService) return c.map((i) => (i === ex ? { ...i, quantity: i.quantity + 1 } : i));
      if (ex) return c;

      return [...c, { id: item.id, name: item.name, price: item.price, sku: item.sku, quantity: 1, isService }];
    });
    setMobile("cart");
  }, []);
  const step = (i: number, d: number) => setCart((c) => c.flatMap((l, j) => (j !== i ? [l] : l.quantity + d <= 0 ? [] : [{ ...l, quantity: l.quantity + d }])));
  const clear = () => { setCart([]); setCustomerId(null); };

  // ── Barcode scanner (fast keystrokes ending in Enter) ──
  const scanned = useRef("");
  const scanTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const processCode = useCallback(async (code: string) => {
    const st = useAppStore.getState();

    if (code.toUpperCase().startsWith("TKT-")) {
      const id = parseInt(code.slice(4), 10);

      if (!Number.isNaN(id)) {
        let t: any = st.tickets.find((x) => x.id === id);

        if (!t) { const { data } = (await getSupabase()?.from("tickets").select("*").eq("id", id).single()) ?? { data: null }; t = data && { ...data, customerId: data.customer_id }; }
        if (t) {
          setCart((c) => (c.some((i) => i.isTicket && i.ticketId === id) ? c : [...c, { id: `tkt-${id}`, name: `Ticket #${t.id} · ${t.device || "Device"}`, price: Number(t.price || 0), quantity: 1, isTicket: true, ticketId: t.id, isService: true }]));
          if (t.customerId) setCustomerId(t.customerId);
          toast.success("Ticket added", `Ticket #${t.id} is in the cart`);

          return;
        }
      }

      return void toast.danger("Not found", `Ticket missing or closed: ${code}`);
    }

    const p = st.inventory.find((i) => i.sku?.toUpperCase() === code.toUpperCase());

    if (p) { add(p); toast.success("Item added", p.name); } else toast.danger("Not found", `Barcode not recognized: ${code}`);
  }, [add]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === "Enter") {
        if (scanned.current.length > 2) void processCode(scanned.current.trim());
        scanned.current = "";
      } else if (e.key.length === 1) {
        scanned.current += e.key;
        clearTimeout(scanTimer.current);
        scanTimer.current = setTimeout(() => { scanned.current = ""; }, 50);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => { window.removeEventListener("keydown", onKey); clearTimeout(scanTimer.current); };
  }, [processCode]);

  // ── Entry from a ticket (?ticket=ID or ?ticketId=ID&amount=N) or an Afterpay return ──
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const tid = Number(params.get("ticketId") || params.get("ticket"));

    if (tid) {
      const t: any = tickets.find((x) => x.id === tid);
      const paid = ((t?.payments as any[]) ?? []).reduce((s, p) => s + (p.amount || 0), 0);
      const amount = params.get("amount") ? Number(params.get("amount")) : Math.max((t?.price || 0) - paid, 0);

      setTicketMode(tid);
      if (t?.customerId) setCustomerId(t.customerId);
      setCart([{ id: `tkt-${tid}`, name: t ? `Ticket #${tid} · ${t.device}` : `Ticket #${tid}`, price: amount, quantity: 1, isTicket: true, ticketId: tid, isService: true }]);
      setMobile("cart");
    }
    if (params.get("afterpay_success") === "true") {
      setMethod("Afterpay");
      try {
        const saved = localStorage.getItem("novaops_pending_pos_cart");

        if (saved) { setCart(JSON.parse(saved)); localStorage.removeItem("novaops_pending_pos_cart"); }
      } catch { /* ignore */ }
      setTimeout(() => void finishSaleRef.current("Afterpay"), 800);
      params.delete("afterpay_success");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Square card / Afterpay mounting ──
  useEffect(() => {
    let alive = true;

    if (method === "Card" && sdkReady) {
      setCardReady(false);
      const t = setTimeout(() => sq.attachCard("#card-container").then(() => alive && setCardReady(true)).catch((e) => toast.danger("Card form error", e.message)), 120);

      return () => { alive = false; clearTimeout(t); void sq.destroyCard(); };
    }
    if (method === "Afterpay" && sdkReady && total > 0) {
      const t = setTimeout(() => void sq.attachAfterpay("#afterpay-button", total).catch(() => undefined), 120);

      return () => { clearTimeout(t); void sq.destroyAfterpay(); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, sdkReady, method === "Afterpay" ? total : 0]);

  useEffect(() => () => { void sq.destroyAll(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sale ──
  const cartRef = useRef(cart);
  const totals = useRef({ subtotal, tax, total });

  cartRef.current = cart;
  totals.current = { subtotal, tax, total };

  const finishSale = async (finalMethod: string) => {
    const st = useAppStore.getState();
    const lines = cartRef.current;
    const t = totals.current;
    const customer = customerId ? st.customers.find((c) => c.id === customerId)?.name : undefined;
    const note = lines.map((i) => `${i.quantity}× ${i.name}`).join(", ");
    const sale = await st.createPosSale({ customerId, items: lines.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, sku: i.sku || undefined })), subtotal: t.subtotal, tax: t.tax, total: t.total, paymentMethod: finalMethod, note });

    // Deduct stock for physical products
    await Promise.all(lines.filter((i) => typeof i.id === "number" && !i.isService && !i.isTicket).map((i) => {
      const inv = st.inventory.find((x) => x.id === i.id);

      return inv ? st.updateInventoryItem(i.id as number, { stock: Math.max(0, inv.stock - i.quantity) }).catch((e: unknown) => console.warn("[POS] stock deduction failed", e)) : null;
    }));

    if (ticketMode) {
      const src: any = st.tickets.find((x) => x.id === ticketMode);

      if (src) await st.updateTicket(ticketMode, { payments: [...(src.payments || []), { amount: t.total, method: finalMethod, note: `Collected via POS · Sale #${sale.id}`, date: new Date().toISOString() }], status: "Completed" });
      setTicketMode(null);
    }

    const data: ReceiptData = {
      businessName: st.settings.businessName || "NovaOps", businessAddress: st.settings.address || "", businessPhone: st.settings.phone || "",
      date: new Date().toLocaleString(), items: lines.map((i) => ({ name: i.name, qty: i.quantity, price: i.price })),
      subtotal: t.subtotal, tax: t.tax, total: t.total, currency: st.settings.currency || "$", customerName: customer, ticketRef: `S-${sale.id}`,
    };

    setReceipt(data);
    try { if (JSON.parse(localStorage.getItem("novaops_printer_settings") || "{}").autoPrintReceipt) void printReceipt(data); } catch { /* ignore */ }
    addNotification("New sale", `${formatCurrency(t.total, data.currency)} via ${finalMethod}`, "success");
    setResult({ id: sale.id, amount: t.total, method: finalMethod, customer });
    clear();
    setStatus("");
    setMobile("products");
  };
  const finishSaleRef = useRef(finishSale);

  finishSaleRef.current = finishSale;

  const remoteCharge = async (sourceId: string, via: "Card" | "Afterpay") => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (squareConfigured) { headers["x-square-access-token"] = settings.squareAccessToken; headers["x-square-location-id"] = settings.squareLocationId; }

    const res = await fetch("/api/square/payment", { method: "POST", headers, body: JSON.stringify({ sourceId, amountCents: Math.round(total * 100), referenceId: `novaops-${via.toLowerCase()}-${Date.now()}`, note: cart.map((i) => `${i.quantity}× ${i.name}`).join(", ") }) });

    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `${via} charge failed`);
    await finishSale(via);
  };

  const checkout = async () => {
    if (!cart.length || processing) return;
    setProcessing(true);
    try {
      if (method === "Card") {
        if (!sq.hasCard()) return void toast.warning("Card form", "The card form isn't ready yet.");
        setStatus("Processing card…");
        await remoteCharge(await sq.tokenizeCard(), "Card");
      } else if (method === "Afterpay") {
        if (!sq.hasAfterpay()) return void toast.warning("Afterpay", "Afterpay isn't ready yet.");
        setStatus("Waiting for Afterpay approval…");
        await remoteCharge(await sq.tokenizeAfterpay(), "Afterpay");
      } else {
        await finishSale(method);
      }
    } catch (e) {
      setStatus("");
      toast.danger(`${method} payment failed`, (e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const keypadAdd = () => {
    const amt = parseFloat(keypad || "0") / 100;

    if (amt > 0) setCart((c) => [...c, { id: `custom-${Date.now()}`, name: "Custom amount", price: amt, quantity: 1 }]);
    setKeypad(null);
  };
  const press = (k: string) => setKeypad((v) => {
    const cur2 = v ?? "0";

    if (k === "C") return "0";
    if (k === "⌫") return cur2.length > 1 ? cur2.slice(0, -1) : "0";
    if (cur2.length >= 8) return cur2;

    return cur2 === "0" ? k : cur2 + k;
  });

  const cta = ({ Cash: `Collect ${m(total)} cash`, Card: `Charge ${m(total)} to card`, Afterpay: `Pay ${m(total)} with Afterpay`, Other: `Complete sale for ${m(total)}` } as Record<string, string>)[method];

  return (
    <>
      <PageHead title="Point of sale" subtitle={sandbox ? "Square sandbox mode" : "Ring up products, services and tickets"}>
        <div className="nv-mobile-only"><SegmentedControl label="Panel" value={mobile} onValueChange={(v: string) => setMobile(v as "products" | "cart")} options={[{ value: "products", label: "Products" }, { value: "cart", label: `Cart (${cart.length})` }]} /></div>
        <Button variant="secondary" onClick={() => setKeypad("0")}>Custom amount</Button>
      </PageHead>

      <div className="nv-pos">
        <section className="nv-pos-products" data-hidden={mobile !== "products"}>
          <div className="nv-panel nv-stack">
            <SearchField label="Search products and services" value={q} onValueChange={setQ} />
            <div className="nv-chip-row">
              {["all", ...categories].map((c) => <Button key={c} size="sm" variant={cat === c ? "primary" : "secondary"} onClick={() => setCat(c)}>{c === "all" ? "All" : c}</Button>)}
            </div>
          </div>
          {visible.length === 0 ? <EmptyState title="No items" description="Add products or services in Inventory." action={<Button onClick={() => navigate("/inventory")}>Open inventory</Button>} /> : (
            <div className="nv-grid cols-3" style={{ marginTop: 16 }}>
              {visible.map((i) => (
                <button key={i.id} type="button" className="nv-panel nv-tile" onClick={() => add(i)}>
                  <strong style={{ fontWeight: 500 }}>{i.name}</strong>
                  <span className="nv-muted" style={{ fontSize: 12 }}>{i.category}{(i.itemType || "product") !== "service" ? ` · ${i.stock} left` : ""}</span>
                  <span style={{ fontSize: 16 }}>{m(i.price)}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="nv-pos-cart nv-panel nv-stack" data-hidden={mobile !== "cart"}>
          <div className="nv-actions" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>{ticketMode ? `Ticket #${ticketMode}` : "Cart"}</h2>
            {cart.length > 0 && <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>}
          </div>
          <CustomerSelect value={customerId} onChange={setCustomerId} label="Customer (optional)" />
          {cart.length === 0 ? <EmptyState icon={<ShoppingBag size={20} />} title="Cart is empty" description="Tap an item or scan a barcode." /> : (
            <div>
              {cart.map((l, i) => (
                <div key={String(l.id) + i} className="nv-row">
                  <div className="nv-row-main"><strong>{l.name}</strong><span>{m(l.price)}{l.quantity > 1 ? ` × ${l.quantity}` : ""}</span></div>
                  {!l.isTicket && <>
                    <Button size="sm" variant="ghost" aria-label="Decrease" onClick={() => step(i, -1)}>{l.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}</Button>
                    <Button size="sm" variant="ghost" aria-label="Increase" onClick={() => step(i, 1)} disabled={l.isService}><Plus size={14} /></Button>
                  </>}
                  {l.isTicket && <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => step(i, -1)}><Trash2 size={14} /></Button>}
                </div>
              ))}
              <div className="nv-total"><span className="nv-muted">Subtotal</span><span>{m(subtotal)}</span></div>
              <div className="nv-total"><span className="nv-muted">Tax ({taxRate}%)</span><span>{m(tax)}</span></div>
              <div className="nv-total strong"><span>Total</span><span>{m(total)}</span></div>
            </div>
          )}

          <SegmentedControl label="Payment method" value={method} onValueChange={(v: string) => setMethod(v)} options={METHODS.map((x) => ({ value: x.value, label: x.label }))} />

          {method === "Card" && (sdkReady ? (
            <div><div id="card-container" style={{ minHeight: 90 }} />{!cardReady && <span className="nv-muted">Loading secure card form…</span>}</div>
          ) : <Alert tone="warning" title={squareConfigured ? "Add your Square Application ID in Settings" : "Connect Square in Settings to take cards"} />)}
          {method === "Afterpay" && (sdkReady ? <div id="afterpay-button" /> : <Alert tone="warning" title="Connect Square in Settings to use Afterpay" />)}
          {status && <p className="nv-muted" role="status" style={{ margin: 0 }}>{status}</p>}

          <Button size="lg" onClick={checkout} loading={processing} disabled={!cart.length || total <= 0 || (method === "Card" && !cardReady) || (method === "Afterpay" && !sdkReady)}>{cta}</Button>
        </aside>
      </div>

      <Dialog open={keypad !== null} onOpenChange={(o) => !o && setKeypad(null)}>
        <DialogContent title="Custom amount" description="Enter an amount to add to the cart">
          <div className="nv-stack">
            <div style={{ fontSize: 32, fontWeight: 500, textAlign: "center" }}>{m(parseFloat(keypad || "0") / 100)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((k) => <Button key={k} variant="secondary" size="lg" onClick={() => press(k)}>{k}</Button>)}
            </div>
            <Button size="lg" onClick={keypadAdd} disabled={!keypad || parseFloat(keypad) <= 0}>Add to cart</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent title="Sale complete" description={`Receipt S-${result?.id}`}>
          {result && (
            <div className="nv-stack">
              <div style={{ fontSize: 28, fontWeight: 500 }}>{m(result.amount)}</div>
              <span className="nv-muted">Paid by {result.method}{result.customer ? ` · ${result.customer}` : ""}</span>
              <div className="nv-actions">
                <Button variant="secondary" onClick={() => receipt && void printReceipt(receipt)}><Printer size={14} />Print receipt</Button>
                <Button onClick={() => setResult(null)}>New sale</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
