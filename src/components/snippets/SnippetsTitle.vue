<template>
  <h1 class="w-full max-w-custom mx-auto mt-sm">
    <span class="hidden">Your presence leaves traces</span>
    <img
      :src="size === 'sm' ? '/title.svg' : '/title-xs.svg'"
      class="mr-7 ml-20 filter blur-custom"
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
