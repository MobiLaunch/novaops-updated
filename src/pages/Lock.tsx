import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Delete, Lock as LockIcon } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { useAppStore } from "@/lib/store";

export default function LockScreen() {
  const navigate = useNavigate();
  const storePin = useAppStore((s) => s.settings.pin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const saved = useRef(localStorage.getItem("novaops_pin") || "1234");

  useEffect(() => {
    if (storePin) { saved.current = storePin; localStorage.setItem("novaops_pin", storePin); }
  }, [storePin]);

  const add = (d: string) => {
    if (pin.length >= 4) return;

    const next = pin + d;

    setError("");
    setPin(next);
    if (next.length === 4) {
      if (next === saved.current) {
        localStorage.setItem("screen_locked", "false");
        localStorage.setItem("last_activity", Date.now().toString());
        navigate("/dashboard", { replace: true });
      } else {
        setError("Incorrect PIN, try again");
        setTimeout(() => { setPin(""); setError(""); }, 900);
      }
    }
  };

  const signOut = async () => {
    localStorage.removeItem("screen_locked");
    await useAppStore.getState().logout();
    navigate("/login", { replace: true });
  };

  // Hardware keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) add(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="nv-center">
      <div className="nv-auth-card" style={{ width: "min(300px, 100%)", textAlign: "center" }}>
        <LockIcon size={28} style={{ margin: "0 auto" }} />
        <div>
          <h1>Screen locked</h1>
          <p className="nv-muted" style={{ margin: "4px 0 0" }}>Enter your PIN to continue</p>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }} aria-label={`${pin.length} of 4 digits entered`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ width: 14, height: 14, borderRadius: 99, border: "1.5px solid var(--border-strong)", background: pin.length > i ? "var(--foreground)" : "transparent" }} />
          ))}
        </div>
        <div style={{ minHeight: 20, color: "var(--danger)", fontSize: 13 }} role="alert">{error}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => <Button key={n} variant="secondary" size="lg" onClick={() => add(n)}>{n}</Button>)}
          <span />
          <Button variant="secondary" size="lg" onClick={() => add("0")}>0</Button>
          <Button variant="ghost" size="lg" aria-label="Delete" onClick={() => setPin((p) => p.slice(0, -1))}><Delete size={18} /></Button>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>Sign out instead</Button>
      </div>
    </div>
  );
}
