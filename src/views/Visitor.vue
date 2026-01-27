<template>
  <section class="p-6 text-white">
    <h1 class="text-2xl mb-4">Visitors</h1>
    <div class="mb-4 text-sm text-white/70">
      WS: {{ status }}
    </div>
    <div class="grid grid-cols-4 gap-2 text-sm">
      <div class="font-semibold">ID</div>
      <div class="font-semibold">Entered</div>
      <div class="font-semibold">Left</div>
      <div class="font-semibold">Duration</div>

      <template v-for="row in rows" :key="row.id">
        <div class="truncate">{{ row.id }}</div>
        <div>{{ row.enteredAt || '—' }}</div>
        <div>{{ row.leftAt || '—' }}</div>
        <div>{{ row.duration }}</div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useVisitorSocket } from '../components/timeline/store/visitorSocket';

const { visitors, status, now, connect, sendEnter, sendLeave } =
  useVisitorSocket();

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

const rows = computed(() =>
  visitors.value.map((visitor) => ({
    ...visitor,
    duration: formatDuration(visitor.enteredAt, visitor.leftAt, now.value),
  })),
);

onMounted(() => {
  connect();
  sendEnter();
});

onBeforeUnmount(() => {
  sendLeave();
});
</script>
