<template>
  <h1 class="w-full max-w-custom mx-auto mt-xs z-1">
    <span class="hidden">Your presence leaves traces</span>
    <img
      :src="size === 'sm' ? '/title.svg' : '/title-xs.svg'"
      class="w-[75%] filter blur-custom ml-auto mr-sm mb-sm"
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
