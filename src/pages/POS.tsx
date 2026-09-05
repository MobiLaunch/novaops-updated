import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ListBox, Select } from "@heroui/react";
import {
  Banknote,
  CheckCheck,
  CircleAlert,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Ticket as TicketIcon,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import PaymentModal from "@/components/payments/PaymentModal";
import type { Customer, InventoryItem, PosSaleItem, ShopSettings, Ticket, TicketPayment } from "@/types/domain";
import {
  sbCreatePosSale,
  sbFetchCustomers,
  sbFetchInventory,
  sbFetchShopSettings,
  sbFetchTickets,
  sbUpdateTicket,
  sbUpsertInventoryItem,
} from "@/lib/supabase";
import { printReceipt } from "@/lib/print";
import { formatCurrency, ticketBalanceDue } from "@/lib/utils";

interface CartLine {
  key: string;
  kind: "inventory" | "custom" | "ticket";
  inventoryId?: number;
  ticketId?: number;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
}

interface SaleResult {
  id: number;
  amount: number;
  method: string;
  customerName?: string;
}

export default function POS() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customCents, setCustomCents] = useState("0");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [lastReceiptItems, setLastReceiptItems] = useState<PosSaleItem[]>([]);
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [inv, tix, cust, settings] = await Promise.all([
      sbFetchInventory(),
      sbFetchTickets(),
      sbFetchCustomers(),
      sbFetchShopSettings(),
    ]);

    setLoading(false);
    if (inv.data) setInventory(inv.data);
    if (tix.data) setTickets(tix.data);
    if (cust.data) setCustomers(cust.data);
    if (settings.data) setShopSettings(settings.data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!scanFeedback) return;
    const t = setTimeout(() => setScanFeedback(null), 3000);

    return () => clearTimeout(t);
  }, [scanFeedback]);

  const categories = useMemo(() => Array.from(new Set(inventory.map((i) => i.category).filter(Boolean))), [inventory]);

  const filteredInventory = useMemo(() => {
    const q = query.trim().toLowerCase();

    return inventory.filter((i) => {
      const matches = !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q);
      const inCategory = !category || i.category === category;
      const purchasable = i.stock > 0 || i.category.toLowerCase().includes("service");

      return matches && inCategory && purchasable;
    });
  }, [inventory, query, category]);

  const ticketsWithBalance = useMemo(
    () => tickets.filter((t) => t.status !== "Delivered" && ticketBalanceDue(t) > 0),
    [tickets],
  );

  const addInventoryToCart = (item: InventoryItem) => {
    setCart((lines) => {
      const existing = lines.find((l) => l.kind === "inventory" && l.inventoryId === item.id);

      if (existing) return lines.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));

      return [...lines, { key: `inv-${item.id}`, kind: "inventory", inventoryId: item.id, name: item.name, price: Number(item.price), quantity: 1, sku: item.sku }];
    });
  };

  const addTicketToCart = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === Number(ticketId));

    if (!ticket) return;
    if (cart.some((l) => l.kind === "ticket" && l.ticketId === ticket.id)) {
      setScanFeedback({ ok: false, text: `Ticket #${ticket.id} is already in the cart.` });

      return;
    }
    setCart((lines) => [
      ...lines,
      {
        key: `tkt-${ticket.id}`,
        kind: "ticket",
        ticketId: ticket.id,
        name: `Ticket #${ticket.id} — ${ticket.device} ${ticket.device_model}`.trim(),
        price: ticketBalanceDue(ticket),
        quantity: 1,
      },
    ]);
    if (ticket.customer_id) setSelectedCustomerId(String(ticket.customer_id));
  };

  const addCustomToCart = () => {
    const amount = Number(customCents) / 100;

    if (amount <= 0) return;
    setCart((lines) => [...lines, { key: `custom-${Date.now()}`, kind: "custom", name: "Custom Amount", price: amount, quantity: 1 }]);
    setCustomCents("0");
  };

  const incrementLine = (key: string) => setCart((lines) => lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l)));
  const decrementLine = (key: string) =>
    setCart((lines) =>
      lines
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    );
  const removeLine = (key: string) => setCart((lines) => lines.filter((l) => l.key !== key));
  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId(null);
  };

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const taxRate = Number(shopSettings?.tax_rate || 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // ── Barcode scanning: a hardware scanner types fast + Enter. Any typing
  // over ~2 chars terminated by Enter (while focus isn't in a text field)
  // is treated as a scanned code — "TKT-<id>" adds a ticket's balance to
  // the cart, otherwise it's matched against inventory SKUs.
  const scanBuffer = useRef("");
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      const tag = (el as HTMLElement)?.tagName;

      return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement)?.isContentEditable;
    };

    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.key === "Enter") {
        const code = scanBuffer.current.trim();

        scanBuffer.current = "";
        if (scanTimer.current) clearTimeout(scanTimer.current);
        if (code.length > 2) processScan(code);

        return;
      }
      if (e.key.length === 1) {
        scanBuffer.current += e.key;
        if (scanTimer.current) clearTimeout(scanTimer.current);
        scanTimer.current = setTimeout(() => {
          scanBuffer.current = "";
        }, 60);
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, inventory, cart]);

  const processScan = (code: string) => {
    if (code.toUpperCase().startsWith("TKT-")) {
      const id = parseInt(code.slice(4), 10);
      const ticket = tickets.find((t) => t.id === id);

      if (ticket && ticketBalanceDue(ticket) > 0) {
        addTicketToCart(String(ticket.id));
        setScanFeedback({ ok: true, text: `Added Ticket #${ticket.id} to cart.` });
      } else {
        setScanFeedback({ ok: false, text: `Ticket ${code} not found or has no balance due.` });
      }

      return;
    }

    const item = inventory.find((i) => i.sku && i.sku.toUpperCase() === code.toUpperCase());

    if (item) {
      addInventoryToCart(item);
      setScanFeedback({ ok: true, text: `${item.name} added to cart.` });
    } else {
      setScanFeedback({ ok: false, text: `Barcode not recognized: ${code}` });
    }
  };

  const handleSaleComplete = async (payment: TicketPayment): Promise<boolean> => {
    const items: PosSaleItem[] = cart.map((l) => ({ name: l.name, price: l.price, quantity: l.quantity, sku: l.sku, ticketId: l.ticketId }));
    const customer = selectedCustomerId ? customers.find((c) => c.id === Number(selectedCustomerId)) : undefined;

    const { data: sale, error } = await sbCreatePosSale({
      customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
      items,
      subtotal,
      tax: taxAmount,
      total,
      payment_method: payment.method,
      note: cart.map((l) => `${l.quantity}x ${l.name}`).join(", "),
      status: "completed",
    });

    if (error || !sale) return false;

    // Deduct stock for real inventory lines (best-effort — a failure here
    // doesn't undo the sale, since the money has already moved).
    await Promise.all(
      cart
        .filter((l) => l.kind === "inventory" && l.inventoryId)
        .map((l) => {
          const item = inventory.find((i) => i.id === l.inventoryId);

          if (!item) return Promise.resolve();

          return sbUpsertInventoryItem({ id: item.id, stock: Math.max(0, item.stock - l.quantity) });
        }),
    );

    // Ticket lines settle the ticket itself: record the payment there too
    // and mark it Completed, same as collecting payment from the Tickets
    // page directly.
    await Promise.all(
      cart
        .filter((l) => l.kind === "ticket" && l.ticketId)
        .map((l) => {
          const ticket = tickets.find((t) => t.id === l.ticketId);

          if (!ticket) return Promise.resolve();

          return sbUpdateTicket(ticket.id, {
            payments: [...(ticket.payments || []), { amount: l.price, method: payment.method, at: payment.at }],
            status: "Completed",
          });
        }),
    );

    setInventory((rows) =>
      rows.map((r) => {
        const line = cart.find((l) => l.kind === "inventory" && l.inventoryId === r.id);

        return line ? { ...r, stock: Math.max(0, r.stock - line.quantity) } : r;
      }),
    );

    setLastReceiptItems(items);
    setSaleResult({ id: sale.id, amount: total, method: payment.method, customerName: customer?.name });
    setCheckoutOpen(false);
    clearCart();

    return true;
  };

  const handlePrintReceipt = () => {
    printReceipt({
      businessName: shopSettings?.business_name || "Receipt",
      businessAddress: shopSettings?.business_address || "",
      businessPhone: shopSettings?.business_phone || "",
      date: new Date().toLocaleString(),
      items: lastReceiptItems.map((i) => ({ name: i.name, qty: i.quantity, price: i.price })),
      subtotal,
      tax: taxAmount,
      total: saleResult?.amount || total,
      currency: "$",
      ticketRef: saleResult ? `S-${saleResult.id}` : undefined,
      customerName: saleResult?.customerName,
    });
  };

  return (
    <div>
      <PageHeader
        description={`${inventory.length} item${inventory.length !== 1 ? "s" : ""} in catalog · scan a barcode or tap to add`}
        eyebrow="Register"
        title="Point of Sale"
      />

      {scanFeedback && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
            scanFeedback.ok ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {scanFeedback.ok ? <CheckCheck className="size-4 shrink-0" /> : <CircleAlert className="size-4 shrink-0" />}
          {scanFeedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Products */}
        <section className="flex flex-col gap-3 lg:col-span-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
              placeholder="Search products & services…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                  !category ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:bg-surface-secondary"
                }`}
                type="button"
                onClick={() => setCategory(null)}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    category === c ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:bg-surface-secondary"
                  }`}
                  type="button"
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredInventory.map((item) => (
              <button
                key={item.id}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-3 text-left transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                type="button"
                onClick={() => addInventoryToCart(item)}
              >
                <div className="flex w-full items-start justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Package className="size-4" />
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                      item.stock <= item.low ? "bg-warning/15 text-warning" : "bg-surface-tertiary text-muted"
                    }`}
                  >
                    {item.stock}
                  </span>
                </div>
                <div className="min-w-0">
                  <strong className="block truncate text-sm leading-tight text-foreground">{item.name}</strong>
                  <span className="block truncate text-xs text-muted">{item.sku || item.category}</span>
                </div>
                <strong className="text-sm text-accent">{formatCurrency(item.price)}</strong>
              </button>
            ))}
          </div>

          {!loading && filteredInventory.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-secondary p-10 text-center">
              <Package className="size-8 text-muted" />
              <p className="m-0 text-sm text-muted">{query ? `No results for "${query}"` : "No inventory yet — add some in Inventory."}</p>
            </div>
          )}
        </section>

        {/* Cart */}
        <section className="flex flex-col lg:col-span-3">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border bg-accent-soft/40 px-4 py-3">
              <ShoppingCart className="size-4 text-accent" />
              <span className="flex-1 text-sm font-black text-foreground">Current Sale</span>
              {cart.length > 0 && (
                <Button isIconOnly aria-label="Clear cart" size="sm" variant="ghost" onPress={clearCart}>
                  <Trash2 className="size-4 text-danger" />
                </Button>
              )}
            </div>

            <div className="flex max-h-[360px] flex-col gap-1 overflow-y-auto p-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-muted">
                  <ShoppingCart className="size-8" />
                  <p className="m-0 text-sm font-semibold">Cart is empty</p>
                  <p className="m-0 text-xs">Tap a product or scan a barcode</p>
                </div>
              ) : (
                cart.map((line) => (
                  <div key={line.key} className="flex items-center gap-2 rounded-xl p-2 text-sm hover:bg-surface-secondary/60">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        line.kind === "ticket" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent"
                      }`}
                    >
                      {line.kind === "ticket" ? <TicketIcon className="size-4" /> : <Package className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-foreground">{line.name}</div>
                      <div className="text-[10px] text-muted">{formatCurrency(line.price)} ea.</div>
                    </div>
                    {line.kind === "inventory" ? (
                      <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-surface-secondary px-1">
                        <Button isIconOnly aria-label="Decrease quantity" size="sm" variant="ghost" onPress={() => decrementLine(line.key)}>
                          <Minus className="size-3" />
                        </Button>
                        <span className="min-w-4 text-center text-xs font-bold">{line.quantity}</span>
                        <Button isIconOnly aria-label="Increase quantity" size="sm" variant="ghost" onPress={() => incrementLine(line.key)}>
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button isIconOnly aria-label={`Remove ${line.name}`} size="sm" variant="ghost" onPress={() => removeLine(line.key)}>
                        <X className="size-3.5 text-danger" />
                      </Button>
                    )}
                    <span className="w-14 shrink-0 text-right text-xs font-black text-accent">{formatCurrency(line.price * line.quantity)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border bg-surface-secondary/30 p-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5">
                <span className="text-sm font-black text-foreground">Total</span>
                <span className="text-lg font-black text-accent">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Checkout */}
        <section className="flex flex-col gap-3 lg:col-span-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="mb-2 block text-micro font-bold uppercase text-muted">Customer (optional)</span>
            <Select placeholder="Walk-in" selectedKey={selectedCustomerId} onSelectionChange={(key) => setSelectedCustomerId(key ? String(key) : null)}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {customers.map((c) => (
                    <ListBox.Item key={c.id} id={String(c.id)}>
                      {c.name}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="mb-2 block text-micro font-bold uppercase text-muted">Add a ticket balance</span>
            <Select
              placeholder={ticketsWithBalance.length ? "Select an open ticket…" : "No tickets with a balance due"}
              selectedKey={null}
              onSelectionChange={(key) => key && addTicketToCart(String(key))}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {ticketsWithBalance.map((t) => (
                    <ListBox.Item key={t.id} id={String(t.id)}>
                      #{t.id} — {t.device} {t.device_model} · {formatCurrency(ticketBalanceDue(t))} due
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="mb-2 block text-micro font-bold uppercase text-muted">Custom amount</span>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                min="0"
                step="0.01"
                type="number"
                value={(Number(customCents) / 100).toFixed(2)}
                onChange={(e) => setCustomCents(String(Math.round(Number(e.target.value) * 100) || 0))}
              />
              <Button isDisabled={Number(customCents) <= 0} variant="outline" onPress={addCustomToCart}>
                <Plus className="size-4" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          <div className="flex-1" />

          <Button fullWidth isDisabled={cart.length === 0} size="lg" variant="primary" onPress={() => setCheckoutOpen(true)}>
            <Banknote className="size-4" />
            <span>{cart.length === 0 ? "Add items to cart" : `Charge ${formatCurrency(total)}`}</span>
          </Button>
        </section>
      </div>

      <PaymentModal
        amount={total}
        note={cart.map((l) => `${l.quantity}x ${l.name}`).join(", ")}
        open={checkoutOpen}
        referenceId={`pos-${Date.now()}`}
        title="Complete Sale"
        onClose={() => setCheckoutOpen(false)}
        onPaid={handleSaleComplete}
      />

      {saleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-[28px] bg-surface p-6 text-center shadow-2xl">
            <span className="flex size-16 items-center justify-center rounded-full bg-success text-white">
              <CheckCheck className="size-8" />
            </span>
            <div>
              <h2 className="m-0 text-xl font-black text-foreground">Sale complete!</h2>
              <p className="m-0 mt-1 text-xs font-bold text-muted">Sale #{saleResult.id}</p>
            </div>
            <div className="flex w-full flex-col gap-2 rounded-2xl bg-surface-secondary p-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Amount</span>
                <span className="font-black text-foreground">{formatCurrency(saleResult.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Method</span>
                <span className="font-black capitalize text-foreground">{saleResult.method}</span>
              </div>
              {saleResult.customerName && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted">Customer</span>
                  <span className="truncate font-black text-foreground">{saleResult.customerName}</span>
                </div>
              )}
            </div>
            <Button fullWidth variant="primary" onPress={() => setSaleResult(null)}>
              Done
            </Button>
            <Button fullWidth variant="outline" onPress={handlePrintReceipt}>
              <Printer className="size-4" />
              <span>Print Receipt</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
