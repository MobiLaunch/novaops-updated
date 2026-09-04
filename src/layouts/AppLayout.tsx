import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { Drawer } from "@heroui/react";

import CommandPalette from "@/components/CommandPalette";
import ElectronTitlebar from "@/components/ElectronTitlebar";
import KeyboardShortcutsOverlay from "@/components/KeyboardShortcutsOverlay";
import NotificationsPanel from "@/components/NotificationsPanel";
import ThemeToggle from "@/components/ThemeToggle";

import SidebarContent, { NAV_ITEMS } from "./SidebarContent";

function pageTitle(pathname: string) {
  const match = NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));

  return match?.label ?? "NovaOps";
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen min-h-screen w-full max-w-full flex-col overflow-hidden bg-background text-foreground">
      <ElectronTitlebar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-[272px] shrink-0 border-r border-border bg-surface/94 backdrop-blur-xl lg:flex lg:flex-col">
          <SidebarContent />
        </aside>

        <Drawer>
          <Drawer.Backdrop isOpen={mobileOpen} onOpenChange={setMobileOpen}>
            <Drawer.Content className="w-[min(88vw,320px)]" placement="left">
              <Drawer.Dialog>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface/80 px-3 py-2 backdrop-blur-xl sm:px-5 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close side menu" : "Open side menu"}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-secondary lg:hidden"
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
              <strong className="lg:hidden">NovaOps</strong>
              <span className="hidden text-sm font-semibold text-muted lg:block">{pageTitle(location.pathname)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground sm:flex"
                type="button"
                onClick={() => window.dispatchEvent(new Event("novaops:open-command-palette"))}
              >
                <Search className="size-4" />
                <span>Search…</span>
                <kbd className="ml-2 rounded-md border border-border bg-surface-secondary px-1.5 py-0.5 text-caption text-muted">⌘K</kbd>
              </button>
              <ThemeToggle />
              <NotificationsPanel />
            </div>
          </header>

          <main className="min-w-0 flex-1 px-3 py-4 pb-8 sm:px-5 sm:py-6 lg:px-6">
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette />
      <KeyboardShortcutsOverlay />
    </div>
  );
}
