<template>
  <h1
    class="w-full max-w-custom mx-auto z-1 filter blur-custom mb-sm text-primary px-1.5"
  >
    <span class="hidden">in/visible presence</span>
    <SnippetsTitleMd v-if="size === 'sm'" />
    <SnippetsTitleSm v-else />
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
