import type { DeviceOption } from "@/lib/deviceCatalogue";

import { useEffect, useRef, useState } from "react";
import { Label } from "@heroui/react";
import { Search, X } from "lucide-react";

import { fetchDeviceCatalogue, searchDevices } from "@/lib/deviceCatalogue";
import { useDebounced } from "@/lib/utils";

interface DevicePickerProps {
  /** "Apple Phone" — goes to tickets.device. */
  device: string;
  /** "iPhone 15 Pro Max" — goes to tickets.device_model. */
  model: string;
  onChange: (next: { device: string; model: string }) => void;
}

/**
 * Type-to-search device field, backed by the catalogue the website's booking
 * wizard uses.
 *
 * The wizard walks four steps of chips — manufacturer, type, model,
 * generation — which suits a customer choosing one phone. At the counter it
 * would be four clicks per ticket, and with the full catalogue imported a
 * single step can run to eighty-odd chips. So this searches the flattened
 * list instead and writes the same two strings the wizard writes.
 *
 * Anything typed is still accepted as-is: the catalogue is a shortcut, never
 * a gate on taking a repair in.
 */
export default function DevicePicker({ device, model, onChange }: DevicePickerProps) {
  const [options, setOptions] = useState<DeviceOption[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const search = useDebounced(query, 150);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetchDeviceCatalogue().then((rows) => {
      if (!cancelled) setOptions(rows);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onDown);

    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const chosen = `${device} ${model}`.trim();

  if (chosen) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>Device</Label>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
          <span className="min-w-0">
            <strong className="block truncate text-sm text-foreground">{model || device}</strong>
            <span className="block truncate text-xs text-muted">{model ? device : "No model recorded"}</span>
          </span>
          <button
            aria-label="Clear device"
            className="shrink-0 text-muted hover:text-danger"
            type="button"
            onClick={() => {
              onChange({ device: "", model: "" });
              setQuery("");
            }}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  const results = searchDevices(options, search, 40);
  const typed = query.trim();

  return (
    <div ref={boxRef} className="relative flex flex-col gap-1.5">
      <Label>Device</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
          placeholder="Search devices, or type anything…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {/* Whatever was typed is always offered first, so an unlisted
              device never needs the catalogue to cooperate. */}
          {typed && (
            <button
              className="flex w-full flex-col items-start border-b border-border px-3 py-2 text-left transition-colors hover:bg-accent-soft"
              type="button"
              onClick={() => {
                onChange({ device: typed, model: "" });
                setOpen(false);
              }}
            >
              <strong className="text-sm text-foreground">Use “{typed}”</strong>
              <span className="text-xs text-muted">Not from the catalogue</span>
            </button>
          )}

          {options.length === 0 ? (
            <p className="m-0 px-3 py-3 text-sm text-muted">
              No device catalogue found. Type the device instead.
            </p>
          ) : results.length === 0 ? (
            <p className="m-0 px-3 py-3 text-sm text-muted">Nothing in the catalogue matches.</p>
          ) : (
            results.map((option) => (
              <button
                key={`${option.deviceType}|${option.model}`}
                className="flex w-full flex-col items-start px-3 py-2 text-left transition-colors hover:bg-accent-soft"
                type="button"
                onClick={() => {
                  onChange({ device: option.deviceType, model: option.model });
                  setOpen(false);
                  setQuery("");
                }}
              >
                <strong className="text-sm text-foreground">{option.model || option.deviceType}</strong>
                <span className="text-xs text-muted">{option.deviceType}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
