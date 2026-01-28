<template>
  <article
    class="flex items-center justify-between gap-xs font-geist-mono border-b border-primary pb-xs mb-xs text-primary text-xs"
  >
    <header>
      <span
        class="w-3 h-3 mr-xs border-primary border rounded-full inline-block"
        :class="{ 'bg-primary': isOnline }"
      />
      <span class="">User Nr.{{ index + 1 }}</span>
    </header>
    <span class="">{{ enteredLabel }}</span>
  </article>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visitor: {
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

const statusClass = computed(() =>
  props.visitor.leftAt ? 'opacity-60' : 'text-green-400',
);
</script>
