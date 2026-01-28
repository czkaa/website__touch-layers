<template>
  <article
    class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-custom mx-auto z-50 h-frame-h bg-secondary overflow-y-auto"
  >
    <SnippetsTitle size="xs" />
    <div class="p-sm">
      <p class="border-b border-primary pb-sm mb-sm">Lorem Ipsum</p>
      <LayoutList class="" />
    </div>
  </article>
</template>
<script setup>
import SnippetsTitle from '../snippets/SnippetsTitle.vue';
import LayoutList from './LayoutList.vue';
</script>
