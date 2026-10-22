# Agent guidance (NovaOps)

React 19 + Vite + Arc UI. Pages live in `src/pages`, shared widgets in `src/components/app`, vendored Arc components in `src/components/arc` (do not edit those; they are overwritten when re-added with the shadcn CLI).

## UI rules

- Build screens by composing Arc components. Prefer an Arc component over custom markup, and install a missing one with `npx shadcn@latest add @uiarc/<name>`.
- Style with Arc tokens, never hex values: `--background`, `--surface`, `--foreground`, `--text-secondary`, `--text-muted`, `--border`, `--accent`, `--success`, `--warning`, `--danger`, `--space-*`, `--radius-*`. Shared layout classes (`nv-*`) are in `src/styles/app.css`.
- Sentence case everywhere. No uppercase eyebrow labels, no decorative gradients, no em dashes in copy.
- One primary button per surface. Secondary actions use `secondary` or `ghost`; destructive ones use `danger` or `HoldToConfirm` for irreversible deletes.
- Every form control needs a visible `label` (Arc requires it).
- Use `EmptyState` for empty lists and `Skeleton` for loading.
- Confirm results with a toast from `@/hooks/useToast` (`toast.success`, `toast.danger`, ...).
- Money is shown as formatted text (`formatCurrency`); the animated `MetricCard` is for counts, `StatCard` for formatted values.

## Data

All reads and writes go through `src/lib/store.ts` (Zustand). Never call Supabase tables from a component when a store action exists. Server-only secrets stay in `api/` functions, read from `process.env`.

## Checks before committing

```bash
npm run typecheck && npm run build
```
