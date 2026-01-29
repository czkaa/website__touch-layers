<template>
  <article
    class="fixed bottom-[1px] left-1/2 -translate-x-1/2 w-full max-w-custom mx-auto h-frame-h bg-secondary overflow-y-auto border-t border-primary"
  >
    <SnippetsTitle size="xs" />
    <div class="p-sm">
      <p class="border-b border-primary pb-sm mb-sm">Lorem Ipsum</p>
      <LayoutList :current-id="currentId" />
    </div>
  </article>
</template>
<script setup>
import SnippetsTitle from '../snippets/SnippetsTitle.vue';
import LayoutList from './LayoutList.vue';

defineProps({
  currentId: {
    type: String,
    default: '',
  },
});
</script>
