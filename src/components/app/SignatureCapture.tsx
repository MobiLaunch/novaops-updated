import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/arc/button/button";

interface Props {
  value?: string;
  onChange: (dataUrl: string) => void;
  height?: number;
}

/** Plain canvas signature capture that emits a PNG data URL (what the tickets table stores). */
export function SignatureCapture({ value, onChange, height = 140 }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(!value);

  useEffect(() => {
    const c = canvas.current!;
    const ratio = window.devicePixelRatio || 1;

    c.width = c.offsetWidth * ratio;
    c.height = height * ratio;

    const ctx = c.getContext("2d")!;

    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground") || "#111";
    if (value) {
      const img = new Image();

      img.onload = () => ctx.drawImage(img, 0, 0, c.offsetWidth, height);
      img.src = value;
    }
    // Draw the saved value once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();

    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    canvas.current!.setPointerCapture(e.pointerId);

    const ctx = canvas.current!.getContext("2d")!;
    const { x, y } = pos(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;

    const ctx = canvas.current!.getContext("2d")!;
    const { x, y } = pos(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    setEmpty(false);
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvas.current!.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvas.current!;

    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange("");
  };

  return (
    <div className="nv-stack">
      <canvas
        ref={canvas}
        aria-label="Signature"
        style={{ width: "100%", height, border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-md, 10px)", touchAction: "none", background: "var(--surface-muted)" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      />
      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <span className="nv-muted">{empty ? "Sign above" : "Signed"}</span>
        <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
      </div>
    </div>
  );
}
