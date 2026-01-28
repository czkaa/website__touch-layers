<template>
  <article
    class="font-geist-mono border-b border-primary pb-xs mb-xs text-xs"
    :class="{ 'text-highlight': isOnline }"
  >
    <header class="flex items-center justify-between gap-xs">
      <div class="flex items-center gap-xs">
        <span
          class="w-3 h-3 border rounded-full inline-block"
          :class="[
            isOnline ? 'border-highlight' : 'border-primary',
            { 'bg-highlight ': isOnline },
          ]"
        />

        <span>User Nr.{{ index + 1 }}</span>
      </div>
      <span>{{ statusLabel }}</span>
    </header>
    <div class="mt-xs grid grid-cols-2 gap-x-sm gap-y-1">
      <span>Device</span>
      <span class="text-right">{{ deviceLabel }}</span>
      <span>Browser</span>
      <span class="text-right">{{ browserLabel }}</span>
      <span>Screen</span>
      <span class="text-right">{{ meta.screen ?? '—' }}</span>
      <span>Language</span>
      <span class="text-right">{{ meta.language ?? '—' }}</span>
      <span>Timezone</span>
      <span class="text-right">{{ meta.timezone ?? '—' }}</span>
      <span>Time on site</span>
      <span class="text-right">{{ durationLabel }}</span>
      <span>Entered</span>
      <span class="text-right">{{ enteredLabel }}</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visitor: {
    type: Object,
    required: true,
  },
  now: {
    type: Number,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
});

const formatTime = (value) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const enteredLabel = computed(
  () => `Entered ${formatTime(props.visitor.enteredAt)}`,
);

const isOnline = computed(() => !props.visitor.leftAt);
const statusLabel = computed(() => (isOnline.value ? 'online' : 'offline'));

const meta = computed(() => props.visitor.meta || props.visitor || {});

const deviceLabel = computed(() => meta.value.device || '—');
const browserLabel = computed(() => meta.value.browser || '—');

const durationLabel = computed(() => {
  const start = props.visitor.enteredAt
    ? new Date(props.visitor.enteredAt).getTime()
    : null;
  if (!start || Number.isNaN(start)) {
    return '—';
  }
  const end = props.visitor.leftAt
    ? new Date(props.visitor.leftAt).getTime()
    : props.now;
  const totalSeconds = Math.max(Math.floor((end - start) / 1000), 0);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
});
</script>
