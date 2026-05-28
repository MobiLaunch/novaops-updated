---
name: novaops-layout-ui
description: Audits NovaOps layout and UI for bugs, PrimeVue remnants, broken MDI icons, and Vuetify 3 design consistency. Use when reviewing UI, fixing layout issues, polishing pages, running a UI audit, or when the user asks for layout/UI improvements in novaops-updated.
---

# NovaOps Layout & UI Agent

Specialized workflow for **finding bugs** and **improvement opportunities** in this Nuxt 3 + Vuetify 3 app. Do not guess—run checks and read affected files.

## When to use

- User asks for UI cleanup, layout review, design consistency, or "find UI bugs"
- Before/after migrating a page or reviewing layout/design tokens
- After bulk icon or CSS changes

## Quick start

1. Run automated audit:
   ```bash
   node scripts/ui-audit.mjs
   ```
2. Read `assets/css/main.css` (design tokens + utilities) and `utils/status.ts` (Chip colors).
3. Open top offending files from audit output; fix **critical** first.
4. Run `npm run build` after substantive template changes.
5. Deliver findings using the report format below.

## Automated checks (`scripts/ui-audit.mjs`)

| Check | Severity | Meaning |
|-------|----------|---------|
| `<Button`, `<Dialog`, etc. | Critical | PrimeVue components remaining in template |
| `--p-` | Critical | Stale PrimeVue theme variables |
| `from 'primevue'` | Critical | Remaining PrimeVue imports |
| MDI mashed classes | High | e.g. `mdi-upload-text-2xl` — icon won't show |
| `mdi mdi-{{` | Critical | Broken dynamic icon from bad migration |
| Missing `page-shell` | Suggestion | Page layout inconsistent |

## Manual review checklist

### Layout & responsiveness
- [ ] Page uses `page-shell` (max-width 1400px, consistent vertical rhythm)
- [ ] Mobile: no horizontal overflow; tables/cards stack; touch targets ≥ 36px
- [ ] Dialogs: `max-w-* mx-4`, `max-h-[90dvh]` for scrollable content
- [ ] `layouts/default.vue`: main padding `p-4 md:p-6` not fighting page padding

### Vuetify 3 patterns (target state)
| PrimeVue | Replace with |
|---------|----------------|
| `Dialog` | `v-dialog` + `v-card` |
| `Button` | `v-btn` |
| `InputText` / `Textarea` | `v-text-field` / `v-textarea` |
| `Select` | `v-select` |
| `DataTable` + `Column` | `v-data-table` |
| `Tabs` / `TabList` / `Tab` / `TabPanels` / `TabPanel` | `v-tabs` + `v-window` + `v-window-item` |
| `Tag` | `v-chip` |
| `Message` | `v-alert` |
| `ToggleSwitch` | `v-switch` |

### Icons
- Static: `<i class="mdi mdi-magnify"></i>`
- Dynamic: `<i class="mdi" :class="iconName"></i>` — never `mdi mdi-{{ ... }}`
- Spacing: separate classes — `mdi mdi-plus mr-1`, not `mdi-plus-mr-1`

### Status & color
- Use `utils/status.ts`: `ticketStatusSeverity`, `prioritySeverity`, `ticketStatusHex`
- Use Vuetify theme colors (e.g., `success`, `warning`, `error`, `info`, `secondary`)

### Reference implementations
- Page: `pages/customers.vue`, `pages/bookings.vue`, `pages/inventory.vue`
- Dialog: `components/CustomerEditDialog.vue`, `components/HouseCallDialog.vue`
- Multi-step: `components/NewTicketDialog.vue`

## Verification

Re-grep before reporting:
```bash
rg "<(Dialog|Button|DataTable|Column|InputText|Textarea|Select|Tag|Message|Tabs|TabList|Tab|TabPanel|TabPanels|Drawer|Popover|ProgressBar|Stepper|Step|Accordion|FloatLabel|IconField|InputIcon|SelectButton|Knob|AutoComplete|DatePicker|InputNumber|ToggleSwitch|Checkbox)[\s/>]" --glob "*.vue"
```

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

- Project CSS: `assets/css/main.css`
- Status helpers: `utils/status.ts`
