import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, CalendarDays, Command, LayoutDashboard, Package, Plus, Receipt, Settings, Users, Wrench } from "lucide-react";

import { Avatar } from "@/components/arc/avatar/avatar";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { CommandPalette } from "@/components/arc/command-palette/command-palette";
import { DropdownMenu } from "@/components/arc/dropdown-menu/dropdown-menu";
import { ThemeSwitch } from "@/components/arc/theme-switch/theme-switch";
import { NotificationsButton } from "@/components/app/NotificationsButton";
import { NewTicketDialog } from "@/components/app/NewTicketDialog";
import { HouseCallDialog } from "@/components/app/HouseCallDialog";
import { CustomerEditDialog } from "@/components/app/CustomerEditDialog";
import { useScreenLock } from "@/hooks/useScreenLock";
import { useAppStore } from "@/lib/store";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/pos", label: "POS", icon: Receipt },
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/tools", label: "Tools", icon: Wrench },
];

type Theme = "light" | "dark";
const THEME_KEY = "novaops_theme";

function readTheme(): Theme {
  try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
}

export type QuickAction = "ticket" | "housecall" | "customer";

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const businessName = useAppStore((s) => s.settings.businessName);
  const email = useAppStore((s) => s.user?.email as string | undefined);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [dialog, setDialog] = useState<QuickAction | null>(null);
  const [palette, setPalette] = useState(false);

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
  }, [navigate]);

  const commands = useMemo(() => [
    ...NAV.map((n) => ({ id: `go:${n.to}`, label: n.label, group: "Go to", icon: <n.icon size={16} /> })),
    { id: "go:/settings", label: "Settings", group: "Go to", icon: <Settings size={16} />, shortcut: "⌘," },
    { id: "new:ticket", label: "New ticket", group: "Create", shortcut: "⌘T" },
    { id: "new:housecall", label: "New house call", group: "Create", shortcut: "⌘H" },
    { id: "new:customer", label: "New customer", group: "Create", shortcut: "⌘U" },
  ], []);

  const onCommand = (id: string) => {
    setPalette(false);
    if (id.startsWith("go:")) navigate(id.slice(3));
    else setDialog(id.slice(4) as QuickAction);
  };

  const name = businessName || "NovaOps";

  return (
    <div className="nv-shell">
      <aside className="nv-side">
        <div className="nv-brand"><span className="nv-brand-mark">N</span>{name}</div>
        <nav className="nv-nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="nv-link"><n.icon size={17} />{n.label}</NavLink>
          ))}
        </nav>
        <div className="nv-side-foot">
          <NavLink to="/settings" className="nv-link"><Settings size={17} />Settings</NavLink>
        </div>
      </aside>

      <div className="nv-main">
        <header className="nv-top">
          <span className="nv-mobile-only nv-brand"><span className="nv-brand-mark">N</span></span>
          <Button variant="secondary" size="sm" onClick={() => setPalette(true)}><Command size={14} />Search<span className="nv-muted">⌘K</span></Button>
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
          <NotificationsButton />
          <ThemeSwitch theme={theme} onThemeChange={setTheme} iconOnly label="Theme" />
          <Avatar name={email || name} size="sm" />
        </header>
        <main className="nv-content" key={pathname}><Outlet /></main>
      </div>

      <nav className="nv-tabbar" aria-label="Primary">
        {[NAV[0], NAV[1], NAV[2], NAV[4], NAV[3]].map((n) => (
          <NavLink key={n.to} to={n.to}><n.icon size={20} />{n.label}</NavLink>
        ))}
      </nav>

      {palette && (
        <Dialog open onOpenChange={setPalette}>
          <DialogContent title="Search" description="Jump to a page or create something">
            <CommandPalette items={commands} autoFocus onSelect={(i) => onCommand(i.id)} onClose={() => setPalette(false)} />
          </DialogContent>
        </Dialog>
      )}
      <NewTicketDialog open={dialog === "ticket"} onOpenChange={(o) => !o && setDialog(null)} />
      <HouseCallDialog open={dialog === "housecall"} onOpenChange={(o) => !o && setDialog(null)} />
      <CustomerEditDialog open={dialog === "customer"} onOpenChange={(o) => !o && setDialog(null)} />
    </div>
  );
}

