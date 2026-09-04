import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@heroui/react";
import { Keyboard } from "lucide-react";

const GO_TO: Record<string, { label: string; path: string }> = {
  d: { label: "Dashboard", path: "/dashboard" },
  t: { label: "Tickets", path: "/tickets" },
  c: { label: "Customers", path: "/customers" },
  i: { label: "Inventory", path: "/inventory" },
  m: { label: "Messages", path: "/messages" },
  b: { label: "Bookings", path: "/bookings" },
  s: { label: "Settings", path: "/settings" },
};

function isTypingTarget(el: EventTarget | null) {
  const tag = (el as HTMLElement)?.tagName;

  return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement)?.isContentEditable;
}

// "?" opens this cheat sheet. "g" then a letter jumps to a page (matches the
// GitHub/Linear convention), armed for 1.5s after "g" so typing "g" alone
// elsewhere doesn't misfire.
export default function KeyboardShortcutsOverlay() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const armed = useRef(false);
  const armTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setOpen((o) => !o);

        return;
      }

      if (armed.current) {
        armed.current = false;
        if (armTimeout.current) clearTimeout(armTimeout.current);
        const dest = GO_TO[e.key.toLowerCase()];

        if (dest) {
          e.preventDefault();
          navigate(dest.path);
        }

        return;
      }

      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey) {
        armed.current = true;
        armTimeout.current = setTimeout(() => {
          armed.current = false;
        }, 1500);
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
      if (armTimeout.current) clearTimeout(armTimeout.current);
    };
  }, [navigate]);

  return (
    <Modal>
      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Keyboard Shortcuts</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <div>
                <span className="mb-2 flex items-center gap-2 text-micro font-bold uppercase text-muted">
                  <Keyboard className="size-3.5" />
                  Global
                </span>
                <div className="flex flex-col gap-2 text-sm">
                  <ShortcutRow keys={["Ctrl/⌘", "K"]} label="Open search" />
                  <ShortcutRow keys={["?"]} label="Show this cheat sheet" />
                  <ShortcutRow keys={["Esc"]} label="Close a dialog" />
                </div>
              </div>
              <div>
                <span className="mb-2 block text-micro font-bold uppercase text-muted">Jump to (press G, then…)</span>
                <div className="flex flex-col gap-2 text-sm">
                  {Object.entries(GO_TO).map(([key, dest]) => (
                    <ShortcutRow key={key} keys={["G", key.toUpperCase()]} label={dest.label} />
                  ))}
                </div>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground">{label}</span>
      <span className="flex gap-1">
        {keys.map((k) => (
          <kbd key={k} className="rounded border border-border bg-surface-secondary px-1.5 py-0.5 text-xs font-bold text-muted">
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}
