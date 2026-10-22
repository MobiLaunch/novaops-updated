import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";

const MOD = typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘" : "Ctrl";
const GROUPS = [
  { title: "Quick actions", items: [["New ticket", [MOD, "T"]], ["New house call", [MOD, "H"]], ["New customer", [MOD, "U"]], ["Open register", [MOD, "R"]], ["Search", [MOD, "K"]]] },
  { title: "Navigation", items: [["Dashboard", [MOD, "D"]], ["Analytics", [MOD, "A"]], ["Tools", [MOD, "I"]], ["Settings", [MOD, ","]]] },
  { title: "General", items: [["Show shortcuts", ["?"]]] },
] as const;

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Keyboard shortcuts" description="Work faster without leaving the keyboard">
        <div className="nv-stack" style={{ gap: 16 }}>
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h2 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>{g.title}</h2>
              {g.items.map(([label, keys]) => (
                <div key={label} className="nv-row">
                  <div className="nv-row-main"><span style={{ color: "var(--foreground)" }}>{label}</span></div>
                  <span className="nv-actions" style={{ gap: 4 }}>{keys.map((k) => <kbd key={k} style={{ padding: "2px 7px", border: "1px solid var(--border-strong)", borderRadius: 6, fontFamily: "inherit", fontSize: 12, background: "var(--surface-muted)" }}>{k}</kbd>)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
