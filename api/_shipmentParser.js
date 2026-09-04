// Best-effort extraction of tracking numbers and delivery dates/times from
// supplier shipping-notification emails. Regex-based heuristics, not a real
// parser for every carrier's template — false negatives (nothing found) are
// expected and harmless; results are always shown to a human before they're
// treated as fact.

const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec";

const TRACKING_PATTERNS = [
  { carrier: "UPS", regex: /\b1Z[0-9A-Z]{16}\b/i },
  { carrier: "USPS", regex: /\b(94|93|92|82)\d{20}\b/ },
  { carrier: "USPS", regex: /\b[A-Z]{2}\d{9}US\b/i },
  { carrier: "FedEx", regex: /\b\d{15}\b/ },
  { carrier: "FedEx", regex: /\b\d{12}\b/ },
  { carrier: "DHL", regex: /\b\d{10,11}\b/ },
];

export function extractTrackingNumber(text) {
  for (const { carrier, regex } of TRACKING_PATTERNS) {
    const match = text.match(regex);

    if (match) return { carrier, trackingNumber: match[0] };
  }

  return null;
}

export function extractDeliveryDate(text) {
  const cuePatterns = [
    new RegExp(`(?:estimated delivery|arriving|expected delivery|delivery date|will arrive|arrives?|out for delivery)\\D{0,15}((?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?)`, "i"),
    new RegExp(`(?:estimated delivery|arriving|expected delivery|delivery date|will arrive|arrives?)\\D{0,10}(\\d{1,2}\\/\\d{1,2}\\/\\d{2,4})`, "i"),
  ];

  for (const re of cuePatterns) {
    const m = text.match(re);

    if (m) {
      const hasYear = /\d{4}/.test(m[1]);
      const candidate = hasYear ? m[1] : `${m[1]}, ${new Date().getFullYear()}`;
      const parsed = new Date(candidate);

      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    }
  }

  return null;
}

export function extractDeliveryTime(text) {
  const m = text.match(/\bby\s+(\d{1,2}(:\d{2})?\s?(am|pm))\b/i) || text.match(/\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i);

  return m ? m[1].toUpperCase() : "";
}

export function isSupplierEmail(fromEmail, supplierList) {
  const from = (fromEmail || "").toLowerCase().trim();

  if (!from) return false;
  const fromDomain = from.split("@")[1];

  return (supplierList || []).some((entry) => {
    const s = (entry || "").toLowerCase().trim();

    if (!s) return false;
    if (s === from) return true;
    const sDomain = s.includes("@") ? s.split("@")[1] : s;

    return !!sDomain && sDomain === fromDomain;
  });
}

export function supplierDisplayName(fromEmail) {
  const domain = (fromEmail || "").split("@")[1] || fromEmail || "Supplier";
  const label = domain.split(".")[0] || domain;

  return label.charAt(0).toUpperCase() + label.slice(1);
}
