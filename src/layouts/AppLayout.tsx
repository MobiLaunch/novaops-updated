import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Drawer } from "@heroui/react";

import CommandPalette from "@/components/CommandPalette";

import SidebarContent from "./SidebarContent";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border bg-surface/80 px-3 py-2 backdrop-blur-xl sm:px-5 lg:hidden">
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close side menu" : "Open side menu"}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-secondary"
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
          <strong>NovaOps</strong>
        </header>

        <main className="min-w-0 flex-1 px-3 py-4 pb-8 sm:px-5 sm:py-6 lg:px-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
