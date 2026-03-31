<template>
  <div>

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div class="d-flex align-center gap-4">
        <v-avatar
          size="48"
          rounded="xl"
          style="background: linear-gradient(135deg,#10b981,#059669); box-shadow: 0 4px 20px #10b98150"
        >
          <v-icon icon="mdi-chart-bar" size="22" color="white" />
        </v-avatar>
        <div>
          <h1 class="text-h5 font-weight-black">Analytics</h1>
          <p class="text-body-2 text-medium-emphasis">Financial overview, P&L, and business performance</p>
        </div>
      </div>
      <div class="d-flex align-center gap-3 flex-wrap">
        <v-btn-toggle v-model="activeTab" mandatory rounded="pill" density="compact" color="success" divided>
          <v-btn v-for="t in tabs" :key="t.value" :value="t.value" size="small">{{ t.label }}</v-btn>
        </v-btn-toggle>
        <v-btn-toggle v-model="dateRange" mandatory rounded="pill" density="compact" color="success" divided>
          <v-btn v-for="r in dateRanges" :key="r.value" :value="r.value" size="small">{{ r.label }}</v-btn>
        </v-btn-toggle>
        <v-btn color="success" prepend-icon="mdi-download" @click="exportReport">Export</v-btn>
      </div>
    </div>

    <!-- ── OVERVIEW TAB ─────────────────────────────────────────── -->
    <template v-if="activeTab === 'overview'">

      <!-- P&L Hero -->
      <v-card
        class="pa-8 mb-5 hero-card overflow-hidden"
        :color="netProfit >= 0 ? 'success' : 'error'"
        variant="flat"
        style="background: linear-gradient(135deg,#10b981,#059669,#047857)"
      >
        <v-row align="center">
          <v-col>
            <div class="text-caption text-white font-weight-black text-uppercase mb-1" style="opacity:.75;letter-spacing:.1em">
              {{ netProfit >= 0 ? '🎉 Net Profit' : '📉 Net Loss' }} — {{ periodLabel }}
            </div>
            <div class="text-h3 font-weight-black text-white">{{ formatCurrency(Math.abs(netProfit)) }}</div>
            <div class="text-body-2 text-white mt-1" style="opacity:.7">
              Revenue {{ formatCurrency(totalRevenue) }} — Expenses {{ formatCurrency(totalExpenses) }}
            </div>
          </v-col>
          <v-col cols="auto" class="text-right">
            <div class="text-caption text-white font-weight-black text-uppercase" style="opacity:.7">Margin</div>
            <div class="text-h4 font-weight-black text-white">
              {{ totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0' }}%
            </div>
            <v-chip color="white" variant="tonal" size="small" class="mt-2">
              <v-icon :icon="netProfit >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" size="14" class="mr-1" />
              {{ ticketCount }} transactions
            </v-chip>
          </v-col>
        </v-row>
      </v-card>

      <!-- KPI Row -->
      <v-row dense class="mb-4">
        <v-col cols="6" sm="3">
          <v-card class="pa-5 kpi-card" style="background:#10b98114;outline:2px solid #10b98128;outline-offset:0">
            <div class="d-flex align-center justify-space-between mb-3">
              <v-avatar size="44" rounded="lg" style="background:#10b98124"><v-icon icon="mdi-currency-usd" size="20" color="#10b981" /></v-avatar>
              <v-chip size="x-small" color="success" variant="tonal">REVENUE</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">Total Revenue</div>
            <div class="text-h5 font-weight-black" style="color:#10b981">{{ formatCurrency(totalRevenue) }}</div>
            <div class="text-caption text-medium-emphasis" style="font-size:10px">{{ completedCount }} paid tickets</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card class="pa-5 kpi-card" style="background:#ef444414;outline:2px solid #ef444428;outline-offset:0">
            <div class="d-flex align-center justify-space-between mb-3">
              <v-avatar size="44" rounded="lg" style="background:#ef444424"><v-icon icon="mdi-trending-down" size="20" color="#ef4444" /></v-avatar>
              <v-chip size="x-small" color="error" variant="tonal">COSTS</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">Total Costs</div>
            <div class="text-h5 font-weight-black" style="color:#ef4444">{{ formatCurrency(totalExpenses) }}</div>
            <div class="text-caption text-medium-emphasis" style="font-size:10px">Parts + overhead</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card class="pa-5 kpi-card" style="background:#f59e0b14;outline:2px solid #f59e0b28;outline-offset:0">
            <div class="d-flex align-center justify-space-between mb-3">
              <v-avatar size="44" rounded="lg" style="background:#f59e0b24"><v-icon icon="mdi-receipt-text-outline" size="20" color="#f59e0b" /></v-avatar>
              <v-chip size="x-small" color="warning" variant="tonal">TAX</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">Tax Collected</div>
            <div class="text-h5 font-weight-black" style="color:#f59e0b">{{ formatCurrency(totalTax) }}</div>
            <div class="text-caption text-medium-emphasis" style="font-size:10px">{{ taxRate }}% rate applied</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card class="pa-5 kpi-card" style="background:#6366f114;outline:2px solid #6366f128;outline-offset:0">
            <div class="d-flex align-center justify-space-between mb-3">
              <v-avatar size="44" rounded="lg" style="background:#6366f124"><v-icon icon="mdi-target" size="20" color="#6366f1" /></v-avatar>
              <v-chip size="x-small" color="primary" variant="tonal">AVG</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">Avg Ticket Value</div>
            <div class="text-h5 font-weight-black" style="color:#6366f1">{{ formatCurrency(avgTicketValue) }}</div>
            <div class="text-caption text-medium-emphasis" style="font-size:10px">Per completed job</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Revenue + Cost Side-by-Side -->
      <v-row>
        <v-col cols="12" lg="8">
          <v-card class="pa-6">
            <div class="d-flex align-center gap-3 mb-5">
              <v-avatar size="36" rounded="lg" style="background:#10b98120"><v-icon icon="mdi-chart-bar" size="16" color="#10b981" /></v-avatar>
              <span class="text-subtitle-2 font-weight-black">Revenue Breakdown</span>
            </div>
            <div class="mb-6">
              <div v-for="source in revenueSources" :key="source.label" class="d-flex align-center gap-3 mb-3">
                <v-avatar size="36" rounded="lg" :style="`background:${source.color}20`">
                  <v-icon :icon="source.icon" size="16" :style="`color:${source.color}`" />
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="d-flex align-center justify-space-between mb-1">
                    <span class="text-caption font-weight-bold">{{ source.label }}</span>
                    <span class="text-caption font-weight-black" :style="`color:${source.color}`">{{ formatCurrency(source.value) }}</span>
                  </div>
                  <v-progress-linear
                    :model-value="source.pct"
                    :color="source.color"
                    rounded
                    height="10"
                    bg-color="rgba(0,0,0,0.06)"
                  />
                </div>
                <span class="text-caption text-medium-emphasis" style="min-width:32px;text-align:right">{{ source.pct.toFixed(0) }}%</span>
              </div>
            </div>
            <v-divider class="mb-4" />
            <div class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-4" style="letter-spacing:.1em">Monthly Revenue</div>
            <div class="d-flex align-end gap-1" style="height:96px">
              <div
                v-for="month in monthlyRevenue"
                :key="month.label"
                class="d-flex flex-column align-center gap-1 flex-grow-1"
              >
                <v-tooltip :text="formatCurrency(month.value)" location="top">
                  <template #activator="{ props }">
                    <div
                      v-bind="props"
                      class="w-100 rounded-t"
                      :style="`height:${month.pct}%;min-height:4px;background:linear-gradient(180deg,#10b981,#059669);cursor:pointer;transition:opacity .2s`"
                    />
                  </template>
                </v-tooltip>
                <span class="text-caption text-medium-emphasis" style="font-size:9px">{{ month.label }}</span>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card class="pa-6 mb-4">
            <div class="d-flex align-center gap-3 mb-4">
              <v-avatar size="36" rounded="lg" style="background:#ef444420"><v-icon icon="mdi-credit-card-outline" size="16" color="#ef4444" /></v-avatar>
              <span class="text-subtitle-2 font-weight-black">Cost Breakdown</span>
            </div>
            <v-list density="compact" class="pa-0">
              <v-list-item
                v-for="exp in expenseItems"
                :key="exp.label"
                rounded="lg"
                class="mb-1"
                :style="`background:rgba(0,0,0,0.03)`"
              >
                <template #prepend>
                  <v-avatar size="28" rounded="md" :style="`background:${exp.color}20`">
                    <v-icon :icon="exp.icon" size="14" :style="`color:${exp.color}`" />
                  </v-avatar>
                </template>
                <template #title><span class="text-caption font-weight-bold">{{ exp.label }}</span></template>
                <template #append>
                  <span class="text-caption font-weight-black" :style="`color:${exp.color}`">{{ formatCurrency(exp.value) }}</span>
                </template>
              </v-list-item>
            </v-list>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between">
              <span class="text-body-2 font-weight-black">Total Costs</span>
              <span class="text-body-2 font-weight-black" style="color:#ef4444">{{ formatCurrency(totalExpenses) }}</span>
            </div>
          </v-card>
          <v-card class="pa-5">
            <div class="d-flex align-center gap-3 mb-3">
              <v-avatar size="36" rounded="lg" style="background:#f59e0b20"><v-icon icon="mdi-receipt-text-outline" size="16" color="#f59e0b" /></v-avatar>
              <span class="text-subtitle-2 font-weight-black">Tax Summary</span>
            </div>
            <v-list density="compact" class="pa-0">
              <v-list-item class="px-0">
                <template #title><span class="text-caption text-medium-emphasis">Pre-tax Revenue</span></template>
                <template #append><span class="text-caption font-weight-bold">{{ formatCurrency(totalRevenue - totalTax) }}</span></template>
              </v-list-item>
              <v-list-item class="px-0">
                <template #title><span class="text-caption text-medium-emphasis">Tax Rate</span></template>
                <template #append><span class="text-caption font-weight-bold">{{ taxRate }}%</span></template>
              </v-list-item>
              <v-divider class="my-1" />
              <v-list-item class="px-0">
                <template #title><span class="text-caption font-weight-black">Tax Liability</span></template>
                <template #append><span class="text-caption font-weight-black" style="color:#f59e0b">{{ formatCurrency(totalTax) }}</span></template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- ── EXPENSE LOG TAB ──────────────────────────────────────── -->
    <template v-if="activeTab === 'expenses'">
      <v-card>
        <v-card-item class="border-b">
          <template #prepend>
            <v-avatar size="36" rounded="lg" style="background:#8b5cf620"><v-icon icon="mdi-clipboard-list-outline" size="16" color="#8b5cf6" /></v-avatar>
          </template>
          <v-card-title class="text-subtitle-2 font-weight-black">Expense Log</v-card-title>
          <template #append>
            <v-btn color="deep-purple" size="small" prepend-icon="mdi-plus" @click="addExpenseOpen = true">Log Expense</v-btn>
          </template>
        </v-card-item>
        <v-card-text class="pa-4">
          <div v-if="expenses.length === 0" class="py-12 d-flex flex-column align-center gap-3 text-medium-emphasis">
            <v-avatar size="64" rounded="xl" color="deep-purple" variant="tonal">
              <v-icon icon="mdi-clipboard-list-outline" size="32" style="opacity:.5" />
            </v-avatar>
            <div class="text-body-2 font-weight-bold">No expenses logged yet</div>
            <div class="text-caption">Track overhead, rent, utilities, and more</div>
          </div>
          <v-list v-else density="compact" class="pa-0">
            <v-list-item
              v-for="exp in expenses"
              :key="exp.id"
              rounded="xl"
              class="mb-1 px-4"
            >
              <template #prepend>
                <v-avatar size="40" rounded="lg" :style="`background:${expenseCategoryColor(exp.category)}18`">
                  <v-icon :icon="expenseCategoryIcon(exp.category)" size="20" :style="`color:${expenseCategoryColor(exp.category)}`" />
                </v-avatar>
              </template>
              <template #title><span class="text-body-2 font-weight-bold">{{ exp.description }}</span></template>
              <template #subtitle><span class="text-caption">{{ formatDate(exp.date) }}</span></template>
              <template #append>
                <span class="text-body-2 font-weight-black mr-3" style="color:#ef4444">{{ formatCurrency(exp.amount) }}</span>
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="deleteExpense(exp.id)" />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </template>

    <!-- ── PERFORMANCE TAB ──────────────────────────────────────── -->
    <template v-if="activeTab === 'performance'">
      <v-row dense class="mb-4">
        <v-col v-for="kpi in kpiCards" :key="kpi.label" cols="6" sm="3">
          <v-card class="pa-5 kpi-card" :style="`background:${kpi.color}12;outline:2px solid ${kpi.color}28;outline-offset:0`">
            <div class="d-flex align-start justify-space-between mb-3">
              <v-avatar size="44" rounded="lg" :style="`background:${kpi.color}24`">
                <v-icon :icon="kpi.icon" size="20" :style="`color:${kpi.color}`" />
              </v-avatar>
              <v-chip
                v-if="kpi.change"
                size="x-small"
                :color="kpi.changePositive ? 'success' : 'error'"
                variant="tonal"
              >{{ kpi.changePositive ? '↑' : '↓' }} {{ kpi.change }}</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">{{ kpi.label }}</div>
            <div class="text-h5 font-weight-black" :style="`color:${kpi.color}`">{{ kpi.value }}</div>
            <div v-if="kpi.sub" class="text-caption text-medium-emphasis" style="font-size:10px">{{ kpi.sub }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card class="pa-6">
            <div class="d-flex align-center gap-3 mb-5">
              <v-avatar size="36" rounded="lg" style="background:#f9731620"><v-icon icon="mdi-chart-pie" size="16" color="#f97316" /></v-avatar>
              <span class="text-subtitle-2 font-weight-black">Ticket Status Breakdown</span>
            </div>
            <div v-for="stat in statusBreakdown" :key="stat.status" class="d-flex align-center gap-3 mb-3">
              <div class="rounded-circle flex-shrink-0" :style="`width:12px;height:12px;background:${stat.color}`" />
              <div class="flex-grow-1">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-caption font-weight-bold">{{ stat.status }}</span>
                  <span class="text-caption font-weight-black" :style="`color:${stat.color}`">{{ stat.count }}</span>
                </div>
                <v-progress-linear :model-value="stat.pct" :color="stat.color" rounded height="8" bg-color="rgba(0,0,0,0.06)" />
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="pa-6">
            <div class="d-flex align-center gap-3 mb-5">
              <v-avatar size="36" rounded="lg" style="background:#3b82f620"><v-icon icon="mdi-account-group-outline" size="16" color="#3b82f6" /></v-avatar>
              <span class="text-subtitle-2 font-weight-black">Top Customers by Revenue</span>
            </div>
            <v-list density="compact" class="pa-0">
              <v-list-item
                v-for="(cust, i) in topCustomers"
                :key="cust.name"
                rounded="lg"
                class="mb-1"
                style="background:rgba(0,0,0,0.03)"
              >
                <template #prepend>
                  <v-avatar size="26" color="primary" variant="tonal" class="text-caption font-weight-black mr-2">{{ i + 1 }}</v-avatar>
                </template>
                <template #title><span class="text-caption font-weight-bold">{{ cust.name }}</span></template>
                <template #subtitle><span class="text-caption">{{ cust.count }} tickets</span></template>
                <template #append>
                  <span class="text-caption font-weight-black" style="color:#10b981">{{ formatCurrency(cust.revenue) }}</span>
                </template>
              </v-list-item>
              <v-list-item v-if="topCustomers.length === 0">
                <template #title><span class="text-caption text-medium-emphasis">No customer data yet</span></template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- ── SQUARE TAB ────────────────────────────────────────────── -->
    <template v-if="activeTab === 'square'">
      <v-card v-if="!square.isConfigured.value" class="pa-10 text-center">
        <v-avatar size="64" rounded="xl" color="primary" variant="tonal" class="mb-4 mx-auto">
          <v-icon icon="mdi-credit-card-outline" size="32" style="opacity:.5" />
        </v-avatar>
        <div class="text-body-2 font-weight-black mb-1">Square Not Connected</div>
        <div class="text-caption text-medium-emphasis">Add your Square Access Token and Location ID in Settings to import financial data.</div>
      </v-card>

      <template v-else>
        <div v-if="square.isLoading.value" class="d-flex align-center justify-center py-16 gap-3">
          <v-progress-circular indeterminate color="primary" size="32" />
          <span class="text-body-2 font-weight-bold text-medium-emphasis">Loading Square data…</span>
        </div>

        <template v-else>
          <v-row dense class="mb-4">
            <v-col cols="6" sm="4" lg="">
              <v-card class="pa-5 kpi-card" style="background:#10b98114;outline:2px solid #10b98128;outline-offset:0">
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-avatar size="44" rounded="lg" style="background:#10b98124"><v-icon icon="mdi-currency-usd" size="20" color="#10b981" /></v-avatar>
                  <v-chip size="x-small" color="success" variant="tonal">REVENUE</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">Square Revenue</div>
                <div class="text-h6 font-weight-black" style="color:#10b981">{{ formatCurrency(square.totalRevenue.value) }}</div>
                <div class="text-caption text-medium-emphasis" style="font-size:10px">{{ square.payments.value.length }} payments</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="4" lg="">
              <v-card class="pa-5 kpi-card" style="background:#ef444414;outline:2px solid #ef444428;outline-offset:0">
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-avatar size="44" rounded="lg" style="background:#ef444424"><v-icon icon="mdi-trending-down" size="20" color="#ef4444" /></v-avatar>
                  <v-chip size="x-small" color="error" variant="tonal">FEES</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">Processing Fees</div>
                <div class="text-h6 font-weight-black" style="color:#ef4444">{{ formatCurrency(square.totalFees.value) }}</div>
                <div class="text-caption text-medium-emphasis" style="font-size:10px">Deducted by Square</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="4" lg="">
              <v-card class="pa-5 kpi-card" style="background:#6366f114;outline:2px solid #6366f128;outline-offset:0">
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-avatar size="44" rounded="lg" style="background:#6366f124"><v-icon icon="mdi-target" size="20" color="#6366f1" /></v-avatar>
                  <v-chip size="x-small" color="primary" variant="tonal">NET</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">Net Revenue</div>
                <div class="text-h6 font-weight-black" style="color:#6366f1">{{ formatCurrency(square.netRevenue.value) }}</div>
                <div class="text-caption text-medium-emphasis" style="font-size:10px">After fees</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="4" lg="">
              <v-card class="pa-5 kpi-card" style="background:#f59e0b14;outline:2px solid #f59e0b28;outline-offset:0">
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-avatar size="44" rounded="lg" style="background:#f59e0b24"><v-icon icon="mdi-receipt-text-outline" size="20" color="#f59e0b" /></v-avatar>
                  <v-chip size="x-small" color="warning" variant="tonal">TIPS</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">Tips Received</div>
                <div class="text-h6 font-weight-black" style="color:#f59e0b">{{ formatCurrency(square.totalTips.value) }}</div>
                <div class="text-caption text-medium-emphasis" style="font-size:10px">From customers</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="4" lg="">
              <v-card class="pa-5 kpi-card" style="background:#06b6d414;outline:2px solid #06b6d428;outline-offset:0">
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-avatar size="44" rounded="lg" style="background:#06b6d424"><v-icon icon="mdi-truck-outline" size="20" color="#06b6d4" /></v-avatar>
                  <v-chip size="x-small" color="info" variant="tonal">DEPOSITS</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">Bank Deposits</div>
                <div class="text-h6 font-weight-black" style="color:#06b6d4">{{ formatCurrency(square.totalPayouts.value) }}</div>
                <div class="text-caption text-medium-emphasis" style="font-size:10px">{{ square.payouts.value.length }} payouts</div>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" lg="8">
              <v-card>
                <v-card-item class="border-b">
                  <template #prepend>
                    <v-avatar size="36" rounded="lg" style="background:#10b98120"><v-icon icon="mdi-currency-usd" size="16" color="#10b981" /></v-avatar>
                  </template>
                  <v-card-title class="text-subtitle-2 font-weight-black">Recent Payments</v-card-title>
                  <template #append>
                    <span class="text-caption text-medium-emphasis">{{ square.payments.value.length }} total</span>
                  </template>
                </v-card-item>
                <v-card-text class="pa-3" style="max-height:420px;overflow-y:auto">
                  <div v-if="square.payments.value.length === 0" class="py-12 text-center text-caption text-medium-emphasis">No payments found for this period</div>
                  <v-list density="compact" class="pa-0">
                    <v-list-item
                      v-for="p in square.payments.value"
                      :key="p.id"
                      rounded="lg"
                      class="mb-1"
                    >
                      <template #prepend>
                        <v-avatar size="36" rounded="lg" :style="`background:${p.status === 'COMPLETED' ? '#10b981' : '#f59e0b'}18`">
                          <v-icon icon="mdi-credit-card-outline" size="16" :style="`color:${p.status === 'COMPLETED' ? '#10b981' : '#f59e0b'}`" />
                        </v-avatar>
                      </template>
                      <template #title>
                        <span class="text-caption font-weight-bold">{{ p.cardBrand || 'Payment' }} {{ p.lastFour ? `••••${p.lastFour}` : '' }}</span>
                      </template>
                      <template #subtitle>
                        <span class="text-caption">{{ formatDate(p.createdAt) }}{{ p.note ? ` — ${p.note}` : '' }}</span>
                      </template>
                      <template #append>
                        <div class="text-right">
                          <div class="text-caption font-weight-black" style="color:#10b981">{{ formatCurrency(p.amount) }}</div>
                          <div v-if="p.tip > 0" class="text-caption font-weight-bold" style="color:#f59e0b">+{{ formatCurrency(p.tip) }} tip</div>
                        </div>
                        <v-btn v-if="p.receiptUrl" :href="p.receiptUrl" target="_blank" icon="mdi-download" size="x-small" variant="text" class="ml-1" />
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" lg="4">
              <v-card>
                <v-card-item class="border-b">
                  <template #prepend>
                    <v-avatar size="36" rounded="lg" style="background:#06b6d420"><v-icon icon="mdi-truck-outline" size="16" color="#06b6d4" /></v-avatar>
                  </template>
                  <v-card-title class="text-subtitle-2 font-weight-black">Bank Deposits</v-card-title>
                </v-card-item>
                <v-card-text class="pa-3" style="max-height:420px;overflow-y:auto">
                  <div v-if="square.payouts.value.length === 0" class="py-12 text-center text-caption text-medium-emphasis">No payouts found</div>
                  <v-list density="compact" class="pa-0">
                    <v-list-item
                      v-for="p in square.payouts.value"
                      :key="p.id"
                      rounded="lg"
                      class="mb-1"
                    >
                      <template #prepend>
                        <v-avatar size="36" rounded="lg" :style="`background:${p.status === 'PAID' ? '#06b6d4' : '#f59e0b'}18`">
                          <v-icon icon="mdi-truck-outline" size="16" :style="`color:${p.status === 'PAID' ? '#06b6d4' : '#f59e0b'}`" />
                        </v-avatar>
                      </template>
                      <template #title><span class="text-caption font-weight-bold">{{ p.status === 'PAID' ? 'Deposited' : p.status }}</span></template>
                      <template #subtitle><span class="text-caption">{{ p.arrivalDate || formatDate(p.createdAt) }}</span></template>
                      <template #append>
                        <span class="text-caption font-weight-black" style="color:#06b6d4">{{ formatCurrency(p.amount) }}</span>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-card class="mt-4">
            <v-card-item class="border-b">
              <template #prepend>
                <v-avatar size="36" rounded="lg" style="background:#8b5cf620"><v-icon icon="mdi-account-group-outline" size="16" color="#8b5cf6" /></v-avatar>
              </template>
              <v-card-title class="text-subtitle-2 font-weight-black">Square Customers</v-card-title>
              <template #append>
                <span class="text-caption text-medium-emphasis">{{ square.sqCustomers.value.length }} total</span>
              </template>
            </v-card-item>
            <v-card-text class="pa-3" style="max-height:320px;overflow-y:auto">
              <div v-if="square.sqCustomers.value.length === 0" class="py-10 text-center text-caption text-medium-emphasis">No customers found in Square</div>
              <v-row dense>
                <v-col v-for="c in square.sqCustomers.value" :key="c.id" cols="12" sm="6" lg="4">
                  <v-list-item rounded="lg" style="background:rgba(0,0,0,0.03)">
                    <template #prepend>
                      <v-avatar size="32" color="deep-purple" variant="tonal" class="text-caption font-weight-black">
                        {{ c.name?.charAt(0) || '?' }}
                      </v-avatar>
                    </template>
                    <template #title><span class="text-caption font-weight-bold">{{ c.name }}</span></template>
                    <template #subtitle><span class="text-caption">{{ c.email || c.phone || 'No contact' }}</span></template>
                  </v-list-item>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </template>
      </template>
    </template>

    <!-- ── Add Expense Dialog ─────────────────────────────────── -->
    <v-dialog v-model="addExpenseOpen" max-width="480">
      <v-card>
        <v-card-item class="border-b">
          <template #prepend>
            <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)">
              <v-icon icon="mdi-plus" size="18" color="white" />
            </v-avatar>
          </template>
          <v-card-title>Log Expense</v-card-title>
          <v-card-subtitle>Track overhead and business costs</v-card-subtitle>
          <template #append>
            <v-btn icon="mdi-close" variant="text" size="small" @click="addExpenseOpen = false" />
          </template>
        </v-card-item>
        <v-card-text class="pa-6">
          <v-text-field
            v-model="expenseForm.description"
            label="Description"
            placeholder="Monthly rent, supplies, utilities…"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-row dense class="mb-3">
            <v-col cols="6">
              <v-text-field
                v-model.number="expenseForm.amount"
                type="number"
                label="Amount"
                placeholder="0.00"
                variant="outlined"
                density="comfortable"
                prefix="$"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="expenseForm.date"
                type="date"
                label="Date"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
          <div class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2" style="letter-spacing:.1em">Category</div>
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="cat in expenseCategories"
              :key="cat.label"
              :color="expenseForm.category === cat.label ? cat.vuetifyColor : undefined"
              :variant="expenseForm.category === cat.label ? 'tonal' : 'outlined'"
              size="small"
              clickable
              @click="expenseForm.category = cat.label"
            >{{ cat.label }}</v-chip>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="addExpenseOpen = false">Cancel</v-btn>
          <v-btn color="deep-purple" @click="logExpense">Log Expense</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const tickets   = computed(() => appStore.tickets ?? [])
const customers = computed(() => appStore.customers ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$', taxRate: 0 })
const expenses  = computed(() => appStore.expenses ?? [])

const activeTab = ref('overview')
const tabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Expenses', value: 'expenses' },
  { label: 'Performance', value: 'performance' },
  { label: 'Square', value: 'square' },
]

// ── Square data ─────────────────────────────────────────────────────
const dateRange = ref('30')
const dateRanges = [
  { label: '7d', value: '7' },
  { label: '30d', value: '30' },
  { label: '3mo', value: '90' },
  { label: 'Year', value: '365' },
]

const square = useSquareData()
const squareFetched = ref(false)
watch(activeTab, (tab) => {
  if (tab === 'square' && !squareFetched.value && square.isConfigured.value) {
    squareFetched.value = true
    square.fetchAll(parseInt(dateRange.value))
  }
})
watch(dateRange, () => {
  if (activeTab.value === 'square' && square.isConfigured.value) {
    square.fetchAll(parseInt(dateRange.value))
  }
})

const periodLabel = computed(() => ({
  '7': 'Last 7 Days', '30': 'Last 30 Days', '90': 'Last 3 Months', '365': 'Last Year'
}[dateRange.value] || 'Period'))

const cutoffDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - parseInt(dateRange.value))
  return d
})

const filteredTickets = computed(() =>
  tickets.value.filter(t => t.createdAt && new Date(t.createdAt) >= cutoffDate.value)
)

const taxRate = computed(() => parseFloat(settings.value?.taxRate as any) || 0)
const totalRevenue = computed(() => filteredTickets.value.filter(t => t.price > 0).reduce((a, t) => a + (t.price || 0), 0))
const totalTax = computed(() => totalRevenue.value * (taxRate.value / 100))
const partsCost = computed(() => filteredTickets.value.reduce((a, t) => {
  const parts = (t.parts || []) as any[]
  return a + parts.reduce((pa: number, p: any) => pa + ((p.cost || 0) * (p.quantity || 1)), 0)
}, 0))
const totalExpenses = computed(() => partsCost.value + expenses.value.reduce((a, e) => a + e.amount, 0))
const netProfit = computed(() => totalRevenue.value - totalExpenses.value)
const completedCount = computed(() => filteredTickets.value.filter(t => t.status === 'Completed' || t.status === 'Delivered').length)
const ticketCount = computed(() => filteredTickets.value.length)
const avgTicketValue = computed(() => {
  const done = filteredTickets.value.filter(t => t.price > 0)
  return done.length ? done.reduce((a, t) => a + t.price, 0) / done.length : 0
})

const repairRevenue = computed(() => filteredTickets.value.filter(t => !t.posOrder).reduce((a, t) => a + (t.price || 0), 0))
const posRevenue = computed(() => filteredTickets.value.filter(t => t.posOrder).reduce((a, t) => a + (t.price || 0), 0))

const revenueSources = computed(() => {
  const max = Math.max(totalRevenue.value, 1)
  return [
    { label: 'Repair Tickets', value: repairRevenue.value, pct: (repairRevenue.value / max) * 100, color: '#6366f1', colorDark: '#4f46e5', icon: 'mdi-wrench-outline' },
    { label: 'POS / Retail', value: posRevenue.value, pct: (posRevenue.value / max) * 100, color: '#ec4899', colorDark: '#db2777', icon: 'mdi-cart-outline' },
    { label: 'Parts & Addons', value: partsCost.value, pct: (partsCost.value / max) * 100, color: '#f97316', colorDark: '#ea580c', icon: 'mdi-package-variant-closed' },
  ].filter(s => s.value > 0)
})

const expenseItems = computed(() => [
  { label: 'Parts Cost', value: partsCost.value, color: '#ef4444', icon: 'mdi-package-variant-closed' },
  { label: 'Overhead', value: expenses.value.filter(e => e.category === 'Overhead').reduce((a, e) => a + e.amount, 0), color: '#f97316', icon: Home },
  { label: 'Utilities', value: expenses.value.filter(e => e.category === 'Utilities').reduce((a, e) => a + e.amount, 0), color: '#f59e0b', icon: 'mdi-flash-outline' },
  { label: 'Software', value: expenses.value.filter(e => e.category === 'Software').reduce((a, e) => a + e.amount, 0), color: '#8b5cf6', icon: 'mdi-wifi' },
  { label: 'Other', value: expenses.value.filter(e => !['Overhead','Utilities','Software'].includes(e.category)).reduce((a, e) => a + e.amount, 0), color: '#64748b', icon: 'mdi-clipboard-list-outline' },
].filter(e => e.value > 0))

const monthlyRevenue = computed(() => {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months[d.toLocaleDateString([], { month: 'short' })] = 0
  }
  tickets.value.forEach(t => {
    if (!t.createdAt) return
    const key = new Date(t.createdAt).toLocaleDateString([], { month: 'short' })
    if (key in months) months[key] += (t.price || 0)
  })
  const max = Math.max(...Object.values(months), 1)
  return Object.entries(months).map(([label, value]) => ({ label, value, pct: Math.max((value / max) * 100, 3) }))
})

// Performance tab
const statusColors: Record<string, string> = {
  'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316',
  'Completed': '#10b981', 'Delivered': '#64748b'
}
const statusBreakdown = computed(() => {
  const total = Math.max(tickets.value.length, 1)
  const counts: Record<string, number> = {}
  tickets.value.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1 })
  return Object.entries(counts).map(([status, count]) => ({
    status, count, pct: (count / total) * 100, color: statusColors[status] || '#64748b'
  })).sort((a, b) => b.count - a.count)
})

const topCustomers = computed(() => {
  const map: Record<string, { name: string; revenue: number; count: number }> = {}
  tickets.value.forEach(t => {
    const c = customers.value.find(c => c.id === t.customerId)
    if (!c) return
    if (!map[c.id]) map[c.id] = { name: c.name, revenue: 0, count: 0 }
    map[c.id].revenue += (t.price || 0)
    map[c.id].count++
  })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6)
})

const kpiCards = computed(() => [
  { label: 'Total Revenue', value: formatCurrency(totalRevenue.value), color: '#10b981', icon: 'mdi-currency-usd', change: null, changePositive: true, sub: `${periodLabel.value}` },
  { label: 'Active Tickets', value: tickets.value.filter(t => t.status !== 'Closed' && t.status !== 'Delivered').length, color: '#3b82f6', icon: 'mdi-wrench-outline', change: null, changePositive: true, sub: 'In-progress repairs' },
  { label: 'Total Customers', value: customers.value.length, color: '#8b5cf6', icon: 'mdi-account-group-outline', change: null, changePositive: true, sub: 'All time' },
  { label: 'Avg Ticket Value', value: formatCurrency(avgTicketValue.value), color: '#f97316', icon: 'mdi-target', change: null, changePositive: true, sub: 'Per completed job' },
])

const { toast } = useToast()

const addExpenseOpen = ref(false)
const expenseForm = ref({ description: '', amount: 0, category: 'Overhead', date: new Date().toISOString().split('T')[0] })
const expenseCategories = [
  { label: 'Overhead', color: '#f97316', vuetifyColor: 'orange' },
  { label: 'Utilities', color: '#f59e0b', vuetifyColor: 'warning' },
  { label: 'Software', color: '#8b5cf6', vuetifyColor: 'deep-purple' },
  { label: 'Supplies', color: '#10b981', vuetifyColor: 'success' },
  { label: 'Payroll', color: '#3b82f6', vuetifyColor: 'primary' },
  { label: 'Other', color: '#64748b', vuetifyColor: 'secondary' },
]
const expenseCategoryColor = (cat: string) => expenseCategories.find(c => c.label === cat)?.color || '#64748b'
const expenseCategoryIcon = (cat: string) => {
  const map: Record<string, any> = { Overhead: Home, Utilities: 'mdi-flash-outline', Software: 'mdi-wifi', Supplies: 'mdi-package-variant-closed', Payroll: 'mdi-account-group-outline', Other: 'mdi-clipboard-list-outline' }
  return map[cat] || ClipboardList
}
const logExpense = async () => {
  if (!expenseForm.value.description || !expenseForm.value.amount) return
  appStore.expenses.push({ ...expenseForm.value, id: Date.now() })
  await appStore.saveAll()
  addExpenseOpen.value = false
  expenseForm.value = { description: '', amount: 0, category: 'Overhead', date: new Date().toISOString().split('T')[0] }
  toast.success('Expense Logged', 'Expense has been added')
}
const deleteExpense = async (id: number) => {
  appStore.expenses = appStore.expenses.filter((e: any) => e.id !== id)
  await appStore.saveAll()
  toast.success('Deleted', 'Expense removed')
}

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const exportReport = () => {
  const rows = [
    ['NovaOps Analytics Report', '', '', ''],
    ['Period', periodLabel.value, '', ''],
    ['', '', '', ''],
    ['Total Revenue', formatCurrency(totalRevenue.value), '', ''],
    ['Tax Collected', formatCurrency(totalTax.value), '', ''],
    ['Total Costs', formatCurrency(totalExpenses.value), '', ''],
    ['Net Profit', formatCurrency(netProfit.value), '', ''],
    ['', '', '', ''],
    ['EXPENSES', '', '', ''],
    ...expenses.value.map(e => [e.description, formatCurrency(e.amount), e.category, formatDate(e.date)]),
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `novaops-analytics-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.hero-card { transition: transform 0.4s cubic-bezier(0.34,1.2,0.64,1); }
.hero-card:hover { transform: scale(1.005); }

.kpi-card { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.kpi-card:hover  { transform: scale(1.04) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
.kpi-card:active { transform: scale(0.96); }
</style>
