<template>
  <article
    class="font-geist-mono pb-xs text-xs"
    :class="{ 'text-highlight': isCurrent }"
  >
    <header class="flex items-center justify-between gap-xs"></header>

    <div class="mt-xs grid grid-cols-2 gap-x-sm gap-y-1">
      <div class="flex items-center gap-xs">
        <span
          class="w-3 h-3 border rounded-full inline-block"
          :class="[
            isCurrent ? 'border-highlight ' : 'border-primary',
            isOnline ? 'bg-current' : '',
          ]"
        />

        <span>User Nr.{{ index + 1 }}:</span>
        <span>{{ statusLabel }}</span>
      </div>

      <div>
        <span>Device:</span> <span class="text-right">{{ deviceLabel }}</span>
      </div>
      <div>
        <span>Browser:</span> <span class="text-right">{{ browserLabel }}</span>
      </div>
      <div>
        <span>Screen: </span>
        <span class="text-right">{{ meta.screen ?? '—' }}</span>
      </div>
      <div>
        <span>Language: </span>
        <span class="text-right">{{ meta.language ?? '—' }}</span>
      </div>
      <div>
        <span>Timezone: </span>
        <span class="text-right">{{ meta.timezone ?? '—' }}</span>
      </div>
      <div>
        <span>Time on site: </span>
        <span class="text-right">{{ durationLabel }}</span>
      </div>
      <div>
        <span>Entered:</span> <span class="text-right">{{ enteredLabel }}</span>
      </div>
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
  isCurrent: {
    type: Boolean,
    default: false,
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
