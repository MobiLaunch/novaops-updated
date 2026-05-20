<template>
  <div class="page-shell page-shell--wide">

    <header class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
          style="background: linear-gradient(135deg,#10b981,#059669); box-shadow: 0 4px 20px #10b98150"
        >
          <i class="mdi mdi-chart-bar text-xl"></i>
        </div>
        <div>
          <h1 class="text-xl font-black m-0">Analytics</h1>
          <p class="text-sm text-muted-foreground m-0">Financial overview, P&L, and business performance</p>
        </div>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <SelectButton
          v-model="activeTab"
          :options="tabs"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
        <SelectButton
          v-model="dateRange"
          :options="dateRanges"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
        <Button label="Export" severity="success" class="font-bold text-none" @click="exportReport">
          <i class="mdi mdi-download mr-1"></i>
        </Button>
      </div>
    </header>

    <!-- ── OVERVIEW TAB ─────────────────────────────────────────── -->
    <template v-if="activeTab === 'overview'">

      <div
        class="rounded-xl p-8 mb-5 hero-card overflow-hidden text-white"
        :style="netProfit >= 0
          ? 'background: linear-gradient(135deg,#10b981,#059669,#047857)'
          : 'background: linear-gradient(135deg,#ef4444,#dc2626,#b91c1c)'"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <div class="text-xs font-black uppercase mb-1 opacity-75 tracking-widest">
              {{ netProfit >= 0 ? '🎉 Net Profit' : '📉 Net Loss' }} — {{ periodLabel }}
            </div>
            <div class="text-3xl font-black">{{ formatCurrency(Math.abs(netProfit)) }}</div>
            <div class="text-sm mt-1 opacity-70">
              Revenue {{ formatCurrency(totalRevenue) }} — Expenses {{ formatCurrency(totalExpenses) }}
            </div>
          </div>
          <div class="md:text-right">
            <div class="text-xs font-black uppercase opacity-70">Margin</div>
            <div class="text-3xl font-black">
              {{ totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0' }}%
            </div>
            <Tag class="mt-2" severity="secondary">
              <i class="mdi mr-1" :class="netProfit >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"></i>
              {{ ticketCount }} transactions
            </Tag>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="kpi-card rounded-xl p-5" style="background:#10b98114;outline:2px solid #10b98128;outline-offset:0">
          <div class="flex items-center justify-between mb-3">
            <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:#10b98124;color:#10b981"><i class="mdi mdi-currency-usd text-xl"></i></div>
            <Tag value="REVENUE" severity="success" class="text-[9px]" />
          </div>
          <div class="text-xs text-muted-foreground">Total Revenue</div>
          <div class="text-2xl font-black" style="color:#10b981">{{ formatCurrency(totalRevenue) }}</div>
          <div class="text-[10px] text-muted-foreground">{{ completedCount }} paid tickets</div>
        </div>
        <div class="kpi-card rounded-xl p-5" style="background:#ef444414;outline:2px solid #ef444428;outline-offset:0">
          <div class="flex items-center justify-between mb-3">
            <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:#ef444424;color:#ef4444"><i class="mdi mdi-trending-down text-xl"></i></div>
            <Tag value="COSTS" severity="danger" class="text-[9px]" />
          </div>
          <div class="text-xs text-muted-foreground">Total Costs</div>
          <div class="text-2xl font-black" style="color:#ef4444">{{ formatCurrency(totalExpenses) }}</div>
          <div class="text-[10px] text-muted-foreground">Parts + overhead</div>
        </div>
        <div class="kpi-card rounded-xl p-5" style="background:#f59e0b14;outline:2px solid #f59e0b28;outline-offset:0">
          <div class="flex items-center justify-between mb-3">
            <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:#f59e0b24;color:#f59e0b"><i class="mdi mdi-receipt-text-outline text-xl"></i></div>
            <Tag value="TAX" severity="warn" class="text-[9px]" />
          </div>
          <div class="text-xs text-muted-foreground">Tax Collected</div>
          <div class="text-2xl font-black" style="color:#f59e0b">{{ formatCurrency(totalTax) }}</div>
          <div class="text-[10px] text-muted-foreground">{{ taxRate }}% rate applied</div>
        </div>
        <div class="kpi-card rounded-xl p-5" style="background:#6366f114;outline:2px solid #6366f128;outline-offset:0">
          <div class="flex items-center justify-between mb-3">
            <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:#6366f124;color:#6366f1"><i class="mdi mdi-target text-xl"></i></div>
            <Tag value="AVG" severity="info" class="text-[9px]" />
          </div>
          <div class="text-xs text-muted-foreground">Avg Ticket Value</div>
          <div class="text-2xl font-black" style="color:#6366f1">{{ formatCurrency(avgTicketValue) }}</div>
          <div class="text-[10px] text-muted-foreground">Per completed job</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div class="lg:col-span-8 bg-surface border border-border rounded-xl p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:#10b98120;color:#10b981"><i class="mdi mdi-chart-bar"></i></div>
            <span class="text-sm font-black">Revenue Breakdown</span>
          </div>
          <div class="mb-6">
            <div v-for="source in revenueSources" :key="source.label" class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :style="`background:${source.color}20;color:${source.color}`">
                <i class="mdi text-lg" :class="source.icon"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold">{{ source.label }}</span>
                  <span class="text-xs font-black" :style="`color:${source.color}`">{{ formatCurrency(source.value) }}</span>
                </div>
                <div class="h-2.5 rounded-full overflow-hidden" style="background:rgba(0,0,0,0.06)">
                  <div class="h-full rounded-full transition-all" :style="{ width: source.pct + '%', backgroundColor: source.color }"></div>
                </div>
              </div>
              <span class="text-xs text-muted-foreground shrink-0" style="min-width:32px;text-align:right">{{ source.pct.toFixed(0) }}%</span>
            </div>
          </div>
          <hr class="border-border mb-4" />
          <div class="text-xs font-black text-muted-foreground uppercase mb-4 tracking-widest">Monthly Revenue</div>
          <div class="flex items-end gap-1" style="height:96px">
            <div
              v-for="month in monthlyRevenue"
              :key="month.label"
              class="flex flex-col items-center gap-1 flex-1 min-w-0"
            >
              <div
                :title="formatCurrency(month.value)"
                class="w-full rounded-t"
                :style="`height:${month.pct}%;min-height:4px;background:linear-gradient(180deg,#10b981,#059669);cursor:pointer;transition:opacity .2s`"
              />
              <span class="text-[9px] text-muted-foreground">{{ month.label }}</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-4 flex flex-col gap-4">
          <div class="bg-surface border border-border rounded-xl p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:#ef444420;color:#ef4444"><i class="mdi mdi-credit-card-outline"></i></div>
              <span class="text-sm font-black">Cost Breakdown</span>
            </div>
            <div class="flex flex-col gap-1">
              <div
                v-for="exp in expenseItems"
                :key="exp.label"
                class="flex items-center gap-3 p-2 rounded-lg"
                style="background:rgba(0,0,0,0.03)"
              >
                <div class="w-7 h-7 rounded-md flex items-center justify-center shrink-0" :style="`background:${exp.color}20;color:${exp.color}`">
                  <i class="mdi text-base" :class="exp.icon"></i>
                </div>
                <span class="text-xs font-bold flex-1">{{ exp.label }}</span>
                <span class="text-xs font-black" :style="`color:${exp.color}`">{{ formatCurrency(exp.value) }}</span>
              </div>
            </div>
            <hr class="border-border my-3" />
            <div class="flex justify-between">
              <span class="text-sm font-black">Total Costs</span>
              <span class="text-sm font-black" style="color:#ef4444">{{ formatCurrency(totalExpenses) }}</span>
            </div>
          </div>

          <div class="bg-surface border border-border rounded-xl p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:#f59e0b20;color:#f59e0b"><i class="mdi mdi-receipt-text-outline"></i></div>
              <span class="text-sm font-black">Tax Summary</span>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-muted-foreground">Pre-tax Revenue</span>
                <span class="text-xs font-bold">{{ formatCurrency(totalRevenue - totalTax) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-muted-foreground">Tax Rate</span>
                <span class="text-xs font-bold">{{ taxRate }}%</span>
              </div>
              <hr class="border-border my-1" />
              <div class="flex justify-between items-center">
                <span class="text-xs font-black">Tax Liability</span>
                <span class="text-xs font-black" style="color:#f59e0b">{{ formatCurrency(totalTax) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── EXPENSE LOG TAB ──────────────────────────────────────── -->
    <template v-if="activeTab === 'expenses'">
      <div class="bg-surface border border-border rounded-xl overflow-hidden">
        <div class="flex items-center justify-between gap-3 p-4 border-b border-border flex-wrap">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:#8b5cf620;color:#8b5cf6"><i class="mdi mdi-clipboard-list-outline"></i></div>
            <span class="text-sm font-black">Expense Log</span>
          </div>
          <Button label="Log Expense" size="small" class="text-none font-bold" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:none;color:white" @click="addExpenseOpen = true">
            <i class="mdi mdi-plus mr-1"></i>
          </Button>
        </div>
        <div class="p-4">
          <div v-if="expenses.length === 0" class="py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <div class="w-16 h-16 rounded-xl flex items-center justify-center" style="background:#8b5cf620;color:#8b5cf6">
              <i class="mdi mdi-clipboard-list-outline text-3xl"></i>
            </div>
            <div class="text-sm font-bold">No expenses logged yet</div>
            <div class="text-xs">Track overhead, rent, utilities, and more</div>
          </div>
          <div v-else class="flex flex-col gap-1">
            <div
              v-for="exp in expenses"
              :key="exp.id"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50"
            >
              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" :style="`background:${expenseCategoryColor(exp.category)}18;color:${expenseCategoryColor(exp.category)}`">
                <i class="mdi" :class="expenseCategoryIcon(exp.category)"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold truncate">{{ exp.description }}</div>
                <div class="text-xs text-muted-foreground">{{ formatDate(exp.date) }}</div>
              </div>
              <span class="text-sm font-black shrink-0" style="color:#ef4444">{{ formatCurrency(exp.amount) }}</span>
              <Button variant="text" size="small" severity="danger" class="!w-8 !h-8 shrink-0" @click="deleteExpense(exp.id)">
                <i class="mdi mdi-delete-outline text-sm"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── PERFORMANCE TAB ──────────────────────────────────────── -->
    <template v-if="activeTab === 'performance'">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div
          v-for="kpi in kpiCards"
          :key="kpi.label"
          class="kpi-card rounded-xl p-5"
          :style="`background:${kpi.color}12;outline:2px solid ${kpi.color}28;outline-offset:0`"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="w-11 h-11 rounded-lg flex items-center justify-center" :style="`background:${kpi.color}24;color:${kpi.color}`">
              <i class="mdi text-lg" :class="kpi.icon"></i>
            </div>
            <Tag
              v-if="kpi.change"
              :value="`${kpi.changePositive ? '↑' : '↓'} ${kpi.change}`"
              :severity="kpi.changePositive ? 'success' : 'danger'"
              class="text-[9px]"
            />
          </div>
          <div class="text-xs text-muted-foreground">{{ kpi.label }}</div>
          <div class="text-2xl font-black" :style="`color:${kpi.color}`">{{ kpi.value }}</div>
          <div v-if="kpi.sub" class="text-[10px] text-muted-foreground">{{ kpi.sub }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-surface border border-border rounded-xl p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:#f9731620;color:#f97316"><i class="mdi mdi-chart-pie"></i></div>
            <span class="text-sm font-black">Ticket Status Breakdown</span>
          </div>
          <div v-for="stat in statusBreakdown" :key="stat.status" class="flex items-center gap-3 mb-3">
            <div class="rounded-full shrink-0" :style="`width:12px;height:12px;background:${stat.color}`" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold">{{ stat.status }}</span>
                <span class="text-xs font-black" :style="`color:${stat.color}`">{{ stat.count }}</span>
              </div>
              <div class="h-2 rounded-full overflow-hidden" style="background:rgba(0,0,0,0.06)">
                <div class="h-full rounded-full" :style="{ width: stat.pct + '%', backgroundColor: stat.color }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-surface border border-border rounded-xl p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:#3b82f620;color:#3b82f6"><i class="mdi mdi-account-group-outline"></i></div>
            <span class="text-sm font-black">Top Customers by Revenue</span>
          </div>
          <div class="flex flex-col gap-1">
            <div
              v-for="(cust, i) in topCustomers"
              :key="cust.name"
              class="flex items-center gap-3 p-2 rounded-lg"
              style="background:rgba(0,0,0,0.03)"
            >
              <div class="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-black shrink-0">{{ i + 1 }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-bold truncate">{{ cust.name }}</div>
                <div class="text-xs text-muted-foreground">{{ cust.count }} tickets</div>
              </div>
              <span class="text-xs font-black shrink-0" style="color:#10b981">{{ formatCurrency(cust.revenue) }}</span>
            </div>
            <div v-if="topCustomers.length === 0" class="p-2 text-xs text-muted-foreground">No customer data yet</div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── SQUARE TAB ────────────────────────────────────────────── -->
    <template v-if="activeTab === 'square'">
      <div v-if="!square.isConfigured.value" class="bg-surface border border-border rounded-xl p-10 text-center">
        <div class="w-16 h-16 rounded-xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
          <i class="mdi mdi-credit-card-outline text-3xl"></i>
        </div>
        <div class="text-sm font-black mb-1">Square Not Connected</div>
        <div class="text-xs text-muted-foreground">Add your Square Access Token and Location ID in Settings to import financial data.</div>
      </div>

      <template v-else>
        <div v-if="square.isLoading.value" class="flex items-center justify-center py-16 gap-3">
          <ProgressSpinner style="width: 32px; height: 32px" stroke-width="4" />
          <span class="text-sm font-bold text-muted-foreground">Loading Square data…</span>
        </div>

        <template v-else>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            <div class="kpi-card rounded-xl p-5" style="background:#10b98114;outline:2px solid #10b98128;outline-offset:0">
              <div class="flex items-center justify-between mb-3">
                <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:#10b98124;color:#10b981"><i class="mdi mdi-currency-usd text-xl"></i></div>
                <Tag value="REVENUE" severity="success" class="text-[9px]" />
              </div>
              <div class="text-xs text-muted-foreground">Square Revenue</div>
              <div class="text-xl font-black" style="color:#10b981">{{ formatCurrency(square.totalRevenue.value) }}</div>
              <div class="text-[10px] text-muted-foreground">{{ square.payments.value.length }} payments</div>
            </div>
            <div class="kpi-card rounded-xl p-5" style="background:#ef444414;outline:2px solid #ef444428;outline-offset:0">
              <div class="flex items-center justify-between mb-3">
                <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:#ef444424;color:#ef4444"><i class="mdi mdi-trending-down text-xl"></i></div>
                <Tag value="FEES" severity="danger" class="text-[9px]" />
              </div>
              <div class="text-xs text-muted-foreground">Processing Fees</div>
              <div class="text-xl font-black" style="color:#ef4444">{{ formatCurrency(square.totalFees.value) }}</div>
              <div class="text-[10px] text-muted-foreground">Deducted by Square</div>
            </div>
            <div class="kpi-card rounded-xl p-5" style="background:#6366f114;outline:2px solid #6366f128;outline-offset:0">
              <div class="flex items-center justify-between mb-3">
                <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:#6366f124;color:#6366f1"><i class="mdi mdi-target text-xl"></i></div>
                <Tag value="NET" severity="info" class="text-[9px]" />
              </div>
              <div class="text-xs text-muted-foreground">Net Revenue</div>
              <div class="text-xl font-black" style="color:#6366f1">{{ formatCurrency(square.netRevenue.value) }}</div>
              <div class="text-[10px] text-muted-foreground">After fees</div>
            </div>
            <div class="kpi-card rounded-xl p-5" style="background:#f59e0b14;outline:2px solid #f59e0b28;outline-offset:0">
              <div class="flex items-center justify-between mb-3">
                <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:#f59e0b24;color:#f59e0b"><i class="mdi mdi-receipt-text-outline text-xl"></i></div>
                <Tag value="TIPS" severity="warn" class="text-[9px]" />
              </div>
              <div class="text-xs text-muted-foreground">Tips Received</div>
              <div class="text-xl font-black" style="color:#f59e0b">{{ formatCurrency(square.totalTips.value) }}</div>
              <div class="text-[10px] text-muted-foreground">From customers</div>
            </div>
            <div class="kpi-card rounded-xl p-5" style="background:#06b6d414;outline:2px solid #06b6d428;outline-offset:0">
              <div class="flex items-center justify-between mb-3">
                <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:#06b6d424;color:#06b6d4"><i class="mdi mdi-truck-outline text-xl"></i></div>
                <Tag value="DEPOSITS" severity="info" class="text-[9px]" />
              </div>
              <div class="text-xs text-muted-foreground">Bank Deposits</div>
              <div class="text-xl font-black" style="color:#06b6d4">{{ formatCurrency(square.totalPayouts.value) }}</div>
              <div class="text-[10px] text-muted-foreground">{{ square.payouts.value.length }} payouts</div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div class="lg:col-span-8 bg-surface border border-border rounded-xl overflow-hidden">
              <div class="flex items-center justify-between gap-3 p-4 border-b border-border">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:#10b98120;color:#10b981"><i class="mdi mdi-currency-usd"></i></div>
                  <span class="text-sm font-black">Recent Payments</span>
                </div>
                <span class="text-xs text-muted-foreground">{{ square.payments.value.length }} total</span>
              </div>
              <div class="p-3 overflow-y-auto" style="max-height:420px">
                <div v-if="square.payments.value.length === 0" class="py-12 text-center text-xs text-muted-foreground">No payments found for this period</div>
                <div v-else class="flex flex-col gap-1">
                  <div
                    v-for="p in square.payments.value"
                    :key="p.id"
                    class="flex items-center gap-3 p-2 rounded-lg"
                  >
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :style="`background:${p.status === 'COMPLETED' ? '#10b981' : '#f59e0b'}18;color:${p.status === 'COMPLETED' ? '#10b981' : '#f59e0b'}`">
                      <i class="mdi mdi-credit-card-outline"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-bold truncate">{{ p.cardBrand || 'Payment' }} {{ p.lastFour ? `••••${p.lastFour}` : '' }}</div>
                      <div class="text-xs text-muted-foreground truncate">{{ formatDate(p.createdAt) }}{{ p.note ? ` — ${p.note}` : '' }}</div>
                    </div>
                    <div class="text-right shrink-0">
                      <div class="text-xs font-black" style="color:#10b981">{{ formatCurrency(p.amount) }}</div>
                      <div v-if="p.tip > 0" class="text-xs font-bold" style="color:#f59e0b">+{{ formatCurrency(p.tip) }} tip</div>
                    </div>
                    <a
                      v-if="p.receiptUrl"
                      :href="p.receiptUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted"
                    >
                      <i class="mdi mdi-download text-sm"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-4 bg-surface border border-border rounded-xl overflow-hidden">
              <div class="flex items-center gap-3 p-4 border-b border-border">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:#06b6d420;color:#06b6d4"><i class="mdi mdi-truck-outline"></i></div>
                <span class="text-sm font-black">Bank Deposits</span>
              </div>
              <div class="p-3 overflow-y-auto" style="max-height:420px">
                <div v-if="square.payouts.value.length === 0" class="py-12 text-center text-xs text-muted-foreground">No payouts found</div>
                <div v-else class="flex flex-col gap-1">
                  <div
                    v-for="p in square.payouts.value"
                    :key="p.id"
                    class="flex items-center gap-3 p-2 rounded-lg"
                  >
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :style="`background:${p.status === 'PAID' ? '#06b6d4' : '#f59e0b'}18;color:${p.status === 'PAID' ? '#06b6d4' : '#f59e0b'}`">
                      <i class="mdi mdi-truck-outline"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-bold">{{ p.status === 'PAID' ? 'Deposited' : p.status }}</div>
                      <div class="text-xs text-muted-foreground">{{ p.arrivalDate || formatDate(p.createdAt) }}</div>
                    </div>
                    <span class="text-xs font-black shrink-0" style="color:#06b6d4">{{ formatCurrency(p.amount) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-surface border border-border rounded-xl overflow-hidden mt-4">
            <div class="flex items-center justify-between gap-3 p-4 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:#8b5cf620;color:#8b5cf6"><i class="mdi mdi-account-group-outline"></i></div>
                <span class="text-sm font-black">Square Customers</span>
              </div>
              <span class="text-xs text-muted-foreground">{{ square.sqCustomers.value.length }} total</span>
            </div>
            <div class="p-3 overflow-y-auto" style="max-height:320px">
              <div v-if="square.sqCustomers.value.length === 0" class="py-10 text-center text-xs text-muted-foreground">No customers found in Square</div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div
                  v-for="c in square.sqCustomers.value"
                  :key="c.id"
                  class="flex items-center gap-3 p-3 rounded-lg"
                  style="background:rgba(0,0,0,0.03)"
                >
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 text-white" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)">
                    {{ c.name?.charAt(0) || '?' }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-bold truncate">{{ c.name }}</div>
                    <div class="text-xs text-muted-foreground truncate">{{ c.email || c.phone || 'No contact' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </template>

    <!-- ── Add Expense Dialog ─────────────────────────────────── -->
    <Dialog v-model:visible="addExpenseOpen" modal header="Log Expense" class="w-full max-w-md mx-4" :draggable="false">
      <p class="text-xs text-muted-foreground mt-0 mb-4">Track overhead and business costs</p>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
          <InputText v-model="expenseForm.description" placeholder="Monthly rent, supplies, utilities…" class="w-full rounded-xl" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase">Amount</label>
            <InputText v-model.number="expenseForm.amount" type="number" placeholder="0.00" class="w-full rounded-xl" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase">Date</label>
            <InputText v-model="expenseForm.date" type="date" class="w-full rounded-xl" />
          </div>
        </div>
        <div>
          <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Category</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in expenseCategories"
              :key="cat.label"
              type="button"
              class="filter-chip"
              :class="{ 'filter-chip--active': expenseForm.category === cat.label }"
              :style="expenseForm.category === cat.label ? { borderColor: cat.color, color: cat.color, background: cat.color + '18' } : {}"
              @click="expenseForm.category = cat.label"
            >{{ cat.label }}</button>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" variant="text" class="text-none" @click="addExpenseOpen = false" />
        <Button label="Log Expense" class="text-none font-bold text-white" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:none" @click="logExpense" />
      </template>
    </Dialog>

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
  { label: 'Overhead', value: expenses.value.filter(e => e.category === 'Overhead').reduce((a, e) => a + e.amount, 0), color: '#f97316', icon: 'mdi-home' },
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
  const map: Record<string, string> = { Overhead: 'mdi-home', Utilities: 'mdi-flash-outline', Software: 'mdi-wifi', Supplies: 'mdi-package-variant-closed', Payroll: 'mdi-account-group-outline', Other: 'mdi-clipboard-list-outline' }
  return map[cat] || 'mdi-clipboard-list-outline'
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
