<template>
  <article
    class="font-geist-mono pb-xs text-sm-mono px-xs"
    :class="{ 'text-highlight': isCurrent }"
  >
    <header class="flex items-center justify-between gap-xs"></header>

    <div class="mt-xs grid grid-cols-2 gap-x-sm">
      <div class="space-y-0.5">
        <div class="flex items-center gap-xs">
          <span
            class="w-3 h-3 border rounded-full inline-block"
            :class="[
              isOnline ? 'border-highlight bg-highlight ' : 'border-primary',
            ]"
          />

          <span>User #{{ index + 1 }}: </span>
          <span>{{ statusLabel }}</span>
        </div>
        <div v-if="showCurrentlyOnline">
          <span>Currently online: </span>
          <span>{{ currentlyOnline }}</span>
        </div>
        <div v-for="row in leftRows" :key="row.label">
          <span>{{ row.label }} </span>
          <span class="text-right">{{ row.value }}</span>
        </div>
      </div>
      <div class="space-y-0.5">
        <div v-for="row in rightRows" :key="row.label">
          <span>{{ row.label }} </span>
          <span class="text-right capitalize"> {{ row.value }}</span>
        </div>
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
  currentlyOnline: {
    type: Number,
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

const showCurrentlyOnline = computed(
  () => typeof props.currentlyOnline === 'number',
);
const isOnline = computed(() => !props.visitor.leftAt);

const statusLabel = computed(() => (isOnline.value ? 'Online' : 'Offline'));
const enteredLabel = computed(() => formatTime(props.visitor.enteredAt));
const leftLabel = computed(() =>
  isOnline.value ? '—' : formatTime(props.visitor.leftAt),
);

const meta = computed(() => props.visitor.meta || props.visitor || {});
const deviceLabel = computed(() => meta.value.device || '—');
const browserLabel = computed(() => meta.value.browser || '—');
const screenLabel = computed(() => meta.value.screen || '—');
const languageLabel = computed(() => meta.value.language || '—');
const timezoneLabel = computed(() => meta.value.timezone || '—');
const idLabel = computed(
  () => meta.value.fingerprint || props.visitor.id || '—',
);

const durationLabel = computed(() => {
  const startValue = props.visitor.enteredAt
    ? new Date(props.visitor.enteredAt).getTime()
    : null;
  if (!startValue || Number.isNaN(startValue)) {
    return '—';
  }
  const endValue = props.visitor.leftAt
    ? new Date(props.visitor.leftAt).getTime()
    : props.now;
  const totalSeconds = Math.max(Math.floor((endValue - startValue) / 1000), 0);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
});

const leftRows = computed(() => [
  { label: 'User-ID: ', value: idLabel.value },
  { label: 'Time entered: ', value: enteredLabel.value },
  { label: 'Time left: ', value: leftLabel.value },
  { label: 'Duration: ', value: durationLabel.value },
]);

const rightRows = computed(() => [
  { label: 'Device: ', value: deviceLabel.value },
  { label: 'Browser: ', value: browserLabel.value },
  { label: 'Screen: ', value: screenLabel.value },
  { label: 'Language: ', value: languageLabel.value },
  { label: 'Timezone: ', value: timezoneLabel.value },
]);
</script>
