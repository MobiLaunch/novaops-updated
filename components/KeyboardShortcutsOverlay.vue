<template>
  <v-dialog
    v-model="isOpen"
    max-width="480"
  >
    <v-card class="rounded-xl">
      <v-card-item class="pb-3 border-b">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <i class="mdi mdi-keyboard text-lg"></i>
          </div>
          <div>
            <div class="text-sm font-black text-foreground">Keyboard Shortcuts</div>
            <div class="text-[10px] text-muted-foreground mt-0.5">Press <kbd class="px-1.5 py-0.5 bg-muted border border-border/80 text-[10px] font-bold rounded shadow-sm">?</kbd> to toggle this overlay</div>
          </div>
        </div>
      </v-card-item>

      <v-card-text class="pt-4 pb-4">
        <div class="flex flex-col divide-y divide-border/40 pr-1">
          <div v-for="group in shortcutGroups" :key="group.title" class="py-3.5 first:pt-0 last:pb-0">
            <p class="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2.5">
              {{ group.title }}
            </p>
            <div class="flex flex-col gap-2">
              <div
                v-for="s in group.shortcuts"
                :key="s.label"
                class="flex items-center justify-between text-xs py-0.5"
              >
                <span class="font-medium text-foreground/90">{{ s.label }}</span>
                <div class="flex items-center gap-1.5">
                  <kbd v-for="(key, ki) in s.keys" :key="ki" class="px-2 py-0.5 bg-muted border border-border text-[10px] rounded-md font-bold shadow-sm">{{ key }}</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const mod = (process.client && navigator?.platform?.includes('Mac')) ? '⌘' : 'Ctrl'

const shortcutGroups = [
  {
    title: 'Quick Actions',
    shortcuts: [
      { label: 'New Ticket', keys: [mod, 'T'] },
      { label: 'New House Call', keys: [mod, 'H'] },
      { label: 'New Customer', keys: [mod, 'U'] },
      { label: 'Open Register', keys: [mod, 'R'] },
      { label: 'Global Search', keys: [mod, 'K'] },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { label: 'Dashboard', keys: [mod, 'D'] },
      { label: 'Analytics', keys: [mod, 'A'] },
      { label: 'Tools', keys: [mod, 'I'] },
      { label: 'Settings', keys: [mod, ','] },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { label: 'Show Shortcuts', keys: ['?'] },
    ],
  },
]
</script>
