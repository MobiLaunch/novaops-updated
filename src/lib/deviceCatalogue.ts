import { getClient } from "@/lib/supabase";

/**
 * The device catalogue both apps share.
 *
 * It lives in the website's `site_settings` row (`mobicare-config`) under
 * `deviceManufacturers`, is edited from that app's Admin → Site Content, and
 * is what its booking wizard walks: manufacturer → device type → model →
 * generation. NovaOps reads the same list so a ticket taken at the counter
 * spells a device the same way a ticket converted from a website booking
 * does — they write the same two columns, and until now only one of them had
 * a vocabulary.
 *
 * `site_settings` is `public read … using (true)`, so this needs no
 * permissions of its own.
 */

export interface DeviceModel {
  id: string;
  name: string;
  generations: string[];
}

export interface DeviceCategory {
  id: string;
  name: string;
  models: DeviceModel[];
}

export interface DeviceManufacturer {
  id: string;
  name: string;
  categories: DeviceCategory[];
}

/** One selectable device, flattened out of the tree. */
export interface DeviceOption {
  /** Goes to `tickets.device` — "Apple Phone". */
  deviceType: string;
  /** Goes to `tickets.device_model` — "iPhone 15 Pro Max". */
  model: string;
  /** What the search matches against. */
  search: string;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Flatten the tree the same way the booking wizard composes its two strings:
 * `device_type` is "{manufacturer} {category}" and `device_model` is
 * "{model} {generation}". Matching that exactly is the whole point — a
 * different join here would put two spellings of the same phone in the
 * ticket table.
 */
export function flattenCatalogue(tree: DeviceManufacturer[]): DeviceOption[] {
  const out: DeviceOption[] = [];

  for (const manufacturer of asArray<DeviceManufacturer>(tree)) {
    for (const category of asArray<DeviceCategory>(manufacturer?.categories)) {
      const deviceType = [manufacturer?.name, category?.name].filter(Boolean).join(" ");

      for (const model of asArray<DeviceModel>(category?.models)) {
        const generations = asArray<string>(model?.generations);
        // A model with no generations is selectable on its own — that is how
        // the wizard treats it, and how the import stores one-off hardware
        // like a Steam Deck.
        const labels = generations.length > 0 ? generations : [""];

        for (const generation of labels) {
          const modelLabel = [model?.name, generation].filter(Boolean).join(" ");

          if (!deviceType && !modelLabel) continue;
          out.push({
            deviceType,
            model: modelLabel,
            search: `${deviceType} ${modelLabel}`.toLowerCase(),
          });
        }
      }
    }
  }

  return out;
}

let cache: DeviceOption[] | null = null;
let inflight: Promise<DeviceOption[]> | null = null;

/**
 * Read the catalogue once per session. It is a single row and changes about
 * as often as the shop's opening hours, so re-reading it on every ticket
 * would be wasted work.
 */
export async function fetchDeviceCatalogue(): Promise<DeviceOption[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const client = getClient();

    if (!client) return [];

    const { data, error } = await client
      .from("site_settings")
      .select("content")
      .eq("id", "mobicare-config")
      .maybeSingle();

    // No website schema yet, or no row: the picker falls back to free text
    // rather than blocking ticket creation.
    if (error || !data) {
      inflight = null;

      return [];
    }

    const content = (data.content ?? {}) as { deviceManufacturers?: DeviceManufacturer[] };

    cache = flattenCatalogue(asArray<DeviceManufacturer>(content.deviceManufacturers));

    return cache;
  })();

  return inflight;
}

/** Rank matches so a prefix hit beats one buried in the middle. */
export function searchDevices(options: DeviceOption[], query: string, limit = 50): DeviceOption[] {
  const q = query.trim().toLowerCase();

  if (!q) return options.slice(0, limit);

  const terms = q.split(/\s+/);
  const hits: { option: DeviceOption; score: number }[] = [];

  for (const option of options) {
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      const at = option.search.indexOf(term);

      if (at < 0) {
        matchedAll = false;
        break;
      }
      score += at === 0 ? 0 : Math.min(at, 50);
    }
    if (matchedAll) hits.push({ option, score });
    if (hits.length > 400) break;
  }

  return hits
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((h) => h.option);
}
