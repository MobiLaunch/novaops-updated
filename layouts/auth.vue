<template>
  <!-- Auth layout: just a full-screen passthrough wrapper.
       The login/register pages set their own background, so this wrapper
       must NOT add bg-background — doing so creates a mismatched double
       layer that shows through on Electron and leaves un-themed gaps.
       position:fixed + inset:0 guarantees every pixel is covered even
       when the Electron titlebar shifts the document origin. -->
  <div style="position:fixed;inset:0;overflow:auto;">
    <slot />
  </div>
</template>
