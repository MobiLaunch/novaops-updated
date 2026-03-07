/**
 * Web Print Utility for NovaOps
 * Uses a hidden iframe and window.print() to print receipts and barcode labels.
 */

// We'll dynamically load JsBarcode if needed for label printing
let jsBarcodePromise: Promise<void> | null = null;
const loadJsBarcode = () => {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).JsBarcode) return Promise.resolve();
  if (!jsBarcodePromise) {
    jsBarcodePromise = import('jsbarcode').then(mod => {
      (window as any).JsBarcode = mod.default || mod;
    });
  }
  return jsBarcodePromise;
};

// Creates or gets the hidden print iframe
function getPrintIframe(): HTMLIFrameElement {
  let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '100%';
    iframe.style.bottom = '100%';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);
  }
  return iframe;
}

// Injects HTML into the iframe and calls print
export function printHtmlContent(html: string) {
  const iframe = getPrintIframe();
  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for images/fonts to load, then print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, 250); // Small delay to ensure rendering
}

async function sendWebUSB(deviceDataRaw: string, payload: Uint8Array): Promise<boolean> {
  if (typeof window === 'undefined' || !('usb' in navigator)) return false;
  try {
    const pInfo = JSON.parse(deviceDataRaw);
    const devices = await (navigator as any).usb.getDevices();
    const device = devices.find((d: any) => d.vendorId === pInfo.vendorId && d.productId === pInfo.productId);
    if (!device) return false;

    await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);

    let interfaceNumber = 0;
    let endpointNumber = 0;
    for (const iface of device.configuration.interfaces) {
      for (const alt of iface.alternates) {
        // Class 7 is printer, but fallback to any bulk out terminal
        const ep = alt.endpoints.find((e: any) => e.direction === 'out' && e.type === 'bulk');
        if (ep) {
          interfaceNumber = iface.interfaceNumber;
          endpointNumber = ep.endpointNumber;
          break;
        }
      }
      if (endpointNumber) break;
    }

    if (endpointNumber === 0) throw new Error("No OUT endpoint found on printer device");

    await device.claimInterface(interfaceNumber);
    await device.transferOut(endpointNumber, payload);
    await device.close();
    return true;
  } catch (err: any) {
    if (err.name === 'SecurityError') {
      console.warn("WebUSB SecurityError: Direct USB access was denied by the browser (or missing user gesture). Falling back to standard print.", err.message);
    } else {
      console.warn("WebUSB print failed:", err);
    }
    return false;
  }
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

export async function printReceipt(data: ReceiptData) {
  const formatMoney = (amount: number) => `${data.currency}${(amount || 0).toFixed(2)}`;

  if (typeof window !== 'undefined') {
    const savedPrinter = localStorage.getItem('novaops_thermal_printer');
    if (savedPrinter) {
      // Build ESC/POS payload
      const ESC = '\x1B';
      const GS = '\x1D';
      let out = '';
      out += ESC + '@'; // Initialize
      out += ESC + 'a' + '\x01'; // Align center
      out += ESC + 'E' + '\x01'; // Bold on
      out += (data.businessName || 'Receipt') + '\n';
      out += ESC + 'E' + '\x00'; // Bold off
      out += ESC + 'a' + '\x00'; // Align left

      if (data.businessAddress) out += data.businessAddress + '\n';
      if (data.businessPhone) out += data.businessPhone + '\n';
      out += data.date + '\n';
      if (data.ticketRef) out += 'Ticket: ' + data.ticketRef + '\n';
      if (data.customerName) out += 'Customer: ' + data.customerName + '\n';
      out += '--------------------------------\n';

      data.items.forEach(item => {
        const line = `${item.qty}x ${item.name} ` + formatMoney(item.price * item.qty);
        out += line + '\n';
      });

      out += '--------------------------------\n';
      out += `Subtotal: ${formatMoney(data.subtotal)}\n`;
      out += `Tax:      ${formatMoney(data.tax)}\n`;
      out += ESC + 'E' + '\x01'; // Bold on
      out += `Total:    ${formatMoney(data.total)}\n`;
      out += ESC + 'E' + '\x00'; // Bold off
      out += '\nThank you for your business!\n\n\n\n\n';
      out += GS + 'V' + '\x41' + '\x00'; // Cut

      const encoder = new TextEncoder();
      const payload = encoder.encode(out);
      const success = await sendWebUSB(savedPrinter, payload);
      // If successful, skip HTML fallback popup
      if (success) return;
    }
  }

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 4px 0;">
        <div style="font-weight: 900;">${item.name}</div>
        <div style="font-size: 11px; color: #000; font-weight: 700;">${item.qty} x ${formatMoney(item.price)}</div>
      </td>
      <td style="text-align: right; padding: 4px 0; font-weight: 900;">
        ${formatMoney(item.qty * item.price)}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Courier New', Courier, monospace; /* Classic receipt font */
          font-size: 13px;
          color: #000;
          font-weight: 700;
          -webkit-font-smoothing: none; /* Crucial for solid black thermal prints */
          text-rendering: geometricPrecision;
          margin: 0;
          padding: 10px;
          /* Typical thermal receipt width is around 58mm to 80mm */
          /* Setting max-width helps formatting if printed to A4 fallback */
          max-width: 300px; 
          margin-left: auto;
          margin-right: auto;
        }
        h1 { font-size: 18px; margin: 0 0 5px 0; text-align: center; font-weight: 900; }
        .header-info { text-align: center; font-size: 12px; margin-bottom: 15px; color: #000; font-weight: 700; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; color: #000; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-weight: 700; }
        .totals-row.bold { font-weight: 900; font-size: 15px; margin-top: 5px; }
        .footer { text-align: center; font-size: 12px; margin-top: 20px; color: #000; font-weight: 700; }
        
        /* Print-specific overrides */
        @media print {
          @page { margin: 0; }
          body { margin: 0; padding: 10mm 5mm; } 
        }
      </style>
    </head>
    <body>
      <h1>${data.businessName || 'Receipt'}</h1>
      <div class="header-info">
        ${data.businessAddress ? `<div>${data.businessAddress}</div>` : ''}
        ${data.businessPhone ? `<div>${data.businessPhone}</div>` : ''}
        <div style="margin-top: 5px;">${data.date}</div>
        ${data.ticketRef ? `<div style="margin-top: 5px; font-weight: bold;">Ticket: ${data.ticketRef}</div>` : ''}
        ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ''}
      </div>

      <div class="divider"></div>

      <table>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="totals-row">
        <span>Subtotal</span>
        <span>${formatMoney(data.subtotal)}</span>
      </div>
      <div class="totals-row">
        <span>Tax</span>
        <span>${formatMoney(data.tax)}</span>
      </div>
      <div class="totals-row bold">
        <span>Total</span>
        <span>${formatMoney(data.total)}</span>
      </div>

      <div class="divider" style="margin-top: 15px;"></div>
      <div class="footer">
        Thank you for your business!
      </div>
    </body>
    </html>
  `;

  printHtmlContent(html);
}

export interface BarcodeLabelData {
  sku: string;
  name: string;
  price?: number;
  currency?: string;
  customerName?: string;
  format?: string;
}

export async function printBarcodeLabel(data: BarcodeLabelData) {
  if (typeof window === 'undefined') return;

  const savedPrinter = localStorage.getItem('novaops_label_printer');
  if (savedPrinter) {
    const priceStr = data.price !== undefined ? `${data.currency || '$'}${(data.price || 0).toFixed(2)}` : '';
    const custStr = data.customerName || '';

    // Choose Code128 vs QR code based on passed format
    // Intermec Direct Protocol (DP)
    // SETUP: align bottom left, print speed, clear buffer
    // ALIGN 1 = Top Left origin
    const priceStrPrint = priceStr ? `PRPOS 280,140\r\nDIR 1\r\nALIGN 1\r\nFONT "Swiss 721 BT"\r\nPRTXT "${priceStr}"\r\n` : '';
    const custStrPrint = custStr ? `PRPOS 20,140\r\nDIR 1\r\nALIGN 1\r\nFONT "Swiss 721 BT"\r\nPRTXT "${custStr}"\r\n` : '';

    // DP Barcode syntax:
    // BARMAG = magnification
    // BARTYPE = "CODE128" or "QRCODE"
    // PRBAR = print barcode data
    const barcodeDp = data.format === 'QR'
      ? `PRPOS 20,60\r\nDIR 1\r\nALIGN 1\r\nBARTYPE "QRCODE"\r\nBARMAG 3\r\nPRBAR "${data.sku}"\r\n`
      : `PRPOS 20,60\r\nDIR 1\r\nALIGN 1\r\nBARTYPE "CODE128"\r\nBARMAG 2\r\nBARHEIGHT 60\r\nPRBAR "${data.sku}"\r\n`;

    const dp =
      `CLL\r\n` +                     // Clear image buffer
      `OPTIMIZE "BATCH" ON\r\n` +     // Batch optimization
      `PRPOS 20,15\r\n` +             // Position (X=20,Y=15)
      `DIR 1\r\n` +                   // Orientation
      `ALIGN 1\r\n` +                 // Top-left align text
      `FONT "Swiss 721 Bold BT",10\r\n` + // Attempt bolder font
      `PRTXT "${data.name}"\r\n` +    // Print name
      barcodeDp +                     // Print Barcode
      custStrPrint +                  // Print Customer
      priceStrPrint +                 // Print Price
      `PRINTFEED\r\n`;                // Print and feed one label

    console.log("Sending DP payload to USB printer:", dp);
    const encoder = new TextEncoder();
    const payload = encoder.encode(dp);
    const success = await sendWebUSB(savedPrinter, payload);
    if (success) {
      console.log("WebUSB label transfer succeeded.");
      return;
    }
  }

  await loadJsBarcode();

  // Create a temporary canvas to generate the barcode data URI
  const canvas = document.createElement('canvas');
  try {
    (window as any).JsBarcode(canvas, data.sku, {
      format: "CODE128",
      displayValue: true,
      fontSize: 16,
      margin: 10,
      width: 2,
      height: 50
    });
  } catch (err) {
    console.error("Failed to generate barcode:", err);
    return;
  }

  const barcodeDataUrl = canvas.toDataURL("image/png");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Label - ${data.sku}</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
          min-height: 100vh;
          box-sizing: border-box;
          background: white;
        }
        .container {
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 4px;
          max-width: 90%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .barcode {
          max-width: 100%;
          height: auto;
          max-height: 0.5in;
        }
        .details {
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          width: 80%;
        }
        
        @media print {
          @page { margin: 0; size: 2in 1in; }
          body { width: 2in; height: 1in; min-height: 1in; overflow: hidden; display: block; }
          .container { width: 100%; height: 100%; border: none; padding: 0.05in; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="name">${data.name}</div>
        <img class="barcode" src="${barcodeDataUrl}" />
        <div class="details">
          <span>${data.customerName || ''}</span>
          <span>${data.price !== undefined ? `${data.currency || '$'}${(data.price || 0).toFixed(2)}` : ''}</span>
        </div>
      </div>
    </body>
    </html>
  `;

  printHtmlContent(html);
}

export async function printBarcodeBatch(items: BarcodeLabelData[]) {
  if (typeof window === 'undefined') return;

  const savedPrinter = localStorage.getItem('novaops_label_printer');
  if (savedPrinter) {
    let fullDp = '';

    items.forEach(data => {
      const priceStr = data.price !== undefined ? `${data.currency || '$'}${(data.price || 0).toFixed(2)}` : '';
      const custStr = data.customerName || '';

      const priceStrPrint = priceStr ? `PRPOS 280,140\r\nDIR 1\r\nALIGN 1\r\nFONT "Swiss 721 BT"\r\nPRTXT "${priceStr}"\r\n` : '';
      const custStrPrint = custStr ? `PRPOS 20,140\r\nDIR 1\r\nALIGN 1\r\nFONT "Swiss 721 BT"\r\nPRTXT "${custStr}"\r\n` : '';

      const barcodeDp = data.format === 'QR'
        ? `PRPOS 20,60\r\nDIR 1\r\nALIGN 1\r\nBARTYPE "QRCODE"\r\nBARMAG 3\r\nPRBAR "${data.sku}"\r\n`
        : `PRPOS 20,60\r\nDIR 1\r\nALIGN 1\r\nBARTYPE "CODE128"\r\nBARMAG 2\r\nBARHEIGHT 60\r\nPRBAR "${data.sku}"\r\n`;

      fullDp +=
        `CLL\r\n` +
        `OPTIMIZE "BATCH" ON\r\n` +
        `PRPOS 20,15\r\n` +
        `DIR 1\r\n` +
        `ALIGN 1\r\n` +
        `FONT "Swiss 721 Bold BT",10\r\n` +
        `PRTXT "${data.name}"\r\n` +
        barcodeDp +
        custStrPrint +
        priceStrPrint +
        `PRINTFEED\r\n`;
    });

    console.log(`Sending Batch DP payload to USB printer (${items.length} labels)`);
    const encoder = new TextEncoder();
    const payload = encoder.encode(fullDp);
    const success = await sendWebUSB(savedPrinter, payload);

    // Fall back to HTML if USB fails/denied
    if (success) return;
  }

  // --- Fallback HTML Path (Grid) ---
  await loadJsBarcode();

  // Resolve JSBarcodes on temporary canvases sequentially, or fake a <div> grid
  // To keep it clean, we'll mimic what POS does for batch
  const htmlParts = await Promise.all(items.map(async (data: BarcodeLabelData) => {
    const val = data.sku || 'UNKNOWN';
    try {
      if (data.format === 'QR') {
        // dynamic load QrCode if needed, but for fallback grid JS barcode is easier/simpler, skipping native qr image for now
      }
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      (window as any).JsBarcode(svg, val, { format: 'CODE128', width: 2, height: 50, displayValue: true, fontSize: 11, margin: 6 });
      const svgStr = new XMLSerializer().serializeToString(svg);
      return `<div class="label"><img src="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}" /><p>${data.name}</p></div>`
    } catch {
      return `<div class="label"><p style="font-family:monospace;font-size:18px;font-weight:bold">${val}</p><p>${data.name}</p></div>`
    }
  }));

  const html = `<!DOCTYPE html><html><head><title>Batch Labels</title><style>
    body { margin:0; font-family:system-ui,sans-serif; background:white; }
    .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding:16px; }
    .label { border:1px solid #e5e7eb; border-radius:8px; padding:12px; text-align:center; break-inside:avoid; }
    img { max-width:100%; } 
    p { margin:4px 0 0; font-size:11px; font-weight:700; color:#000; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; }
    @media print {
      @page { margin: 0; size: 2in 1in; }
      body { min-height: 100vh; }
      .grid { display: block; padding: 0; gap: 0; }
      .label { 
        width: 2in; height: 1in; box-sizing: border-box; 
        border: none; border-radius: 0; padding: 0.05in; 
        display: flex; flex-direction: column; align-items: center; justify-content: center; 
        page-break-after: always; break-after: page; 
      }
      img { max-height: 0.5in; width: auto; }
    }
  </style></head><body><div class="grid">${htmlParts.join('')}</div></body></html>`

  printHtmlContent(html);
}
