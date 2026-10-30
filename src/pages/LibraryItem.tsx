import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, ListOrdered } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Breadcrumb } from "@/components/arc/breadcrumb/breadcrumb";
import { Button } from "@/components/arc/button/button";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { difficultyTone, formatGuideTime } from "@/lib/guides";
import { safeHtml } from "@/lib/html";

/* eslint-disable @typescript-eslint/no-explicit-any */
const BULLET: Record<string, string> = { red: "var(--danger)", orange: "var(--warning)", yellow: "var(--warning)", green: "var(--success)", blue: "var(--accent)", violet: "var(--accent)", black: "var(--foreground)", icon_caution: "var(--danger)", icon_note: "var(--accent)", icon_reminder: "var(--warning)" };

export default function LibraryItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [img, setImg] = useState<Record<number, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://www.ifixit.com/api/2.0/guides/${id}`);

      if (!res.ok) throw new Error(`Failed to load guide (${res.status})`);
      setGuide(await res.json());
    } catch (e) {
      setError((e as Error).message || "Could not load the repair guide.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="nv-stack" style={{ gap: 16 }}>
      <div className="nv-actions">
        <Button variant="ghost" size="sm" aria-label="Back" onClick={() => navigate(-1)}><ArrowLeft size={16} /></Button>
        <Breadcrumb items={[{ label: "Library", onClick: () => navigate("/library") }, ...(guide?.category ? [{ label: guide.category }] : []), { label: guide?.title || "Loading…" }]} />
      </div>

      {loading ? <Skeleton lines={6} label="Loading guide" /> : error ? (
        <Alert tone="danger" title={error}><Button size="sm" onClick={load}>Try again</Button></Alert>
      ) : guide && (
        <>
          <div className="nv-panel nv-grid" style={{ gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", padding: 0, overflow: "hidden" }}>
            {guide.image ? <img src={guide.image.standard || guide.image.medium} alt="" style={{ width: "100%", height: "100%", maxHeight: 360, objectFit: "cover" }} /> : <div />}
            <div className="nv-stack" style={{ padding: 24 }}>
              <span className="nv-muted" style={{ fontSize: 13 }}>{guide.category} · {guide.type}</span>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500 }}>{guide.title}</h1>
              <div className="nv-actions">
                <Badge tone={difficultyTone(guide.difficulty)}>{guide.difficulty || "Unknown"}</Badge>
                {guide.time_required_max ? <Badge icon={<Clock size={12} />}>{formatGuideTime(guide.time_required_max)} estimated</Badge> : null}
                {guide.steps?.length ? <Badge icon={<ListOrdered size={12} />}>{guide.steps.length} steps</Badge> : null}
              </div>
              {guide.introduction_rendered ? <div className="nv-muted guide-html" dangerouslySetInnerHTML={safeHtml(guide.introduction_rendered)} /> : <p className="nv-muted" style={{ margin: 0 }}>{guide.summary}</p>}
            </div>
          </div>

          {guide.steps?.length > 0 && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "8px 0 0" }}>Step-by-step instructions</h2>
              {guide.steps.map((step: any, i: number) => {
                const media: any[] = step.media?.data ?? [];
                const cur = media[img[i] ?? 0] ?? media[0];

                return (
                  <div key={step.stepid ?? i} id={`step-${i + 1}`} className="nv-panel nv-grid" style={{ gridTemplateColumns: media.length ? "minmax(0, 5fr) minmax(0, 7fr)" : "1fr" }}>
                    {media.length > 0 && (
                      <div className="nv-stack">
                        <img src={cur.standard || cur.medium} alt={`Step ${i + 1}`} style={{ width: "100%", borderRadius: 10, objectFit: "cover" }} />
                        {media.length > 1 && <div className="nv-chip-row">{media.map((_, j) => <Button key={j} size="sm" variant={(img[i] ?? 0) === j ? "primary" : "secondary"} onClick={() => setImg({ ...img, [i]: j })}>{j + 1}</Button>)}</div>}
                      </div>
                    )}
                    <div className="nv-stack">
                      <h3 style={{ margin: 0, fontWeight: 500 }}>{step.title || `Step ${i + 1}`}</h3>
                      {(step.lines ?? []).map((l: any, j: number) => (
                        <div key={j} style={{ display: "flex", gap: 10 }}>
                          <span style={{ width: 8, height: 8, marginTop: 7, flex: "none", borderRadius: 99, background: BULLET[l.bullet] || "var(--text-muted)" }} />
                          <div className="guide-html" dangerouslySetInnerHTML={safeHtml(l.text_rendered)} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div><Link to="/library" className="nv-muted" style={{ textDecoration: "underline" }}>Back to library</Link></div>
        </>
      )}
    </div>
  );
}
