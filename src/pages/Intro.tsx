import { useNavigate } from "react-router-dom";
import { BarChart3, CalendarDays, CreditCard, FileUp, Package, Ticket, Users, Wrench } from "lucide-react";

import { Button } from "@/components/arc/button/button";

const FEATURES = [
  { icon: Ticket, label: "Repair tickets", desc: "Track every job from check-in to pickup" },
  { icon: Users, label: "Customer CRM", desc: "History, notes and contact in one place" },
  { icon: Package, label: "Inventory and services", desc: "Parts, stock alerts and your service catalog" },
  { icon: CreditCard, label: "Square payments", desc: "In-person and terminal checkout" },
  { icon: CalendarDays, label: "Calendar and bookings", desc: "Appointments, house calls and scheduling" },
  { icon: BarChart3, label: "Analytics", desc: "Revenue, trends and performance" },
  { icon: Wrench, label: "Vendor repairs", desc: "Track send-outs and return dates" },
  { icon: FileUp, label: "Import and export", desc: "Bring data from any POS system" },
];

export default function Intro() {
  const navigate = useNavigate();
  const start = () => {
    try { localStorage.setItem("novaops_launched", "1"); } catch { /* ignore */ }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="nv-center">
      <div className="nv-auth-card" style={{ width: "min(760px, 100%)" }}>
        <div className="nv-brand" style={{ padding: 0 }}><span className="nv-brand-mark">N</span>NovaOps</div>
        <div>
          <h1 style={{ fontSize: 32 }}>Run your repair shop in one place</h1>
          <p className="nv-muted" style={{ margin: "8px 0 0" }}>Everything you need from the front counter to the workbench.</p>
        </div>
        <div className="nv-grid cols-2">
          {FEATURES.map((f) => (
            <div key={f.label} className="nv-panel" style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 16 }}>
              <f.icon size={20} />
              <div><strong style={{ fontWeight: 500 }}>{f.label}</strong><div className="nv-muted" style={{ fontSize: 13 }}>{f.desc}</div></div>
            </div>
          ))}
        </div>
        <div className="nv-actions"><Button size="lg" onClick={start}>Get started</Button></div>
      </div>
    </div>
  );
}
