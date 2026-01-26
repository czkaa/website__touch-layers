<template>
  <div class="timeline-hours flex flex-col-reverse">
    <template v-if="hourBlocks">
      <TimelineBackgroundHour
        v-for="hour in hourBlocks"
        :hour="hour"
        :showSubdivisions="showSubdivisions"
        :key="hour.id"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  hours: {
    type: Array,
    required: true,
  },
  showSubdivisions: {
    type: Boolean,
    default: false,
  },
});

const hourBlocks = computed(() => {
  const hourCount = Math.max(props.hours.length, 1);
  return props.hours.map((hour, index) => ({
    id: `hour-block-${hour.id}`,
    label: hour.label,
    dateLabel: hour.dateLabel,
  }));
});
</script>

<style scoped>
.timeline-borders {
  position: absolute;
  inset: 0;
  border-left: 1px solid var(--color-primary);
  border-right: 1px solid var(--color-primary);
  pointer-events: none;
  z-index: 0;
  width: 99%;
  margin: auto;
}

.timeline-hours {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
</style>
