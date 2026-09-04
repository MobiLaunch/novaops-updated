// Minimal RFC 4180-ish CSV parser — handles quoted fields, embedded commas,
// escaped quotes ("") and both \n and \r\n line endings. No dependency
// needed for the simple "spreadsheet export" files this is meant to import.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// Parses a CSV with a header row into objects keyed by lower-cased,
// trimmed header names (so "Full Name" and "full_name" both work as
// "fullname" once callers normalize their expected keys the same way).
export function parseCsvWithHeader(text: string): Record<string, string>[] {
  const rows = parseCsv(text);

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""));

  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};

    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? "").trim();
    });

    return obj;
  });
}

// Picks the first present value among a list of accepted header-key
// aliases (already normalized the same way parseCsvWithHeader normalizes).
export function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k]) return row[k];
  }

  return "";
}
