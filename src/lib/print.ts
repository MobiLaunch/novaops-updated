// Browser-print utilities — a hidden iframe + window.print(), no native
// print dialog integrations. (The original app also supported direct-to-USB
// thermal label printers via WebUSB; that hardware-specific path isn't
// ported here — every label still prints fine through a normal printer.)

function isWebKitPrintQuirk(): boolean {
  const ua = navigator.userAgent || "";

  if (/iPhone|iPad|iPod/i.test(ua)) return true;

  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg/i.test(ua);
}

export function printHtmlContent(html: string) {
  const delayMs = isWebKitPrintQuirk() ? 500 : 220;

  document.getElementById("print-iframe")?.remove();

  const iframe = document.createElement("iframe");

  iframe.id = "print-iframe";
  iframe.title = "Print";
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  let printed = false;
  const runPrint = () => {
    if (printed) return;
    printed = true;
    const w = iframe.contentWindow;

    if (!w) return;
    try {
      w.focus();
      w.print();
    } catch {
      // Ignore — nothing more we can do if the browser blocks it.
    }
  };

  iframe.addEventListener(
    "load",
    () => {
      requestAnimationFrame(() => setTimeout(runPrint, delayMs));
    },
    { once: true },
  );

  iframe.srcdoc = html;

  setTimeout(() => {
    if (printed) return;
    if (iframe.contentDocument?.readyState === "complete") {
      requestAnimationFrame(() => setTimeout(runPrint, delayMs));
    }
  }, 2000);
}

export interface BarcodeLabelData {
  value: string;
  name: string;
  price?: number;
  currency?: string;
  format: "CODE128" | "QR";
}

export async function printBarcodeLabel(data: BarcodeLabelData) {
  const priceStr = data.price !== undefined ? `${data.currency || "$"}${data.price.toFixed(2)}` : "";
  let codeMarkup: string;

  if (data.format === "QR") {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(data.value, { margin: 1, width: 160 });

    codeMarkup = `<img src="${dataUrl}" style="width:120px;height:120px;" />`;
  } else {
    const JsBarcode = (await import("jsbarcode")).default;
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");

    JsBarcode(svg, data.value, { format: "CODE128", height: 60, displayValue: true, margin: 0 });
    codeMarkup = new XMLSerializer().serializeToString(svg);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Label</title>
      <style>
        html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 8mm; }
        .label { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 260px; }
        .name { font-weight: 900; font-size: 13px; text-align: center; }
        .price { font-weight: 900; font-size: 13px; }
        @media print { @page { margin: 0; size: auto; } body { padding: 4mm; } }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="name">${data.name}</div>
        ${codeMarkup}
        ${priceStr ? `<div class="price">${priceStr}</div>` : ""}
      </div>
    </body>
    </html>
  `;

  printHtmlContent(html);
}
