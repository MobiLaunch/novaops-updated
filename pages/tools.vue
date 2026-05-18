<template>
  <div class="d-flex flex-column gap-6">

    <!-- ── Page Header ──────────────────────────────────────── -->
    <div class="d-flex flex-column gap-2">
      <div class="d-flex align-center gap-3">
        <v-avatar size="48" rounded="lg" color="cyan" variant="tonal">
          <v-icon icon="mdi-magic-staff" size="24" color="cyan" />
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-black">Tools</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">Barcodes, import/export, invoices &amp; forms</p>
        </div>
      </div>
    </div>

    <!-- ── Tabs ─────────────────────────────────────────────── -->
    <v-card class="rounded-xl border" elevation="0">
      <v-tabs v-model="activeTab" color="cyan" class="border-b">
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
          <div class="pa-4 pa-md-6">
            <BarcodesTab />
          </div>
        </v-tabs-window-item>

        <!-- ══ Import / Export Tab ═══════════════════════════════ -->
        <v-tabs-window-item value="import">
          <div class="pa-4 pa-md-6">
            <ImportTab />
          </div>
        </v-tabs-window-item>

        <!-- ══ Forms Tab ════════════════════════════════════════= -->
        <v-tabs-window-item value="forms">
          <div class="pa-4 pa-md-6">
            <FormsTab />
          </div>
        </v-tabs-window-item>

      </v-tabs-window>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const activeTab = ref('barcodes')
</script>
