<template>
  <LayoutOverlay>
    <p class="px-xs">Your presence has faded. <br />Your trace remains.</p>

    <button
      class="mt-sm ml-xs text-secondary block relative"
      type="button"
      @click="emit('resume')"
    >
      <div
        class="w-full h-full absolute top-0 left-0 text-secondary bg-primary blur-custom rounded-full"
      ></div>
      <span class="px-sm py-xs inline-block z-1 relative">Return</span>
    </button>
  </LayoutOverlay>
</template>
<script setup>
const emit = defineEmits(['resume']);
</script>
