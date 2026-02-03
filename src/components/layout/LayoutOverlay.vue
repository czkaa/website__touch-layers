<template>
  <section
    class="fixed bottom-[1px] left-1/2 -translate-x-1/2 w-full max-w-custom mx-auto h-frame-h bg-secondary overflow-y-auto border-t"
  >
    <TimelineRandomVertical />

    <div class="border-x border-primary mx-outer-2">
      <div class="-mx-outer-2"><SnippetsTitle size="xs" /></div>

      <div class="relative bg-secondary text-sm">
        <div class="border-t border-primary -mx-outer-2"></div>
        <slot />
        <div class="border-t border-primary -mx-outer-2"></div>
      </div>
    </div>
  </section>
</template>
