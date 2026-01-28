<template>
  <main class="w-frame-w h-frame-h overflow-hidden">
    <SnippetsHeader />
    <TimelineStage :highlight-visit-id="currentId" />

    <div class="fixed top-0 bg-white text-black text-sm">
      {{ currentDuration }}
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import TimelineStage from '../timeline/TimelineStage.vue';
import { useVisitorSocket } from '../timeline/store/visitorSocket';
import SnippetsHeader from '../snippets/SnippetsHeader.vue';

const { visitors, status, now, connect, sendEnter, sendLeave, getSessionId } =
  useVisitorSocket();
const currentId = ref('');

const formatDuration = (start, end, nowMs) => {
  if (!start) {
    return '—';
  }
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : nowMs;
  const seconds = Math.max(Math.floor((endMs - startMs) / 1000), 0);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const currentDuration = computed(() => {
  const current = visitors.value.find(
    (visitor) => visitor.id === currentId.value,
  );
  if (!current) {
    return '—';
  }
  return formatDuration(current.enteredAt, current.leftAt, now.value);
});

onMounted(() => {
  connect();
  const entered = sendEnter();
  currentId.value = entered?.id || getSessionId() || '';
});

onBeforeUnmount(() => {
  sendLeave();
});
</script>
