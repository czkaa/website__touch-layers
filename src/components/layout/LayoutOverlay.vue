<template>
  <article
    class="border-t border-primary bg-secondary fixed left-0 bottom-0 w-full z-50 h-full overflow-y-auto"
  >
    <SnippetsTitle />
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
