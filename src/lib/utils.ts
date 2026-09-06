import { useEffect, useRef, useState } from "react";

import type { Ticket, TicketPayment } from "@/types/domain";

// Supabase jsonb/array columns can come back as null, an unexpected shape
// (e.g. `{}` instead of `[]`, if a row predates a schema change or was
// inserted by an older client), or simply missing on an old row. `x || []`
// only falls back on falsy values, so a truthy non-array like `{}` still
// slips through and crashes the first `.map()`/`.length` call on it. This
// normalizes any value to a safe array.
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function formatCurrency(amount: number | string | null | undefined): string {
  return `$${Number(amount || 0).toFixed(2)}`;
}

// A ticket's price minus whatever's already been paid against it — shared by
// Tickets, PaymentModal, and the POS register (which can add a ticket's
// balance to a cart alongside retail items).
export function ticketBalanceDue(t: Ticket): number {
  return Number(t.price) - asArray<TicketPayment>(t.payments).reduce((sum, p) => sum + Number(p.amount), 0);
}

// Date-only columns (`tickets.due_date`, `appointments.date`, birthdays…)
// come back as "YYYY-MM-DD". Passing that straight to `new Date()` parses it
// as UTC midnight, which is the *previous day* everywhere west of UTC — so
// comparing it against a local midnight makes "today" read as yesterday.
// Appending a time forces local-time parsing instead.
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfToday(): Date {
  const d = new Date();

  d.setHours(0, 0, 0, 0);

  return d;
}

// Lets a text input stay instant while the expensive consumer (re-filtering
// a table, which rebuilds its whole row collection) runs once the typing
// pauses instead of on every keystroke.
export function useDebounced<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// A shop runs this on two screens at once — front desk and bench — and
// neither saw the other's changes until someone reloaded. Coming back to a
// tab now refreshes it. Throttled so alt-tabbing repeatedly doesn't turn
// into a burst of queries, and skipped entirely while the tab is hidden.
export function useRefetchOnFocus(refetch: () => void, minIntervalMs = 15000) {
  const lastRun = useRef(Date.now());
  const latest = useRef(refetch);

  useEffect(() => {
    latest.current = refetch;
  });

  useEffect(() => {
    const maybeRefetch = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRun.current < minIntervalMs) return;
      lastRun.current = Date.now();
      latest.current();
    };

    document.addEventListener("visibilitychange", maybeRefetch);
    window.addEventListener("focus", maybeRefetch);

    return () => {
      document.removeEventListener("visibilitychange", maybeRefetch);
      window.removeEventListener("focus", maybeRefetch);
    };
  }, [minIntervalMs]);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Client-side CSV download for exportable tables (e.g. Accounting's
// ledger) — no server round trip needed since the data's already loaded.
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? "");

          return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
