<template>
  <h1 class="w-full max-w-custom mx-auto z-1">
    <span class="hidden">in/visible presence</span>
    <img
      :src="size === 'sm' ? '/title.svg' : '/title-xs.svg'"
      class="w-full filter blur-custom mb-sm"
    />
  </h1>
</template>

<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'sm',
  },
});
</script>
