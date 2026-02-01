<template>
  <section
    class="fixed bottom-[1px] left-1/2 -translate-x-1/2 w-full max-w-custom mx-auto h-frame-h bg-secondary overflow-y-auto border-t px-sm"
  >
    <TimelineRandomVertical />

    <div class="border-x border-primary">
      <SnippetsTitle size="xs" />

      <div class="border-y border-primary py-sm relative bg-secondary">
        <slot />
      </div>
    </div>
  </section>
</template>
