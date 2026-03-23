<template>
  <button type="button" v-bind="$attrs" class="hui-input flex items-center justify-between gap-2 cursor-pointer text-left w-full">
    <slot />
    <svg class="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
  </button>
</template>
