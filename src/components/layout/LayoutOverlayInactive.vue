<template>
  <LayoutOverlay>
    <p class="p-xs">
      Your presence has faded. <br />Your trace remains.

      <button
        class="mt-sm text-secondary relative block"
        type="button"
        @click="emit('resume')"
      >
        <div
          class="w-full h-full absolute top-0 left-0 text-secondary bg-highlight blur-custom rounded-full"
        ></div>
        <span class="px-sm py-xs inline-block z-1 relative">Return</span>
      </button>
    </p>
  </LayoutOverlay>
</template>
<script setup>
const emit = defineEmits(['resume']);
</script>
