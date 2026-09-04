import type { LucideIcon } from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CalendarDays,
  CloudCheck,
  CloudOff,
  Database,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Repeat,
  SlidersHorizontal,
  Upload,
  Ticket as TicketIcon,
  Users,
  Wrench,
} from "lucide-react";
import { Chip, Link } from "@heroui/react";

import { useAuth } from "@/lib/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/tickets", icon: TicketIcon, label: "Tickets" },
  { path: "/customers", icon: Users, label: "Customers" },
  { path: "/inventory", icon: Package, label: "Inventory" },
  { path: "/trade-in", icon: Repeat, label: "Trade-In" },
  { path: "/calendar", icon: CalendarDays, label: "Calendar" },
  { path: "/messages", icon: Mail, label: "Messages" },
  { path: "/bookings", icon: CalendarClock, label: "Bookings" },
  { path: "/import", icon: Upload, label: "Import" },
  { path: "/settings", icon: SlidersHorizontal, label: "Settings" },
];

export default function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const usingSupabase = isSupabaseConfigured();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-[18px] pt-[22px]">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Wrench className="size-[22px]" />
        </span>
        <div>
          <strong className="block text-foreground">NovaOps</strong>
          <Chip color="default" size="sm">
            <Chip.Label>Repair Console</Chip.Label>
          </Chip>
        </div>
      </div>

      <div className="mx-5 border-t border-border" />

      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 px-3 py-4">
        <span className="mb-1 px-2 text-caption font-bold uppercase tracking-widest text-muted">
          Navigation
        </span>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-surface-secondary"
              }`}
              href={item.path}
              onClick={onNavigate}
            >
              <item.icon className="size-[18px] shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pb-4">
        <span className="mb-2 block text-caption font-bold uppercase tracking-widest text-muted">
          Database State
        </span>
        <div className="flex items-center gap-3 rounded-2xl bg-surface-secondary p-3">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
              usingSupabase ? "bg-success/15 text-success" : "bg-surface-tertiary text-muted"
            }`}
          >
            {usingSupabase ? <CloudCheck className="size-[18px]" /> : <CloudOff className="size-[18px]" />}
          </span>
          <div className="min-w-0">
            <span className={`block text-xs font-bold ${usingSupabase ? "text-success" : "text-foreground"}`}>
              {usingSupabase ? "Supabase Connected" : "Not Connected"}
            </span>
            <p className="m-0 truncate text-caption text-muted">
              {usingSupabase ? "Same project as the website" : "Configure in Settings"}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-5 border-t border-border" />

      <div className="flex flex-col gap-1 p-3">
        <button
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger/10"
          type="button"
          onClick={handleLogout}
        >
          <LogOut className="size-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
