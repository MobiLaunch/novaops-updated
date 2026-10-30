/** Placeholder rows shown while a list loads, so the page doesn't jump when data arrives. */
export function ListSkeleton({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="nv-panel nv-skel-list" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="nv-skel-row"><span className="nv-skel nv-skel-lg" style={{ width: `${55 + ((i * 17) % 30)}%` }} /><span className="nv-skel nv-skel-sm" style={{ width: `${30 + ((i * 11) % 25)}%` }} /></div>
      ))}
    </div>
  );
}
