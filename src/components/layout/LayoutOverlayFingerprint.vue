<template>
  <article
    class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-custom mx-auto h-fit bg-secondary overflow-y-auto border-t border-primary px-xs"
  >
    <div class="absolute top-xs right-xs text-xs">
      <span>({{ onlineCount }})</span>
    </div>
    <LayoutListItem
      v-if="currentVisitor"
      :visitor="currentVisitor"
      :now="now"
      :index="currentIndex"
      :is-current="true"
    />
  </article>
</template>
<script setup>
import { computed, onMounted } from 'vue';
import { useVisitorSocket } from '../timeline/store/visitorSocket';
import LayoutListItem from './LayoutListItem.vue';

const props = defineProps({
  currentId: {
    type: String,
    default: '',
  },
});

const { visitors, now, connect, getSessionId } = useVisitorSocket();

const currentVisitor = computed(() => {
  const id = props.currentId || getSessionId();
  if (!id) {
    return null;
  }
  return visitors.value.find((visitor) => visitor.id === id) || null;
});

const currentIndex = computed(() => {
  const sorted = [...visitors.value].sort((a, b) => {
    const aTime = a.enteredAt ? new Date(a.enteredAt).getTime() : 0;
    const bTime = b.enteredAt ? new Date(b.enteredAt).getTime() : 0;
    return bTime - aTime;
  });
  const id = props.currentId || getSessionId();
  const idx = sorted.findIndex((visitor) => visitor.id === id);
  return idx === -1 ? 0 : sorted.length - idx - 1;
});

const onlineCount = computed(
  () => visitors.value.filter((visitor) => !visitor.leftAt).length,
);

onMounted(() => {
  connect();
});
</script>
