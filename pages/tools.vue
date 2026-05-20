<template>
  <div class="flex flex-col gap-6">

    <!-- Page Header -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
          <i class="mdi mdi-magic-staff-text-2xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-black">Tools</h1>
          <p class="text-sm text-muted-foreground mt-0.5">Barcodes, import/export, invoices &amp; forms</p>
        </div>
      </div>
    </div>

    <!-- Tabs Selection -->
    <div class="flex gap-2 border-b border-border pb-px shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px"
        :class="[
          activeTab === tab.value
            ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-extrabold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        ]"
        @click="activeTab = tab.value"
      >
        <i class="mdi mdi-text-base" :class="tab.icon"></i>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Panels -->
    <div class="mt-2">
      <BarcodesTab v-if="activeTab === 'barcodes'" />
      <ImportTab v-slot="{}" v-else-if="activeTab === 'import'" />
      <FormsTab v-slot="{}" v-else-if="activeTab === 'forms'" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({ middleware: ['auth'] })

const activeTab = ref('barcodes')

const tabs = [
  { label: 'Barcodes', value: 'barcodes', icon: 'mdi-barcode-scan' },
  { label: 'Import / Export', value: 'import', icon: 'mdi-upload' },
  { label: 'Forms', value: 'forms', icon: 'mdi-file-document-outline' }
]
</script>
