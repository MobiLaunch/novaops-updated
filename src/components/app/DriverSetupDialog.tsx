import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Progress } from "@/components/arc/progress/progress";
import type { BadgeTone } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
type OS = "windows" | "macos" | "linux";
type Status = "idle" | "checking" | "installed" | "missing" | "installing" | "failed";
interface Tool { id: string; name: string; desc: string; url: string; cmd?: string; autoInstall: boolean; os: OS[] }

const TOOLS: Tool[] = [
  { id: "adb", name: "Android Debug Bridge (ADB)", desc: "Required for Android and Chromebook USB detection, diagnostics, backups and software updates.", url: "https://developer.android.com/studio/releases/platform-tools", cmd: "winget install Google.PlatformTools", autoInstall: true, os: ["windows", "macos", "linux"] },
  { id: "android-usb-driver", name: "Android OEM USB driver (Windows)", desc: "Windows needs a manufacturer USB driver to see Android devices in ADB. Each phone brand has its own. Visit your device maker's support page.", url: "https://developer.android.com/studio/run/oem-usb", autoInstall: false, os: ["windows"] },
  { id: "libimobiledevice-win", name: "libimobiledevice (Windows)", desc: "Enables iOS and iPadOS USB detection, idevice_id, ideviceinfo and idevicebackup2 on Windows.", url: "https://github.com/libimobiledevice-win32/imobiledevice-net", cmd: "winget install libimobiledevice.libimobiledevice", autoInstall: true, os: ["windows"] },
  { id: "itunes-drivers", name: "Apple Mobile Device Support (iTunes)", desc: "Installs the Apple USB driver on Windows so iOS devices are recognized. Install iTunes from the Microsoft Store to get these drivers.", url: "https://apps.microsoft.com/detail/9pb2mz1zmb8c", cmd: "winget install Apple.iTunes", autoInstall: true, os: ["windows"] },
  { id: "libimobiledevice", name: "libimobiledevice", desc: "Open-source library for talking to iOS and iPadOS devices. Provides idevice_id, ideviceinfo and idevicebackup2.", url: "https://libimobiledevice.org", cmd: "brew install libimobiledevice", autoInstall: true, os: ["macos"] },
  { id: "usbmuxd-mac", name: "usbmuxd", desc: "USB multiplexer daemon that manages iOS USB connections on macOS.", url: "https://libimobiledevice.org", cmd: "brew install usbmuxd", autoInstall: true, os: ["macos"] },
  { id: "libimobiledevice-linux", name: "libimobiledevice-utils", desc: "Provides idevice_id and related iOS tools. Install through your package manager.", url: "https://libimobiledevice.org", cmd: "sudo apt install libimobiledevice-utils usbmuxd", autoInstall: true, os: ["linux"] },
];
const LABEL: Record<Status, string> = { idle: "Not checked", checking: "Checking…", installed: "Installed", missing: "Not found", installing: "Installing…", failed: "Failed" };
const TONE: Record<Status, BadgeTone> = { idle: "neutral", checking: "info", installed: "success", missing: "warning", installing: "info", failed: "danger" };
const api = () => (window as any).electronAPI;

/** Helps set up USB drivers for device diagnostics. Checks and installs run through the Electron bridge; in a browser it shows the commands to run yourself. */
export function DriverSetupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [os, setOs] = useState<OS>("windows");
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState({ pct: 0, msg: "" });
  const [needsAdmin, setNeedsAdmin] = useState(false);
  const [copied, setCopied] = useState("");
  const list = useMemo(() => TOOLS.filter((t) => t.os.includes(os)), [os]);
  const desktop = !!api()?.isElectron;
  const set = (id: string, s: Status) => setStatus((m) => ({ ...m, [id]: s }));

  const checkAll = async (tools = list) => {
    setProgress({ pct: 5, msg: "Checking installed tools…" });
    for (let i = 0; i < tools.length; i++) {
      set(tools[i].id, "checking");
      setProgress({ pct: Math.round(((i + 0.4) / tools.length) * 90) + 5, msg: `Checking ${tools[i].name}…` });
      let ok = false;

      try { ok = (await api()?.checkTool?.(tools[i].id)) === true; } catch { ok = false; }
      set(tools[i].id, ok ? "installed" : "missing");
    }
    setProgress({ pct: 100, msg: "Check complete" });
    setTimeout(() => setProgress({ pct: 0, msg: "" }), 2000);
  };

  useEffect(() => {
    if (!open) return;
    void (async () => {
      let detected: OS = "windows";

      try {
        const p: string = (await api()?.platform?.()) ?? navigator.platform ?? "";

        detected = p.startsWith("darwin") || p.startsWith("Mac") ? "macos" : p.startsWith("linux") || p.startsWith("Linux") ? "linux" : "windows";
      } catch { /* default */ }
      setOs(detected);
      try { setNeedsAdmin(detected === "windows" && desktop && (await api()?.isAdmin?.()) === false); } catch { setNeedsAdmin(false); }
      if (desktop) void checkAll(TOOLS.filter((t) => t.os.includes(detected)));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const install = async (t: Tool) => {
    if (!t.autoInstall || !desktop) return void window.open(t.url, "_blank", "noopener");
    set(t.id, "installing");
    setProgress({ pct: 15, msg: `Installing ${t.name}…` });
    try {
      const r = await api().installTool?.(t.id);

      if (r?.ok) { set(t.id, "installed"); setProgress({ pct: 100, msg: `${t.name} installed` }); }
      else {
        set(t.id, "failed");
        if (r?.needsAdmin) { setNeedsAdmin(true); setErrors((e) => ({ ...e, [t.id]: "Administrator required. Use Relaunch as admin." })); }
        else setErrors((e) => ({ ...e, [t.id]: r?.error || "Installation failed" }));
      }
    } catch (e) {
      set(t.id, "failed");
      setErrors((m) => ({ ...m, [t.id]: (e as Error).message }));
    }
    setTimeout(() => setProgress({ pct: 0, msg: "" }), 2200);
  };

  const copy = async (cmd: string) => { try { await navigator.clipboard.writeText(cmd); setCopied(cmd); setTimeout(() => setCopied(""), 1800); } catch { /* ignore */ } };
  const missing = list.filter((t) => t.autoInstall && (status[t.id] === "missing" || status[t.id] === "failed"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nv-wide" title="Device drivers" description="Tools used to detect and diagnose phones and tablets over USB">
        <div className="nv-stack" style={{ gap: 16 }}>
          <SegmentedControl label="Operating system" value={os} onValueChange={(v: string) => { setOs(v as OS); if (desktop) void checkAll(TOOLS.filter((t) => t.os.includes(v as OS))); }} options={[{ value: "windows", label: "Windows" }, { value: "macos", label: "macOS" }, { value: "linux", label: "Linux" }]} />
          {!desktop && <Alert tone="info" title="Install from a terminal">Automatic checks and installs need the NovaOps desktop app. Copy the commands below and run them yourself.</Alert>}
          {needsAdmin && <Alert tone="warning" title="Administrator access needed">Windows installs need elevated permissions.<Button size="sm" variant="secondary" onClick={async () => { const r = await api()?.relaunchAsAdmin?.(); if (!r?.ok) setProgress({ pct: 0, msg: r?.error || "Relaunch failed. Run the app as administrator manually." }); }}>Relaunch as admin</Button></Alert>}
          {progress.msg && <div className="nv-stack"><Progress value={progress.pct} label={progress.msg} /></div>}
          {list.map((t) => {
            const s = status[t.id] ?? "idle";

            return (
              <div key={t.id} className="nv-panel nv-stack" style={{ padding: 14 }}>
                <div className="nv-actions" style={{ justifyContent: "space-between" }}><strong style={{ fontWeight: 500 }}>{t.name}</strong><Badge tone={TONE[s]}>{LABEL[s]}</Badge></div>
                <span className="nv-muted" style={{ fontSize: 13 }}>{t.desc}</span>
                {errors[t.id] && <span style={{ color: "var(--danger)", fontSize: 13 }}>{errors[t.id]}</span>}
                <div className="nv-actions">
                  {t.cmd && <Button size="sm" variant="secondary" onClick={() => copy(t.cmd!)}>{copied === t.cmd ? <Check size={14} /> : <Copy size={14} />}<code>{t.cmd}</code></Button>}
                  <Button size="sm" variant="ghost" onClick={() => install(t)} disabled={s === "installing" || s === "installed"}>{t.autoInstall && desktop ? "Install" : <>Open download page<ExternalLink size={14} /></>}</Button>
                </div>
              </div>
            );
          })}
          <div className="nv-actions" style={{ justifyContent: "flex-end" }}>
            {desktop && <Button variant="secondary" onClick={() => checkAll()}>Re-check</Button>}
            {desktop && missing.length > 0 && <Button onClick={async () => { for (const t of missing) await install(t); }}>Install all ({missing.length})</Button>}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
