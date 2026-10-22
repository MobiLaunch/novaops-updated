/** A static metric tile for formatted values (currency, text) that Arc's animated MetricCard can't show. */
export function StatCard({ label, value, context }: { label: string; value: string; context: string }) {
  return (
    <div className="nv-stat">
      <span className="nv-stat-label">{label}</span>
      <strong className="nv-stat-value">{value}</strong>
      <span className="nv-stat-context">{context}</span>
    </div>
  );
}
