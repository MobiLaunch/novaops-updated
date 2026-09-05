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

export interface ReceiptData {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  date: string;
  items: Array<{ name: string; qty: number; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  ticketRef?: string;
  customerName?: string;
}

export function printReceipt(data: ReceiptData) {
  const formatMoney = (amount: number) => `${data.currency}${(amount || 0).toFixed(2)}`;
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 4px 0;">
        <div style="font-weight: 900;">${item.name}</div>
        <div style="font-size: 11px; font-weight: 700;">${item.qty} x ${formatMoney(item.price)}</div>
      </td>
      <td style="text-align: right; padding: 4px 0; font-weight: 900;">${formatMoney(item.qty * item.price)}</td>
    </tr>
  `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <meta charset="utf-8">
      <style>
        html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px; color: #000; font-weight: 700;
          -webkit-font-smoothing: none; text-rendering: geometricPrecision;
          margin: 0; padding: 10px; max-width: 300px; margin-left: auto; margin-right: auto;
        }
        h1 { font-size: 18px; margin: 0 0 5px 0; text-align: center; font-weight: 900; }
        .header-info { text-align: center; font-size: 12px; margin-bottom: 15px; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .totals-row.bold { font-weight: 900; font-size: 15px; margin-top: 5px; }
        .footer { text-align: center; font-size: 12px; margin-top: 20px; }
        @media print { @page { margin: 0; size: auto; } body { margin: 0; padding: 8mm 4mm; max-width: none; } }
      </style>
    </head>
    <body>
      <h1>${data.businessName || "Receipt"}</h1>
      <div class="header-info">
        ${data.businessAddress ? `<div>${data.businessAddress}</div>` : ""}
        ${data.businessPhone ? `<div>${data.businessPhone}</div>` : ""}
        <div style="margin-top: 5px;">${data.date}</div>
        ${data.ticketRef ? `<div style="margin-top: 5px; font-weight: bold;">Ref: ${data.ticketRef}</div>` : ""}
        ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ""}
      </div>
      <div class="divider"></div>
      <table><tbody>${itemsHtml}</tbody></table>
      <div class="divider"></div>
      <div class="totals-row"><span>Subtotal</span><span>${formatMoney(data.subtotal)}</span></div>
      <div class="totals-row"><span>Tax</span><span>${formatMoney(data.tax)}</span></div>
      <div class="totals-row bold"><span>Total</span><span>${formatMoney(data.total)}</span></div>
      <div class="footer">Thank you for your business!</div>
    </body>
    </html>
  `;

  printHtmlContent(html);
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
