<template>
  <span class="status-chip" :class="[`chip--${variant}`, `chip--${size}`]">
    <span class="chip-dot" :class="`dot--${variant}`" v-if="showDot && !icon" />
    <component v-if="icon" :is="icon" class="chip-icon" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted'
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
  icon?: Component | null
}>(), {
  variant: 'default',
  size: 'md',
  showDot: false,
  icon: null,
})
</script>

<style scoped>
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  border-radius: 99px;
  border: 1.5px solid transparent;
  white-space: nowrap;
  line-height: 1;
}

/* Sizes */
.chip--sm { font-size: 10px; padding: 3px 8px; }
.chip--md { font-size: 11px; padding: 4px 10px; }
.chip--lg { font-size: 12px; padding: 5px 13px; }

/* Dot */
.chip-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.chip-icon { width: 11px; height: 11px; flex-shrink: 0; }

/* Variants */
.chip--default {
  background: hsl(var(--muted) / 0.6);
  color: hsl(var(--muted-foreground));
  border-color: hsl(var(--border));
}
.dot--default { background: hsl(var(--muted-foreground)); }

.chip--success {
  background: #10b98115;
  color: #059669;
  border-color: #10b98130;
}
.dot--success { background: #10b981; }

.chip--warning {
  background: #f59e0b15;
  color: #d97706;
  border-color: #f59e0b30;
}
.dot--warning { background: #f59e0b; }

.chip--danger {
  background: #ef444415;
  color: #dc2626;
  border-color: #ef444430;
}
.dot--danger { background: #ef4444; }

.chip--info {
  background: #3b82f615;
  color: #2563eb;
  border-color: #3b82f630;
}
.dot--info { background: #3b82f6; }

.chip--accent {
  background: #8b5cf615;
  color: #7c3aed;
  border-color: #8b5cf630;
}
.dot--accent { background: #8b5cf6; }

.chip--muted {
  background: hsl(var(--muted) / 0.4);
  color: hsl(var(--muted-foreground));
  border-color: transparent;
}
.dot--muted { background: hsl(var(--muted-foreground)); }

/* Dark mode adjustments */
.dark .chip--success { background: #10b98120; color: #34d399; border-color: #10b98135; }
.dark .chip--warning { background: #f59e0b20; color: #fbbf24; border-color: #f59e0b35; }
.dark .chip--danger  { background: #ef444420; color: #f87171; border-color: #ef444435; }
.dark .chip--info    { background: #3b82f620; color: #60a5fa; border-color: #3b82f635; }
.dark .chip--accent  { background: #8b5cf620; color: #a78bfa; border-color: #8b5cf635; }
</style>
