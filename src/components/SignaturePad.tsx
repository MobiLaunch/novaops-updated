import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { Save, X } from "lucide-react";

interface SignaturePadProps {
  label?: string;
  width?: number;
  height?: number;
  value?: string | null;
  onSave: (dataUrl: string) => void;
}

export default function SignaturePad({ label = "Signature", width = 400, height = 160, value, onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!ctx) return;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (value) {
      const img = new Image();

      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [value]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();

    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    const { x, y } = getPos(e);

    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const { x, y } = getPos(e);

    ctx?.lineTo(x, y);
    ctx?.stroke();
    setHasStrokes(true);
  };

  const stopDrawing = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const save = () => {
    const canvas = canvasRef.current;

    if (canvas) onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-micro font-bold uppercase tracking-wide text-muted">{label}</span>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <canvas
          ref={canvasRef}
          className="touch-none"
          height={height}
          style={{ cursor: "crosshair", width: "100%", maxWidth: width }}
          width={width}
          onPointerDown={startDrawing}
          onPointerLeave={stopDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onPress={clear}>
          <X className="size-4" />
          <span>Clear</span>
        </Button>
        <Button isDisabled={!hasStrokes} size="sm" variant="primary" onPress={save}>
          <Save className="size-4" />
          <span>Save Signature</span>
        </Button>
      </div>
    </div>
  );
}
