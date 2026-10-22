import type { ReactNode } from "react";

export function AuthLayout({ title, subtitle, children, wide }: { title: string; subtitle?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="nv-center">
      <div className="nv-auth-card" style={wide ? { width: "min(560px, 100%)" } : undefined}>
        <div className="nv-brand" style={{ padding: 0 }}><span className="nv-brand-mark">N</span>NovaOps</div>
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="nv-muted" style={{ margin: "4px 0 0" }}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
