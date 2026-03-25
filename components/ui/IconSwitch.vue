<template>
  <button
    class="icon-switch"
    :class="[
      modelValue ? 'switch--on' : 'switch--off',
      modelValue && accentClass,
      `switch--${size}`,
    ]"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    @click="toggle"
  >
    <span class="switch-track">
      <span class="switch-thumb">
        <component
          :is="modelValue ? iconOn : iconOff"
          class="switch-icon"
        />
      </span>
    </span>
    <span v-if="label" class="switch-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  label?: string
  iconOn?: Component | null
  iconOff?: Component | null
  accentClass?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  label: '',
  iconOn: null,
  iconOff: null,
  accentClass: '',
  size: 'md',
})

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
const toggle = () => emit('update:modelValue', !props.modelValue)
</script>

<style scoped>
.icon-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
}
.icon-switch:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 3px; border-radius: 99px; }

/* Track */
.switch-track {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 99px;
  transition: background 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s;
  border: 1.5px solid transparent;
}

/* Sizes */
.switch--sm .switch-track { width: 44px; height: 26px; padding: 2px; }
.switch--md .switch-track { width: 52px; height: 30px; padding: 3px; }
.switch--lg .switch-track { width: 60px; height: 34px; padding: 3px; }

/* Off state */
.switch--off .switch-track {
  background: hsl(var(--muted));
  border-color: hsl(var(--border));
}
/* On state base */
.switch--on .switch-track {
  background: hsl(var(--primary));
  border-color: transparent;
  box-shadow: 0 2px 8px hsl(var(--primary) / 0.4);
}

/* Accent overrides on .switch-track when on */
.icon-switch.bg-red-500\/80 .switch-track    { background: rgba(239,68,68,0.85); box-shadow: 0 2px 8px rgba(239,68,68,0.35); }
.icon-switch.bg-green-500\/80 .switch-track  { background: rgba(34,197,94,0.85); box-shadow: 0 2px 8px rgba(34,197,94,0.35); }
.icon-switch.bg-purple-500\/80 .switch-track { background: rgba(168,85,247,0.85); box-shadow: 0 2px 8px rgba(168,85,247,0.35); }
.icon-switch.bg-blue-500\/80 .switch-track   { background: rgba(59,130,246,0.85); box-shadow: 0 2px 8px rgba(59,130,246,0.35); }

/* Thumb */
.switch-thumb {
  position: absolute;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  transition: transform 0.28s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.switch--sm .switch-thumb { width: 20px; height: 20px; }
.switch--md .switch-thumb { width: 22px; height: 22px; }
.switch--lg .switch-thumb { width: 26px; height: 26px; }

/* Thumb translate OFF */
.switch--sm.switch--off .switch-thumb { transform: translateX(0px); }
.switch--md.switch--off .switch-thumb { transform: translateX(0px); }
.switch--lg.switch--off .switch-thumb { transform: translateX(0px); }

/* Thumb translate ON */
.switch--sm.switch--on .switch-thumb { transform: translateX(18px); }
.switch--md.switch--on .switch-thumb { transform: translateX(22px); }
.switch--lg.switch--on .switch-thumb { transform: translateX(26px); }

/* Icon inside thumb */
.switch-icon { width: 11px; height: 11px; color: hsl(var(--muted-foreground)); transition: color 0.2s; }
.switch--on .switch-icon { color: hsl(var(--primary)); }

/* Label */
.switch-label {
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

/* Hover / active */
.icon-switch:hover .switch-track { filter: brightness(1.06); }
.icon-switch:active .switch-thumb { transform: scaleX(1.12) translateX(var(--tx, 0px)); }
</style>
