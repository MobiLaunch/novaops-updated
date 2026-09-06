import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@heroui/react";
import {
  Calculator,
  CalendarDays,
  LayoutDashboard,
  Mail,
  Package,
  Repeat,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";

import type { Customer, InventoryItem, Ticket } from "@/types/domain";
import { sbFetchInventoryPage, sbFetchTicketsPage, sbSearchCustomers } from "@/lib/supabase";
import { useDebounced } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Point of Sale", path: "/pos", icon: ShoppingCart },
  { label: "Tickets", path: "/tickets", icon: TicketIcon },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Inventory", path: "/inventory", icon: Package },
  { label: "Trade-In", path: "/trade-in", icon: Repeat },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Messages", path: "/messages", icon: Mail },
  { label: "Accounting", path: "/accounting", icon: Calculator },
  { label: "Settings", path: "/settings", icon: SlidersHorizontal },
];

interface Result {
  key: string;
  label: string;
  sublabel: string;
  icon: typeof TicketIcon;
  onSelect: () => void;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searching, setSearching] = useState(false);
  const search = useDebounced(query, 200);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };

    const openHandler = () => setOpen(true);

    window.addEventListener("keydown", handler);
    window.addEventListener("novaops:open-command-palette", openHandler);

    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("novaops:open-command-palette", openHandler);
    };
  }, []);

  // Searches as you type instead of downloading every ticket, customer, and
  // inventory item the first time the palette is opened.
  useEffect(() => {
    const term = search.trim();

    if (!open || !term) {
      setTickets([]);
      setCustomers([]);
      setInventory([]);

      return;
    }

    let cancelled = false;

    setSearching(true);
    Promise.all([
      sbFetchTicketsPage({ search: term, pageSize: 6 }),
      sbSearchCustomers(term, 6),
      sbFetchInventoryPage({ search: term, pageSize: 6 }),
    ]).then(([t, c, i]) => {
      if (cancelled) return;
      setSearching(false);
      setTickets(t.rows);
      setCustomers(c);
      setInventory(i.rows);
    });

    return () => {
      cancelled = true;
    };
  }, [open, search]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();

    if (!q) return [];

    const ticketResults: Result[] = tickets.map((t) => ({
      key: `t-${t.id}`,
      label: `${t.device} ${t.device_model}`.trim(),
      sublabel: `Ticket #${t.id} · ${t.status}`,
      icon: TicketIcon,
      onSelect: () => go(`/tickets?open=${t.id}`),
    }));

    const customerResults: Result[] = customers.map((c) => ({
      key: `c-${c.id}`,
      label: c.name,
      sublabel: c.phone || c.email || "Customer",
      icon: Users,
      onSelect: () => go(`/customers?open=${c.id}`),
    }));

    const inventoryResults: Result[] = inventory.map((i) => ({
      key: `i-${i.id}`,
      label: i.name,
      sublabel: i.sku || "Inventory item",
      icon: Package,
      onSelect: () => go(`/inventory?open=${i.id}`),
    }));

    const navResults: Result[] = NAV_LINKS.filter((n) => n.label.toLowerCase().includes(q)).map((n) => ({
      key: `nav-${n.path}`,
      label: n.label,
      sublabel: "Go to page",
      icon: n.icon,
      onSelect: () => go(n.path),
    }));

    return [...ticketResults, ...customerResults, ...inventoryResults, ...navResults];
  }, [query, tickets, customers, inventory]);

  return (
    <Modal>
      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container size="md">
          <Modal.Dialog>
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="size-4 text-muted" />
              <input
                autoFocus
                className="w-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                placeholder="Search tickets, customers, inventory, or pages…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-micro font-bold text-muted">ESC</span>
            </div>
            <div className="max-h-[380px] overflow-y-auto p-2">
              {!query ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted">
                  <Search className="size-8" />
                  <p className="m-0">Type to search across everything, or press a page name.</p>
                </div>
              ) : results.length === 0 ? (
                <p className="m-0 p-8 text-center text-sm text-muted">
                  {searching || search !== query ? "Searching…" : `No results for "${query}"`}
                </p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.key}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary"
                    type="button"
                    onClick={r.onSelect}
                  >
                    <r.icon className="size-4 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-sm text-foreground">{r.label}</strong>
                      <span className="block truncate text-xs text-muted">{r.sublabel}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
