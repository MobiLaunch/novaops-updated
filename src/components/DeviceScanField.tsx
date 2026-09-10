import type { IdentifiedDevice } from "@/lib/deviceIdentify";

import { useRef, useState } from "react";
import { Label } from "@heroui/react";
import { Check, Loader2, ScanLine, TriangleAlert } from "lucide-react";

import { identifyDevice, isImei } from "@/lib/deviceIdentify";

interface DeviceScanFieldProps {
  /** Called with the device the code resolved to. */
  onIdentified: (device: IdentifiedDevice) => void;
  /** Called with whatever was scanned, resolved or not — it still goes on the ticket. */
  onCode: (code: string) => void;
  /**
   * A previously scanned device no longer matches the code in the field.
   * Clearing it beats leaving one device's name attached to another's IMEI.
   */
  onCleared: () => void;
}

/**
 * Scan-or-type field for the device's IMEI.
 *
 * A hardware barcode scanner behaves as a keyboard: it types the digits fast
 * and sends Enter. That works here with no extra wiring as long as the field
 * has focus, which is why this is a plain focused input rather than the
 * document-level key listener the register uses — the register has no field
 * to focus, this form does.
 *
 * Where to find the number: the SIM tray, the box, Settings, or `*#06#` on
 * the customer's own phone, which shows it as a barcode.
 */
export default function DeviceScanField({ onIdentified, onCode, onCleared }: DeviceScanFieldProps) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const lastRun = useRef("");
  // Whether the device currently on the form was put there by a scan. Only
  // then is it this field's to clear — a device picked by hand stays.
  const cameFromScan = useRef(false);

  const run = async () => {
    const value = code.trim();

    // Enter fires on every scan; don't re-query the same code.
    if (!value || busy || value === lastRun.current) return;
    lastRun.current = value;
    setBusy(true);
    setResult(null);
    onCode(value);

    const outcome = await identifyDevice(value);

    setBusy(false);

    if ("error" in outcome) {
      if (cameFromScan.current) {
        cameFromScan.current = false;
        onCleared();
      }
      setResult({ ok: false, text: outcome.error });

      return;
    }

    cameFromScan.current = true;
    onIdentified(outcome);
    setResult({
      ok: true,
      text: outcome.offCatalogue
        ? `${outcome.device} ${outcome.model} — not in the catalogue, saved as reported.`
        : `${outcome.device} · ${outcome.model}${outcome.storage ? ` · ${outcome.storage}` : ""}`,
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Scan IMEI</Label>
      <div className="relative">
        <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
          inputMode="numeric"
          placeholder="Scan or type the IMEI — fills the device in"
          value={code}
          onBlur={run}
          onChange={(e) => {
            setCode(e.target.value);
            setResult(null);
            lastRun.current = "";
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            // A scanner's Enter would otherwise submit the form mid-scan.
            e.preventDefault();
            void run();
          }}
        />
      </div>

      {busy ? (
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Loader2 className="size-3 animate-spin" />
          Looking up {isImei(code) ? "IMEI" : "code"}…
        </span>
      ) : result ? (
        <span className={`flex items-start gap-1.5 text-xs ${result.ok ? "text-success" : "text-warning"}`}>
          {result.ok ? <Check className="mt-0.5 size-3 shrink-0" /> : <TriangleAlert className="mt-0.5 size-3 shrink-0" />}
          <span>{result.text}</span>
        </span>
      ) : (
        <span className="text-xs text-muted">SIM tray, the box, Settings, or dial *#06# on the phone.</span>
      )}
    </div>
  );
}
