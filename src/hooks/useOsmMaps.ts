import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
const read = (): Record<string, any> => { try { return JSON.parse(localStorage.getItem("osm_cache") || "{}"); } catch { return {}; } };

export const osmEmbedUrl = (pt: any) => {
  const [lat1, lat2, lon1, lon2] = pt.boundingbox || [Number(pt.lat) - 0.005, Number(pt.lat) + 0.005, Number(pt.lon) - 0.005, Number(pt.lon) + 0.005];

  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${pt.lat}%2C${pt.lon}`;
};

/** Returns map embed URLs by address, geocoding unknown ones one at a time (Nominatim allows 1 request per second). */
export function useOsmMaps(addresses: string[]) {
  const [cache, setCache] = useState(read);
  const key = [...new Set(addresses.filter((a) => a && a.length >= 5))].sort().join("|");

  useEffect(() => {
    let alive = true;
    const todo = key.split("|").filter((a) => a && !cache[a]);

    (async () => {
      for (const addr of todo) {
        if (!alive) return;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`);
          const [hit] = await res.json();
          const entry = hit ? { lat: hit.lat, lon: hit.lon, boundingbox: hit.boundingbox } : { notfound: true };
          const next = { ...read(), [addr]: entry };

          try { localStorage.setItem("osm_cache", JSON.stringify(next)); } catch { /* ignore */ }
          if (alive) setCache(next);
        } catch { /* offline */ }
        await new Promise((r) => setTimeout(r, 1100));
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (address: string) => { const c = cache[address]; return c && !c.notfound ? osmEmbedUrl(c) : ""; };
}
