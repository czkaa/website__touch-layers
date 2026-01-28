<template>
  <h1 class="w-full max-w-[66vh] mx-auto">
    <span class="hidden">Your presence leaves traces</span>
    <img src="/title.svg" class="mr-7 ml-20 filter blur-custom" />
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
