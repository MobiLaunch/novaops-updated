<template>
  <div class="w-full overflow-auto rounded-2xl border border-border/60 bg-card shadow-[var(--hui-shadow-sm)]">
    <table class="hui-table w-full" v-bind="$attrs"><slot /></table>
  </div>
</template>
