<template>
  <div class="d-flex flex-column" style="gap: 24px; max-width: 1400px">

    <!-- ── Page Header ──────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between flex-wrap" style="gap: 16px">
      <div class="d-flex align-center" style="gap: 16px">
        <v-avatar size="48" rounded="xl" color="cyan" variant="flat">
          <v-icon icon="mdi-toolbox-outline" size="24" color="white" />
        </v-avatar>
        <div>
          <h1 class="text-h5 font-weight-black">Tools</h1>
          <p class="text-body-2 text-medium-emphasis">Barcodes, import/export, invoices & forms</p>
        </div>
      </div>
    </div>

    <!-- ── Tabs ─────────────────────────────────────────────── -->
    <v-tabs v-model="activeTab" color="cyan" class="mb-2">
      <v-tab value="barcodes">
        <v-icon start>mdi-barcode-scan</v-icon>
        Barcodes
      </v-tab>
      <v-tab value="import">
        <v-icon start>mdi-upload</v-icon>
        Import / Export
      </v-tab>
      <v-tab value="forms">
        <v-icon start>mdi-file-document-outline</v-icon>
        Forms
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab" style="overflow: visible">

      <!-- ══ Barcodes Tab ══════════════════════════════════════ -->
      <v-tabs-window-item value="barcodes">
        <BarcodesTab />
      </v-tabs-window-item>

      <!-- ══ Import / Export Tab ═══════════════════════════════ -->
      <v-tabs-window-item value="import">
        <ImportTab />
      </v-tabs-window-item>

      <!-- ══ Forms Tab ════════════════════════════════════════= -->
      <v-tabs-window-item value="forms">
        <FormsTab />
      </v-tabs-window-item>

    </v-tabs-window>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const activeTab = ref('barcodes')
</script>
