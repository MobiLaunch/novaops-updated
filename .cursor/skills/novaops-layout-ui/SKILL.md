---
name: novaops-layout-ui
description: Audits NovaOps layout and UI for bugs, Vuetify migration gaps, broken MDI icons, and inconsistent PrimeVue patterns. Use when reviewing UI, fixing layout issues, polishing pages, running a UI audit, or when the user asks for layout/UI improvements in novaops-updated.
---

# NovaOps Layout & UI Agent

Specialized workflow for **finding bugs** and **improvement opportunities** in this Nuxt 3 + PrimeVue 4 app. Do not guess—run checks and read affected files.

## When to use

- User asks for UI cleanup, layout review, design consistency, or "find UI bugs"
- Before/after migrating a page off Vuetify
- After bulk icon or CSS changes

## Quick start

1. Run automated audit:
   ```bash
   node scripts/ui-audit.mjs
   ```
2. Read `assets/css/main.css` (design tokens + utilities) and `utils/status.ts` (Tag severities).
3. Open top offending files from audit output; fix **critical** first.
4. Run `npm run build` after substantive template changes.
5. Deliver findings using the report format below.

## Automated checks (`scripts/ui-audit.mjs`)

| Check | Severity | Meaning |
|-------|----------|---------|
| `<v-*` | Critical | Vuetify not in package.json — components won't render |
| `--v-theme-` | Critical | Stale Vuetify theme variables |
| MDI mashed classes | High | e.g. `mdi-upload-text-2xl` — icon won't show |
| `mdi mdi-{{` | Critical | Broken dynamic icon from bad migration |
| Vuetify utility classes | Medium | `d-flex`, `pa-4`, `text-medium-emphasis` — layout drift |
| Missing `page-shell` | Suggestion | Page layout inconsistent |

Fix mashed MDI in bulk when widespread:
```bash
node scripts/fix-mdi-mashed.mjs
```

## Manual review checklist

### Layout & responsiveness
- [ ] Page uses `page-shell` (max-width 1400px, consistent vertical rhythm)
- [ ] Mobile: no horizontal overflow; tables/cards stack; touch targets ≥ 36px
- [ ] Dialogs: `max-w-* mx-4`, `max-h-[90dvh]` for scrollable content
- [ ] `layouts/default.vue`: main padding `p-4 md:p-6` not fighting page padding

### PrimeVue patterns (target state)
| Vuetify | Replace with |
|---------|----------------|
| `v-dialog` + `v-card` | `Dialog` + `#header` / `#footer` |
| `v-btn` | `Button` + MDI in slot |
| `v-text-field` / `v-textarea` | `InputText` / `Textarea` + `rounded-xl` |
| `v-select` | `Select` |
| `v-data-table` | `DataTable` + `Column` |
| `v-tabs` | `Tabs` / `TabList` / `Tab` / `TabPanels` / `TabPanel` |
| `v-chip` | `Tag` or `filter-chip` buttons |
| `v-alert` | `Message` |
| `v-row` / `v-col` | CSS `grid` + utilities from `main.css` |

### Icons
- Static: `<i class="mdi mdi-magnify"></i>`
- Dynamic: `<i class="mdi" :class="iconName"></i>` — never `mdi mdi-{{ ... }}`
- Spacing: separate classes — `mdi mdi-plus mr-1`, not `mdi-plus-mr-1`

### Status & color
- Use `utils/status.ts`: `ticketStatusSeverity`, `prioritySeverity`, `ticketStatusHex`
- Avoid `var(--v-theme-*)` and Vuetify color names on chips

### Reference implementations
- Page: `pages/customers.vue`, `pages/bookings.vue`, `pages/inventory.vue`
- Dialog: `components/CustomerEditDialog.vue`, `components/HouseCallDialog.vue`
- Multi-step: `components/NewTicketDialog.vue`

## Known migration debt (verify with audit)

As of skill creation, likely still Vuetify-heavy:
- `pages/settings.vue`
- `pages/analytics.vue`

Re-grep before reporting:
```bash
rg "<v-" --glob "*.vue" -c
```

## Improvement opportunities (non-blocking)

Look for these when audit is clean:
- Duplicate KPI/header markup → extract shared pattern (`kpi-card`, page header block)
- Inconsistent empty states (mix of card vs dashed border)
- `Button` without `class="text-none"` (label casing)
- Tables without row hover / empty slot
- Filter chips: prefer `filter-chip` + `filter-chip--active` over ad-hoc styles
- Hard-coded hex colors instead of semantic utilities
- Missing `min-w-0` / `truncate` on flex children with long text

## Fix workflow

1. **Critical**: Remove all `<v-*` from touched files or migrate whole page in one PR-sized chunk.
2. **High**: Run `fix-mdi-mashed.mjs`, then fix remaining dynamic icons by hand.
3. **Medium**: Replace Vuetify utility classes with `main.css` utilities (`flex`, `gap-*`, `text-muted-foreground`).
4. **Polish**: Align with reference page; add `page-shell`; unify search bars (`search-field-wrap`).

Keep diffs minimal—do not refactor unrelated logic.

## Report format

```markdown
# UI Audit — [date or scope]

## Summary
[1–2 sentences: overall health, blocking issues]

## Critical (must fix)
- **file**: issue — suggested fix

## High
- ...

## Medium / polish
- ...

## Improvements (optional)
- ...

## Verification
- [ ] `node scripts/ui-audit.mjs` passes (exit 0)
- [ ] `npm run build` passes
- [ ] [pages manually checked]
```

## Additional resources

- Detailed checklist: [checklist.md](checklist.md)
- Project CSS: `assets/css/main.css`
- Status helpers: `utils/status.ts`
