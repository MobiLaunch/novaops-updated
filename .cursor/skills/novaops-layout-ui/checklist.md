# NovaOps UI checklist (reference)

## Per-page pass

1. Open page in browser at mobile + desktop widths
2. Confirm no blank areas where Vuetify components were removed but not replaced
3. Tab through interactive elements (focus visible)
4. Open every dialog on the page
5. Test empty states (no data)
6. Test long strings (customer name, address, issue text)

## Component pass

- [ ] All buttons have visible labels or `aria-label` on icon-only
- [ ] Form fields have placeholders or visible labels
- [ ] Loading states on async actions (`:loading` on Button)
- [ ] Destructive actions use `severity="danger"`

## Layout shell

```html
<div class="page-shell">
  <header class="flex items-center justify-between flex-wrap gap-3">...</header>
  ...
</div>
```

## Search bar pattern

```html
<div class="search-field-wrap">
  <i class="mdi mdi-magnify"></i>
  <InputText v-model="q" class="w-full" />
</div>
```

## Filter chips

```html
<button type="button" class="filter-chip" :class="{ 'filter-chip--active': active }">
```

## Dialog footer

```html
<template #footer>
  <Button label="Cancel" variant="text" class="text-none" />
  <Button label="Save" class="text-none font-bold" />
</template>
```
