<template>
  <div class="cal-root" :class="{ 'cal--compact': compact }">
    <!-- Header: Month/Year nav -->
    <div class="cal-header">
      <button class="cal-nav-btn" @click="prevMonth" aria-label="Previous month">
        <ChevronLeft class="w-4 h-4" />
      </button>

      <button class="cal-heading" @click="toggleYearPicker">
        <span>{{ monthName }} {{ year }}</span>
        <ChevronDown class="w-3 h-3 cal-heading-chevron" :class="{ 'rotate-180': showYearPicker }" />
      </button>

      <button class="cal-nav-btn" @click="nextMonth" aria-label="Next month">
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Year picker dropdown -->
    <Transition name="cal-expand">
      <div v-if="showYearPicker" class="year-picker">
        <button
          v-for="y in yearRange"
          :key="y"
          class="year-btn"
          :class="{ 'year-btn--active': y === year }"
          @click="selectYear(y)"
        >{{ y }}</button>
      </div>
    </Transition>

    <!-- Day-of-week headers -->
    <div class="cal-grid cal-weekdays">
      <span v-for="d in WEEKDAYS" :key="d" class="cal-weekday">{{ d }}</span>
    </div>

    <!-- Date cells -->
    <div class="cal-grid cal-cells">
      <span
        v-for="(cell, i) in cells"
        :key="i"
        class="cal-cell"
        :class="{
          'cell--empty':    !cell.date,
          'cell--today':    cell.isToday,
          'cell--selected': cell.isSelected,
          'cell--disabled': cell.isDisabled,
          'cell--in-range': cell.inRange,
          'cell--range-start': cell.isRangeStart,
          'cell--range-end':   cell.isRangeEnd,
        }"
        @click="cell.date && !cell.isDisabled && selectDate(cell.date)"
      >
        <span class="cell-inner">{{ cell.day }}</span>
      </span>
    </div>

    <!-- Footer action slot -->
    <div class="cal-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-vue-next'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const props = withDefaults(defineProps<{
  modelValue?: string | null         // YYYY-MM-DD
  rangeStart?: string | null
  rangeEnd?: string | null
  minDate?: string | null
  maxDate?: string | null
  disabledDates?: string[]
  compact?: boolean
  mode?: 'single' | 'range'
}>(), {
  modelValue: null,
  mode: 'single',
  compact: false,
  disabledDates: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [string]
  'update:rangeStart': [string]
  'update:rangeEnd':   [string]
  select: [string]
}>()

// Navigation state
const today = new Date()
const viewYear  = ref(props.modelValue ? parseInt(props.modelValue.slice(0,4)) : today.getFullYear())
const viewMonth = ref(props.modelValue ? parseInt(props.modelValue.slice(5,7)) - 1 : today.getMonth())
const showYearPicker = ref(false)

const year      = computed(() => viewYear.value)
const monthName = computed(() => new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('en-US', { month: 'long' }))

const yearRange = computed(() => {
  const current = today.getFullYear()
  return Array.from({ length: 12 }, (_, i) => current - 4 + i)
})

function prevMonth() { if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- } else viewMonth.value-- }
function nextMonth() { if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ } else viewMonth.value++ }
function toggleYearPicker() { showYearPicker.value = !showYearPicker.value }
function selectYear(y: number) { viewYear.value = y; showYearPicker.value = false }

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function selectDate(dateStr: string) {
  emit('update:modelValue', dateStr)
  emit('select', dateStr)
}

const cells = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const todayStr = toYMD(today)
  const selectedStr = props.modelValue || ''
  const rangeStartStr = props.rangeStart || ''
  const rangeEndStr   = props.rangeEnd   || ''

  const result: any[] = []

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) result.push({ date: null, day: '' })

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear.value}-${String(viewMonth.value+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isToday    = dateStr === todayStr
    const isSelected = dateStr === selectedStr
    const isDisabled = (props.minDate && dateStr < props.minDate)
                    || (props.maxDate && dateStr > props.maxDate)
                    || props.disabledDates.includes(dateStr)
    const isRangeStart = dateStr === rangeStartStr
    const isRangeEnd   = dateStr === rangeEndStr
    const inRange = !!(rangeStartStr && rangeEndStr && dateStr > rangeStartStr && dateStr < rangeEndStr)

    result.push({ date: dateStr, day: d, isToday, isSelected, isDisabled, inRange, isRangeStart, isRangeEnd })
  }

  return result
})
</script>

<style scoped>
.cal-root {
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border));
  border-radius: 20px;
  padding: 16px;
  display: inline-flex;
  flex-direction: column;
  gap: 10px;
  user-select: none;
  min-width: 280px;
}
.cal--compact { padding: 12px; min-width: 240px; }

/* Header */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.cal-nav-btn {
  width: 32px; height: 32px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: hsl(var(--muted-foreground));
  transition: background 0.15s, color 0.15s, transform 0.2s;
}
.cal-nav-btn:hover { background: hsl(var(--muted) / 0.6); color: hsl(var(--foreground)); transform: scale(1.1); }
.cal-nav-btn:active { transform: scale(0.9); }

.cal-heading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 800;
  color: hsl(var(--foreground));
  padding: 6px 10px;
  border-radius: 10px;
  transition: background 0.15s;
}
.cal-heading:hover { background: hsl(var(--muted) / 0.5); }
.cal-heading-chevron { color: hsl(var(--muted-foreground)); transition: transform 0.2s; }
.rotate-180 { transform: rotate(180deg); }

/* Year picker */
.year-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
.year-btn {
  padding: 7px 4px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: hsl(var(--muted-foreground));
  transition: background 0.15s, color 0.15s;
}
.year-btn:hover { background: hsl(var(--muted) / 0.6); color: hsl(var(--foreground)); }
.year-btn--active { background: hsl(var(--primary) / 0.15); color: hsl(var(--primary)); font-weight: 800; }

/* Grid */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.cal-weekday {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: hsl(var(--muted-foreground));
  padding: 4px 2px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Cells */
.cal-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
  aspect-ratio: 1;
  position: relative;
  transition: background 0.15s, transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.cal-cell:not(.cell--empty):not(.cell--disabled):hover {
  background: hsl(var(--muted) / 0.6);
  transform: scale(1.12);
}
.cal-cell:not(.cell--empty):not(.cell--disabled):active { transform: scale(0.92); }

.cell-inner {
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1;
}

.cell--empty { cursor: default; pointer-events: none; }
.cell--disabled { opacity: 0.35; cursor: not-allowed; }
.cell--disabled:hover { background: none; transform: none; }

.cell--today .cell-inner { color: hsl(var(--primary)); font-weight: 800; }
.cell--today::after {
  content: '';
  position: absolute;
  bottom: 4px;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: hsl(var(--primary));
}

.cell--selected {
  background: hsl(var(--primary)) !important;
  border-radius: 10px;
}
.cell--selected .cell-inner { color: white; font-weight: 800; }
.cell--selected::after { display: none; }

.cell--in-range { background: hsl(var(--primary) / 0.12); border-radius: 0; }
.cell--range-start { background: hsl(var(--primary)); border-radius: 10px 0 0 10px; }
.cell--range-start .cell-inner { color: white; }
.cell--range-end   { background: hsl(var(--primary)); border-radius: 0 10px 10px 0; }
.cell--range-end .cell-inner   { color: white; }

/* Footer */
.cal-footer {
  border-top: 1px solid hsl(var(--border));
  padding-top: 10px;
}

/* Transition */
.cal-expand-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.2, 0.64, 1); }
.cal-expand-leave-active { transition: all 0.15s ease; }
.cal-expand-enter-from   { opacity: 0; transform: scaleY(0.85); transform-origin: top; }
.cal-expand-leave-to     { opacity: 0; }
</style>
