import type { Customer } from "@/types/domain";

import { useEffect, useRef, useState } from "react";
import { Label } from "@heroui/react";
import { Search, X } from "lucide-react";

import { sbSearchCustomers } from "@/lib/supabase";
import { useDebounced } from "@/lib/utils";

interface CustomerPickerProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  label?: string;
  placeholder?: string;
  /** Rendered above the field; use for a "no customer" hint. */
  hint?: string;
}

/**
 * Type-to-search customer field.
 *
 * The pickers on the register, the calendar, and the ticket form used to be
 * populated from a full read of the customers table — every name in the shop
 * loaded to pick one. This asks Postgres for the handful matching what's
 * been typed instead, so the cost doesn't grow with the customer list.
 */
export default function CustomerPicker({ value, onChange, label = "Customer", placeholder = "Search customers…", hint }: CustomerPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const search = useDebounced(query, 250);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setLoading(true);
    sbSearchCustomers(search).then((rows) => {
      if (cancelled) return;
      setLoading(false);
      setResults(rows);
    });

    return () => {
      cancelled = true;
    };
  }, [search, open]);

  // Clicking anywhere else closes the list without picking anything.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onDown);

    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
          <span className="min-w-0">
            <strong className="block truncate text-sm text-foreground">{value.name}</strong>
            <span className="block truncate text-xs text-muted">{value.phone || value.email || "No contact details"}</span>
          </span>
          <button aria-label="Clear customer" className="shrink-0 text-muted hover:text-danger" type="button" onClick={() => onChange(null)}>
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {hint && !open && <span className="text-xs text-muted">{hint}</span>}

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {loading && results.length === 0 ? (
            <p className="m-0 px-3 py-3 text-sm text-muted">Searching…</p>
          ) : results.length === 0 ? (
            <p className="m-0 px-3 py-3 text-sm text-muted">{query ? `No customers match "${query}".` : "No customers yet."}</p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                className="flex w-full flex-col items-start px-3 py-2 text-left transition-colors hover:bg-accent-soft"
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <strong className="text-sm text-foreground">{c.name}</strong>
                <span className="text-xs text-muted">{c.phone || c.email || "No contact details"}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
