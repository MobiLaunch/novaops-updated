<template>
  <div v-bind="$attrs" class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">
    <slot />
  </div>
</template>
