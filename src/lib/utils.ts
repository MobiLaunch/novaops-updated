// Supabase jsonb/array columns can come back as null, an unexpected shape
// (e.g. `{}` instead of `[]`, if a row predates a schema change or was
// inserted by an older client), or simply missing on an old row. `x || []`
// only falls back on falsy values, so a truthy non-array like `{}` still
// slips through and crashes the first `.map()`/`.length` call on it. This
// normalizes any value to a safe array.
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function formatCurrency(amount: number | string | null | undefined): string {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
