<template>
  <LayoutOverlay>
    <p class="border-b border-primary p-xs">Lorem Ipsum</p>
    <LayoutList :current-id="currentId" />
  </LayoutOverlay>
</template>

<script setup>
defineProps({
  currentId: {
    type: String,
    default: '',
  },
});
</script>
