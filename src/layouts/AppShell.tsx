import { getSupabase } from "@/lib/supabase";
import { Suspense, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, Search, CalendarDays, Command, ScanLine, Ellipsis, LayoutDashboard, Globe, LogOut, MessageSquare, Package, Plus, Receipt, Settings, Users, Wrench } from "lucide-react";

import { Drawer, DrawerContent } from "@/components/arc/drawer/drawer";
import { Avatar } from "@/components/arc/avatar/avatar";
import { Button } from "@/components/arc/button/button";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { CommandPalette } from "@/components/arc/command-palette/command-palette";
import { DropdownMenu } from "@/components/arc/dropdown-menu/dropdown-menu";
import { ThemeSwitch } from "@/components/arc/theme-switch/theme-switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/arc/popover/popover";
import { fromNow, useUpcoming } from "@/components/app/UpcomingPanel";
import { NotificationsButton } from "@/components/app/NotificationsButton";
import { NewTicketDialog } from "@/components/app/NewTicketDialog";
import { HouseCallDialog } from "@/components/app/HouseCallDialog";
import { CustomerEditDialog } from "@/components/app/CustomerEditDialog";
import { useScreenLock } from "@/hooks/useScreenLock";
import { useAppStore } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { ShortcutsDialog } from "@/components/app/ShortcutsDialog";
import { OfflineBanner } from "@/components/app/OfflineBanner";
import { ScanDialog } from "@/components/app/ScanDialog";
import { SideWidgets } from "@/components/app/SideWidgets";
import { prefetchRoute } from "@/lib/prefetch";
import { useShopCounts, type ShopCounts } from "@/lib/useShopCounts";
import { isElectron } from "@/lib/supabase";

type NavItem = { to: string; label: string; icon: typeof Package; badge?: keyof ShopCounts };

// Grouped by what the owner is doing, not by when each page was built.
/* eslint-disable @typescript-eslint/no-explicit-any */
const GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Workspace", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/bookings", label: "Bookings", icon: CalendarDays },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/messages", label: "Messages", icon: MessageSquare, badge: "unread" },
  ] },
  { label: "Shop", items: [
    { to: "/pos", label: "POS", icon: Receipt },
    { to: "/inventory", label: "Inventory", icon: Package, badge: "low" },
    { to: "/website", label: "Website", icon: Globe, badge: "toShip" },
  ] },
  { label: "Insights", items: [
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/library", label: "Library", icon: BookOpen },
    { to: "/tools", label: "Tools", icon: Wrench },
  ] },
];
/** Staff sign-ins don't get revenue, web orders or settings. */
const STAFF_BLOCKED = ["/analytics", "/website", "/settings"];
const NAV: NavItem[] = GROUPS.flatMap((g) => g.items);
const byTo = (to: string) => NAV.find((n) => n.to === to)!;

type Theme = "light" | "dark";
const THEME_KEY = "novaops_theme";

function readTheme(): Theme {
  try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
}

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const businessName = useAppStore((s) => s.settings.businessName);
  const email = useAppStore((s) => s.user?.email as string | undefined);
  const isStaff = useAppStore((s) => s.role === "staff");
  const [theme, setTheme] = useState<Theme>(readTheme);
  const dialog = useUi((u) => u.quickAction);
  const setDialog = useUi((u) => u.openQuickAction);
  const [palette, setPalette] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [more, setMore] = useState(false);
  const upcoming = useUpcoming(6);
  const counts = useShopCounts();
  const [scanOpen, setScanOpen] = useState(false);
  const [scanCode, setScanCode] = useState("");

  // A handheld scanner types the code very fast and ends with Enter. On any page except the register
  // (which handles it itself), open the scan dialog with the result.
  // The More sheet closes on every route change, even if a tap on its link didn't reach onClick.
  useEffect(() => { setMore(false); }, [pathname]);

  useEffect(() => {
    if (isStaff && STAFF_BLOCKED.some((p) => pathname.startsWith(p))) navigate("/dashboard", { replace: true });
  }, [isStaff, pathname, navigate]);

  useEffect(() => {
    let buf = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;

      if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable || window.location.pathname.startsWith("/pos")) return;
      if (e.key === "Enter") {
        if (buf.length > 3) { setScanCode(buf); setScanOpen(true); }
        buf = "";
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        buf += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buf = ""; }, 50);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => { window.removeEventListener("keydown", onKey); clearTimeout(timer); };
  }, []);

  useScreenLock(true);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  // Global shortcuts: ⌘K palette, ⌘T/H/U quick create, ⌘D/B/A/, navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;

      if (el?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) return void setShortcuts(true);
      if (!(e.metaKey || e.ctrlKey)) return;

      const map: Record<string, () => void> = {
        k: () => setPalette(true),
        t: () => setDialog("ticket"),
        h: () => setDialog("housecall"),
        u: () => setDialog("customer"),
        r: () => navigate("/pos"),
        d: () => navigate("/dashboard"),
        b: () => navigate("/tools"),
        i: () => navigate("/tools"),
        a: () => navigate("/analytics"),
        ",": () => navigate("/settings"),
      };
      const fn = map[e.key.toLowerCase()];

      if (fn) { e.preventDefault(); fn(); }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, setDialog]);

  const tickets = useAppStore((st) => st.tickets);
  const customerList = useAppStore((st) => st.customers);
  const inventory = useAppStore((st) => st.inventory);

  // Gift cards, register sales and web orders load only when search opens.
  const [extra, setExtra] = useState<Array<{ id: string; label: string; description?: string; group: string; keywords?: string[] }>>([]);

  useEffect(() => {
    const sb = getSupabase();

    if (!palette || !sb) return;
    let live = true;

    void Promise.all([
      sb.from("gift_cards").select("code,balance,status").order("created_at", { ascending: false }).limit(100),
      sb.from("pos_sales").select("id,total,payment_method,created_at").order("created_at", { ascending: false }).limit(100),
      sb.from("orders").select("id,customer_name,customer_email,status,total").order("created_at", { ascending: false }).limit(100),
    ]).then(([g, s, o]) => {
      if (!live) return;
      setExtra([
        ...((g.data as any[]) || []).map((c) => ({ id: `gift:${c.code}`, label: c.code, description: `Gift card · ${c.status === "void" ? "void" : `${Number(c.balance).toFixed(2)} left`}`, group: "Gift cards" })),
        ...((s.data as any[]) || []).map((x) => ({ id: `sale:${x.id}`, label: `Sale S-${x.id}`, description: `${Number(x.total).toFixed(2)} · ${x.payment_method} · ${new Date(x.created_at).toLocaleDateString()}`, group: "Register sales", keywords: [`S-${x.id}`, String(x.id)] })),
        ...((o.data as any[]) || []).map((x) => ({ id: `order:${x.id}`, label: `Order ${String(x.id).slice(0, 8).toUpperCase()}`, description: `${x.customer_name || x.customer_email || "Customer"} · ${x.status} · ${Number(x.total).toFixed(2)}`, group: "Web orders", keywords: [String(x.id), x.customer_email || ""] })),
      ]);
    });

    return () => { live = false; };
  }, [palette]);

  const commands = useMemo(() => [
    ...NAV.map((n) => ({ id: `go:${n.to}`, label: n.label, group: "Go to", icon: <n.icon size={16} /> })),
    { id: "go:/settings", label: "Settings", group: "Go to", icon: <Settings size={16} />, shortcut: "⌘," },
    { id: "act:scan", label: "Scan an item", group: "Create", icon: <ScanLine size={16} /> },
    { id: "new:ticket", label: "New ticket", group: "Create", shortcut: "⌘T" },
    { id: "new:housecall", label: "New house call", group: "Create", shortcut: "⌘H" },
    { id: "new:customer", label: "New customer", group: "Create", shortcut: "⌘U" },
    ...tickets.slice(0, 200).map((t) => ({ id: `ticket:${t.id}`, label: `#${t.id} ${t.device} ${t.deviceModel || ""}`.trim(), description: `${customerList.find((c) => c.id === t.customerId)?.name || "Unknown"} · ${t.status}`, group: "Tickets", keywords: [String(t.id), t.issue, t.deviceModel || ""] })),
    ...customerList.slice(0, 200).map((c) => ({ id: `customer:${c.id}`, label: c.name, description: [c.phone, c.email].filter(Boolean).join(" · "), group: "Customers", keywords: [c.phone, c.email].filter(Boolean) })),
    ...inventory.slice(0, 200).map((i: any) => ({ id: `item:${i.id}`, label: i.name, description: `SKU ${i.sku || "none"} · ${i.category}`, group: "Inventory", keywords: [i.sku || "", i.category || ""] })),
    ...extra,
  ], [tickets, customerList, inventory, extra]);

  const onCommand = (id: string) => {
    setPalette(false);
    if (id === "act:scan") { setScanCode(""); setScanOpen(true); }
    else if (id.startsWith("go:")) navigate(id.slice(3));
    else if (id.startsWith("ticket:")) navigate(`/bookings?ticket=${id.slice(7)}`);
    else if (id.startsWith("customer:")) navigate(`/customers?highlight=${id.slice(9)}`);
    else if (id.startsWith("item:")) navigate("/inventory");
    else if (id.startsWith("gift:")) navigate(`/pos?gift=${encodeURIComponent(id.slice(5))}`);
    else if (id.startsWith("sale:")) navigate("/pos?sales=1");
    else if (id.startsWith("order:")) navigate("/website?tab=orders");
    else setDialog(id.slice(4) as "ticket" | "housecall" | "customer");
  };

  const name = businessName || "NovaOps";

  return (
    <div className={`nv-shell${isElectron() ? " electron-app" : ""}`}>
      {isElectron() && <div className="nv-electron-titlebar" />}
      <aside className="nv-side">
        <div className="nv-brand"><span className="nv-brand-mark">N</span>{name}</div>
        <nav className="nv-nav" aria-label="Main">
          {GROUPS.map((g) => ({ ...g, items: g.items.filter((n) => !isStaff || !STAFF_BLOCKED.includes(n.to)) })).filter((g) => g.items.length).map((g) => (
            <div key={g.label} className="nv-nav-group" data-group={g.label.toLowerCase()} role="group" aria-label={g.label}>
              <span className="nv-nav-label">{g.label}</span>
              {g.items.map((n) => {
                const count = n.badge ? counts[n.badge] : 0;

                return (
                  <NavLink key={n.to} to={n.to} className="nv-link" onFocus={() => prefetchRoute(n.to)} onMouseEnter={() => prefetchRoute(n.to)}>
                    <span className="nv-link-icon"><n.icon size={15} /></span>
                    <span className="nv-link-text">{n.label}</span>
                    {count > 0 && <span key={count} className="nv-link-badge" aria-label={`${count} need attention`}>{count > 99 ? "99+" : count}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        {!isStaff && <SideWidgets counts={counts} />}
        <div className="nv-side-foot">
          {!isStaff && <NavLink to="/settings" className="nv-link"><Settings size={17} />Settings</NavLink>}
        </div>
      </aside>

      <div className="nv-main">
        <OfflineBanner />
        <header className="nv-top">
          <Button variant="secondary" size="sm" className="nv-hide-mobile" onClick={() => setPalette(true)}><Command size={14} /><span className="nv-hide-mobile">Search</span><span className="nv-muted nv-hide-mobile">⌘K</span></Button>
          <Button variant="secondary" size="sm" className="nv-mobile-only" aria-label="Search" onClick={() => setPalette(true)}><Search size={16} /></Button>
          <Button variant="secondary" size="sm" aria-label="Scan an item" onClick={() => { setScanCode(""); setScanOpen(true); }}><ScanLine size={14} /><span className="nv-hide-mobile">Scan</span></Button>
          <div className="nv-top-spacer" />
          <DropdownMenu
            label="Create"
            icon={<Plus size={14} />}
            items={[
              { label: "New ticket", onSelect: () => setDialog("ticket") },
              { label: "House call", onSelect: () => setDialog("housecall") },
              { label: "New customer", onSelect: () => setDialog("customer") },
              { label: "Open register", onSelect: () => navigate("/pos"), separatorBefore: true },
            ]}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="nv-hide-mobile" aria-label={`Upcoming, ${upcoming.length}`}><CalendarDays size={16} />{upcoming.length > 0 && <span>{upcoming.length}</span>}</Button>
            </PopoverTrigger>
            <PopoverContent align="end">
              <div className="nv-stack" style={{ minWidth: 260 }}>
                <strong style={{ fontWeight: 500 }}>Upcoming</strong>
                {upcoming.length === 0 ? <span className="nv-muted">No upcoming tasks</span> : upcoming.map((u) => (
                  <button key={u.id} type="button" className="nv-row" style={{ all: "unset", cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }} onClick={() => navigate("/bookings")}>
                    <div className="nv-row-main"><strong>{u.title}</strong><span>{u.subtitle}</span></div>
                    <span className="nv-muted" style={{ fontSize: 12 }}>{fromNow(u.date)}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <NotificationsButton />
          <ThemeSwitch theme={theme} onThemeChange={setTheme} iconOnly label="Theme" />
          <Avatar className="nv-hide-mobile" name={email || name} size="sm" src={(() => { try { return localStorage.getItem("novaops_account_avatar") || undefined; } catch { return undefined; } })()} />
        </header>
        <main className="nv-content" key={pathname}><Suspense fallback={<div className="nv-center" aria-busy="true"><Skeleton lines={4} /></div>}><Outlet /></Suspense></main>
      </div>

      <nav className="nv-tabbar" aria-label="Primary">
        {[byTo("/dashboard"), byTo("/bookings"), byTo("/pos"), byTo("/messages")].map((n) => (
          <NavLink key={n.to} to={n.to}><n.icon size={20} />{n.label}</NavLink>
        ))}
        <button type="button" className="nv-tab-more" onClick={() => setMore(true)}><Ellipsis size={20} />More</button>
      </nav>

      <Drawer open={more} onOpenChange={setMore}>
        <DrawerContent side="bottom" title="More" description={businessName || "NovaOps"}>
          <div className="nv-stack nv-more">
            <div className="nv-more-grid">
              {[byTo("/customers"), byTo("/inventory"), byTo("/website"), byTo("/analytics"), byTo("/library"), byTo("/tools")].filter((n) => !isStaff || !STAFF_BLOCKED.includes(n.to)).map((n) => (
                <NavLink key={n.to} to={n.to} className="nv-link" onClick={() => setMore(false)}><n.icon size={17} />{n.label}</NavLink>
              ))}
              {!isStaff && <NavLink to="/settings" className="nv-link" onClick={() => setMore(false)}><Settings size={17} />Settings</NavLink>}
            </div>
            <div className="nv-actions" style={{ justifyContent: "space-between", padding: "4px 10px" }}>
              <span className="nv-muted">Appearance</span>
              <ThemeSwitch theme={theme} onThemeChange={setTheme} label="Theme" />
            </div>
            <Button variant="ghost" onClick={async () => { setMore(false); await useAppStore.getState().logout(); navigate("/login", { replace: true }); }}><LogOut size={14} />Sign out</Button>
          </div>
        </DrawerContent>
      </Drawer>

      <ScanDialog initialCode={scanCode} open={scanOpen} onOpenChange={setScanOpen} />

      {palette && (
        <Dialog open onOpenChange={setPalette}>
          <DialogContent title="Search" description="Find a customer, ticket, sale, gift card or order, or jump to a page">
            <CommandPalette items={commands} autoFocus onSelect={(i) => onCommand(i.id)} onClose={() => setPalette(false)} />
          </DialogContent>
        </Dialog>
      )}
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
      <NewTicketDialog open={dialog === "ticket"} onOpenChange={(o) => !o && setDialog(null)} />
      <HouseCallDialog open={dialog === "housecall"} onOpenChange={(o) => !o && setDialog(null)} />
      <CustomerEditDialog open={dialog === "customer"} onOpenChange={(o) => !o && setDialog(null)} />
    </div>
  );
}

