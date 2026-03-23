const fs = require('fs');
const path = require('path');

const uiDir = path.join(process.cwd(), 'components/ui');
if(fs.existsSync(uiDir)) { fs.rmSync(uiDir, { recursive: true, force: true }); }
fs.mkdirSync(uiDir, { recursive: true });

function writeComp(folder, exportsObj) {
  const dir = path.join(uiDir, folder);
  fs.mkdirSync(dir, { recursive: true });
  
  let indexContent = '';
  
  for (const [name, template] of Object.entries(exportsObj)) {
    const filePath = path.join(dir, name + '.vue');
    fs.writeFileSync(filePath, template);
    indexContent += `export { default as ${name} } from './${name}.vue';\n`;
  }
  
  fs.writeFileSync(path.join(dir, 'index.ts'), indexContent);
}

// 1. Button
writeComp('button', {
  Button: `<template><button class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"><slot/></button></template>`
});

// 2. Input
writeComp('input', {
  Input: `<template><input class="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"></template><script setup>defineProps(['modelValue']); defineEmits(['update:modelValue']);</script>`
});

// 3. Label
writeComp('label', {
  Label: `<template><label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><slot/></label></template>`
});

// 4. Textarea
writeComp('textarea', {
  Textarea: `<template><textarea class="flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"></textarea></template><script setup>defineProps(['modelValue']); defineEmits(['update:modelValue']);</script>`
});

// 5. Badge
writeComp('badge', {
  Badge: `<template><div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-primary text-primary-foreground"><slot/></div></template>`
});

// 6. Card
writeComp('card', {
  Card: `<template><div class="rounded-2xl border bg-card text-card-foreground shadow"><slot/></div></template>`,
  CardHeader: `<template><div class="flex flex-col space-y-1.5 p-6"><slot/></div></template>`,
  CardTitle: `<template><h3 class="font-semibold leading-none tracking-tight"><slot/></h3></template>`,
  CardDescription: `<template><p class="text-sm text-muted-foreground"><slot/></p></template>`,
  CardContent: `<template><div class="p-6 pt-0"><slot/></div></template>`,
  CardFooter: `<template><div class="flex items-center p-6 pt-0"><slot/></div></template>`
});

// 7. Dialog
writeComp('dialog', {
  Dialog: `<template><slot/></template><script setup>import { provide, computed } from 'vue'; const props = defineProps({ open: Boolean }); const emits = defineEmits(['update:open']); provide('dialogState', { open: computed(() => props.open), close: () => emits('update:open', false) });</script>`,
  DialogContent: `<template><div v-if="state.open.value" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="state.close()"><div class="bg-background rounded-2xl p-6 w-full max-w-lg shadow-lg relative"><slot/></div></div></template><script setup>import { inject } from 'vue'; const state = inject('dialogState', { open: { value: true }, close: () => {} });</script>`,
  DialogHeader: `<template><div class="flex flex-col space-y-1.5 text-center sm:text-left"><slot/></div></template>`,
  DialogTitle: `<template><h2 class="text-lg font-semibold leading-none tracking-tight"><slot/></h2></template>`,
  DialogDescription: `<template><p class="text-sm text-muted-foreground"><slot/></p></template>`,
  DialogTrigger: `<template><slot/></template>`,
  DialogFooter: `<template><div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><slot/></div></template>`
});

// 8. Select
writeComp('select', {
  Select: `<template><select class="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)"><slot/></select></template><script setup>defineProps(['modelValue']); defineEmits(['update:modelValue']);</script>`,
  SelectTrigger: `<template><slot/></template>`,
  SelectValue: `<template><slot/></template>`,
  SelectContent: `<template><slot/></template>`,
  SelectItem: `<template><option :value="value"><slot/></option></template><script setup>defineProps(['value']);</script>`
});

// 9. Table
writeComp('table', {
  Table: `<template><div class="relative w-full overflow-auto"><table class="w-full caption-bottom text-sm"><slot/></table></div></template>`,
  TableHeader: `<template><thead class="[&_tr]:border-b"><slot/></thead></template>`,
  TableBody: `<template><tbody class="[&_tr:last-child]:border-0"><slot/></tbody></template>`,
  TableRow: `<template><tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><slot/></tr></template>`,
  TableHead: `<template><th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"><slot/></th></template>`,
  TableCell: `<template><td class="p-2 align-middle [&:has([role=checkbox])]:pr-0"><slot/></td></template>`
});

console.log('UI components rewritten successfully.');
