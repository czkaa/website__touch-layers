<template>
  <article
    class="font-geist-mono border-b border-primary pb-xs mb-xs text-primary text-xs"
  >
    <header class="flex items-center justify-between gap-xs">
      <div class="flex items-center gap-xs">
        <span
          class="w-3 h-3 border-primary border rounded-full inline-block"
          :class="{ 'bg-primary': isOnline }"
        />
        <span>User Nr.{{ index + 1 }}</span>
      </div>
      <span :class="statusClass">{{ statusLabel }}</span>
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
    type: Object,
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

const statusLabel = computed(() => (props.visitor.leftAt ? 'offline' : 'online'));
const statusClass = computed(() =>
  props.visitor.leftAt ? 'opacity-60' : 'text-green-400',
);

const meta = computed(() => props.visitor.meta || props.visitor || {});

const deviceLabel = computed(() => {
  const ua = meta.value.userAgent || '';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
});

const browserLabel = computed(() => {
  const ua = meta.value.userAgent || '';
  if (/Edg/i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua) && !/Edg|OPR|Brave/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  return 'Other';
});

const durationLabel = computed(() => {
  const start = props.visitor.enteredAt
    ? new Date(props.visitor.enteredAt).getTime()
    : null;
  if (!start || Number.isNaN(start)) {
    return '—';
  }
  const end = props.visitor.leftAt
    ? new Date(props.visitor.leftAt).getTime()
    : props.now.value;
  const totalSeconds = Math.max(Math.floor((end - start) / 1000), 0);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
});
</script>
