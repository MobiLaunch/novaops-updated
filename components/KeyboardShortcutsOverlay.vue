<template>
  <v-dialog v-model="isOpen" max-width="480" content-class="shortcut-dialog">
    <v-card rounded="xl">
      <v-card-item class="border-b">
        <template #prepend>
          <v-avatar color="primary" size="40" rounded="lg" variant="tonal">
            <v-icon size="20">mdi-keyboard</v-icon>
          </v-avatar>
        </template>
        <v-card-title class="text-body-1 font-weight-black">Keyboard Shortcuts</v-card-title>
        <v-card-subtitle>Press <kbd>?</kbd> to toggle this overlay</v-card-subtitle>
        <template #append>
          <v-btn icon="mdi-close" variant="text" size="small" @click="isOpen = false" />
        </template>
      </v-card-item>

      <v-card-text class="pa-0">
        <div v-for="group in shortcutGroups" :key="group.title" class="px-4 py-3">
          <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2">
            {{ group.title }}
          </p>
          <div class="d-flex flex-column gap-1">
            <div
              v-for="s in group.shortcuts"
              :key="s.label"
              class="d-flex align-center justify-space-between py-1"
            >
              <span class="text-body-2">{{ s.label }}</span>
              <div class="d-flex align-center gap-1">
                <kbd v-for="(key, ki) in s.keys" :key="ki">{{ key }}</kbd>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const mod = navigator?.platform?.includes('Mac') ? '⌘' : 'Ctrl'

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

<style scoped>
kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 24px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  background: rgba(128, 128, 128, 0.06);
  color: inherit;
}
</style>
