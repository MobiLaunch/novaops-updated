import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, Wrench } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { PageHead } from "@/components/app/PageHead";
import { difficultyTone, formatGuideTime } from "@/lib/guides";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Library() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const search = async (term: string) => {
    if (!term.trim()) return;
    setParams({ q: term }, { replace: true });
    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const res = await fetch(`https://www.ifixit.com/api/2.0/search/${encodeURIComponent(term)}?filter=guide`);

      if (!res.ok) throw new Error("Failed to fetch");
      setResults((await res.json()).results || []);
    } catch (e) {
      console.error("Failed to search guides:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (params.get("q")) void search(params.get("q")!); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <>
      <PageHead title="Repair library" subtitle="Search for a device to find step-by-step iFixit repair guides." />
      <form onSubmit={(e) => { e.preventDefault(); void search(q); }} style={{ marginBottom: 16 }}>
        <SearchField label="Search for a device, like iPhone 13 or Galaxy S21" value={q} onValueChange={setQ} />
      </form>

      {loading ? <Skeleton lines={6} label="Searching guides" /> : results.length > 0 ? (
        <div className="nv-grid cols-4">
          {results.map((g) => (
            <Link key={g.guideid} to={`/library/${g.guideid}`} className="nv-panel nv-stack" style={{ padding: 0, overflow: "hidden" }}>
              {g.image ? <img src={g.image.medium} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} /> : <div style={{ height: 180, background: "var(--surface-muted)" }} />}
              <div className="nv-stack" style={{ padding: "0 16px 16px" }}>
                <div className="nv-actions" style={{ justifyContent: "space-between" }}>
                  <span className="nv-muted" style={{ fontSize: 12 }}>{g.category}</span>
                  <Badge tone={difficultyTone(g.difficulty)} size="sm">{g.difficulty || "Unknown"}</Badge>
                </div>
                <strong style={{ fontWeight: 500 }}>{g.title}</strong>
                <span className="nv-muted" style={{ fontSize: 13, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.summary || "No summary available for this guide."}</span>
                <span className="nv-muted nv-actions" style={{ fontSize: 12, justifyContent: "space-between" }}>
                  <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><Wrench size={12} />{g.type}</span>
                  {g.time_required_max ? <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><Clock size={12} />{formatGuideTime(g.time_required_max)}</span> : null}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : searched ? (
        <EmptyState title="No guides found" description="Try adjusting your search terms." />
      ) : (
        <EmptyState title="Start your search" description="Enter a device model above to find iFixit repair guides, teardowns and techniques." />
      )}
    </>
  );
}
