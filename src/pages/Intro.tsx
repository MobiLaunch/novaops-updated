import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Logo } from "@/components/app/Logo";

const FEATURES = [
  ["🎫", "Repair tickets", "Track every job start to finish"],
  ["👥", "Customer CRM", "History, notes and contact in one tap"],
  ["📦", "Inventory and services", "Parts, stock alerts and service catalog"],
  ["💳", "Square payments", "In-person and terminal checkout"],
  ["📅", "Calendar and bookings", "Appointments, house calls and scheduling"],
  ["📊", "Analytics", "Revenue, trends and performance"],
  ["🔧", "Vendor repairs", "Track send-outs and return dates"],
  ["📤", "Import and export", "Bulk import from any POS system"],
];

const STACKS = [
  { label: "Tickets", color: "#fffbeb", accent: "#f59e0b", light: "#fef3c7", x: 105, y: 195 },
  { label: "Customers", color: "#f5f3ff", accent: "#6366f1", light: "#ede9fe", x: 250, y: 185 },
  { label: "Inventory", color: "#f0fdf4", accent: "#10b981", light: "#d1fae5", x: 395, y: 195 },
];
const LINES = [["Device:", "iPhone 14 Pro"], ["Cust:", "Maria G."], ["Status:", "In Progress"], ["Part:", "Screen LCD"], ["Price:", "$129.00"], ["Name:", "Tom S."], ["Due:", "Today 3pm"], ["Ref:", "#TK-2041"], ["Stock:", "12 units"], ["Note:", "Rush repair"], ["Email:", "j@shop.com"], ["Model:", "Galaxy S24"]];

interface Paper { x: number; y: number; tx: number; ty: number; sx: number; sy: number; sr: number; w: number; h: number; rot: number; tr: number; stack: number; label: string; value: string; wobble: number; vx: number; vy: number; vr: number; bars: number[] }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const spring = (t: number) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);
const rnd = (n: number) => (Math.random() - 0.5) * n;

function buildPapers(W: number, H: number): Paper[] {
  return Array.from({ length: 18 }, (_, i) => {
    const st = STACKS[i % 3], [label, value] = LINES[i % LINES.length];
    const tx = 50 + Math.random() * (W - 100), ty = 50 + Math.random() * (H - 100), tr = rnd(Math.PI * 1.5);

    return { x: tx, y: ty, tx, ty, sx: st.x + rnd(5), sy: st.y - Math.floor(i / 3) * 4, sr: rnd(0.12), w: 76, h: 94, rot: tr, tr, stack: i % 3, label, value, wobble: Math.random() * Math.PI * 2, vx: rnd(2.2), vy: rnd(2.2), vr: rnd(0.055), bars: [0, 1, 2, 3].map(() => 0.45 + Math.random() * 0.3) };
  });
}

function drawPaper(ctx: CanvasRenderingContext2D, p: Paper, alpha: number) {
  const st = STACKS[p.stack], { w, h } = p;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.shadowColor = `${st.accent}30`;
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 8);
  ctx.fillStyle = st.color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = `${st.accent}25`;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, 20, [8, 8, 0, 0]);
  ctx.fillStyle = st.light;
  ctx.fill();
  ctx.fillStyle = st.accent;
  ctx.font = "bold 7.5px system-ui, sans-serif";
  ctx.fillText(p.label, -w / 2 + 8, -h / 2 + 32);
  ctx.fillStyle = "rgba(30,30,30,0.65)";
  ctx.font = "7px system-ui, sans-serif";
  ctx.fillText(p.value, -w / 2 + 8, -h / 2 + 43);
  ["30", "22", "18", "14"].forEach((a, i) => {
    ctx.fillStyle = `${st.accent}${a}`;
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 8, -h / 2 + 54 + i * 10, p.bars[i] * (w - 18), 4.5, 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBase(ctx: CanvasRenderingContext2D, st: (typeof STACKS)[number]) {
  ctx.save();
  ctx.shadowColor = `${st.accent}40`;
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = `${st.accent}20`;
  ctx.beginPath();
  ctx.ellipse(st.x, st.y + 52, 42, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = `${st.accent}18`;
  ctx.strokeStyle = `${st.accent}40`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(st.x - 36, st.y + 60, 72, 20, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = st.accent;
  ctx.font = "bold 9px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(st.label, st.x, st.y + 74);
  ctx.restore();
}

export default function Intro() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(-1);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext("2d")!;
    const W = c.width, H = c.height;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const papers = buildPapers(W, H);
    let chaos = !reduce, sortStart = 0, frame = 0, raf = 0;

    const tick = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      frame++;
      if (chaos) {
        for (const p of papers) {
          p.x += p.vx; p.y += p.vy; p.rot += p.vr;
          const mx = p.w / 2 + 8, my = p.h / 2 + 8;

          if (p.x < mx) { p.x = mx; p.vx = Math.abs(p.vx); }
          if (p.x > W - mx) { p.x = W - mx; p.vx = -Math.abs(p.vx); }
          if (p.y < my) { p.y = my; p.vy = Math.abs(p.vy); }
          if (p.y > H - my) { p.y = H - my; p.vy = -Math.abs(p.vy); }
          p.y += Math.sin(frame * 0.018 + p.wobble) * 0.25;
          drawPaper(ctx, p, 1);
        }
      } else {
        const elapsed = reduce ? 1e6 : now - sortStart;
        const sorted = [...papers].sort((a, b) => a.stack - b.stack || papers.indexOf(a) - papers.indexOf(b));

        STACKS.forEach((st, si) => { if (elapsed > sorted.indexOf(sorted.find((p) => p.stack === si)!) * 110 + 300) drawBase(ctx, st); });
        sorted.forEach((p, i) => {
          const t = Math.max(0, Math.min(1, (elapsed - i * 110) / 650)), e = spring(t);

          if (t <= 0) {
            p.x += p.vx * 0.2; p.y += p.vy * 0.2; p.rot += p.vr * 0.2;
            p.x = Math.max(p.w / 2 + 8, Math.min(W - p.w / 2 - 8, p.x));
            p.y = Math.max(p.h / 2 + 8, Math.min(H - p.h / 2 - 8, p.y));
          } else { p.x = lerp(p.tx, p.sx, e); p.y = lerp(p.ty, p.sy, e); p.rot = lerp(p.tr, p.sr, e); }
          drawPaper(ctx, p, t <= 0 ? 0.85 : 0.95);
        });
      }
      raf = requestAnimationFrame(tick);
    };

    const timers = reduce
      ? [setTimeout(() => setPhase(2), 50)]
      : [setTimeout(() => setPhase(0), 100), setTimeout(() => { chaos = false; sortStart = performance.now(); }, 2600), setTimeout(() => setPhase(1), 4400), setTimeout(() => setPhase(2), 5800)];

    if (reduce) chaos = false;
    raf = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, []);

  const go = () => {
    try { localStorage.setItem("novaops_launched", "1"); } catch { /* ignore */ }
    setLeaving(true);
    setTimeout(() => navigate(params.get("from") === "register" ? "/profile-setup" : "/login", { replace: true }), 600);
  };

  const show = (n: number) => ({ opacity: phase >= n ? 1 : 0, transform: phase >= n ? "none" : "translateY(14px)", transition: "opacity .6s ease, transform .6s ease" });

  return (
    <div className="nv-intro" style={{ opacity: leaving ? 0 : 1, transition: "opacity .6s ease" }}>
      <div className="nv-intro-layout">
        <div className="nv-intro-canvas" style={show(0)}>
          <canvas ref={canvas} width={500} height={400} aria-hidden="true" style={{ width: "100%", height: "auto" }} />
          <p className="nv-muted" style={{ textAlign: "center", margin: 0 }} role="status">{phase === 0 ? "Before NovaOps" : phase >= 1 ? "Everything in its place" : ""}</p>
        </div>

        <div className="nv-stack" style={{ gap: 24 }}>
          <div className="nv-actions" style={{ ...show(0), gap: 12 }}><Logo size={44} /><span style={{ fontSize: 26, fontWeight: 500 }}>NovaOps</span></div>
          <div style={show(0)}>
            <h1 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }}>Your repair shop,<br />finally in order.</h1>
            <p className="nv-muted" style={{ margin: "12px 0 0", maxWidth: 460 }}>One app to run tickets, customers, inventory, payments and your team. All synced, always.</p>
          </div>
          <div className="nv-grid cols-2" style={{ gap: 10 }}>
            {FEATURES.map(([icon, label, desc], i) => (
              <div key={label} className="nv-panel" style={{ display: "flex", gap: 12, padding: 12, ...show(1), transitionDelay: `${i * 70}ms` }}>
                <span aria-hidden="true" style={{ fontSize: 20 }}>{icon}</span>
                <div><strong style={{ fontWeight: 500, fontSize: 14 }}>{label}</strong><div className="nv-muted" style={{ fontSize: 12 }}>{desc}</div></div>
              </div>
            ))}
          </div>
          <div style={show(2)}>
            <Button size="lg" onClick={go} disabled={phase < 2}>Let's do this<ArrowRight size={16} /></Button>
            <p className="nv-muted" style={{ margin: "10px 0 0", fontSize: 13 }}>Takes about 60 seconds to set up</p>
          </div>
        </div>
      </div>
    </div>
  );
}
