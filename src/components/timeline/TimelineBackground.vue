<template>
  <div class="timeline-hours w-full flex flex-col-reverse -z-50 relative pb-1">
    <template v-if="hourBlocks">
      <TimelineBackgroundHour
        v-for="hour in hourBlocks"
        :hour="hour"
        :showSubdivisions="showSubdivisions"
        :key="hour.id"
      />
    </template>

    <TimelineRandomVertical />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { timeSlots as defaultTimeSlots } from './store/visits';
import TimelineBackgroundHour from './TimelineBackgroundHour.vue';

const props = defineProps({
  timeSlots: {
    type: Array,
    default: () => defaultTimeSlots,
  },
  hourMs: {
    type: Number,
    default: 60 * 60 * 1000,
  },
  showSubdivisions: {
    type: Boolean,
    default: false,
  },
});

const hourBlocks = computed(() => {
  const hours = [];
  props.timeSlots.forEach((slot) => {
    const startMs = new Date(slot.start).getTime();
    const endMs = new Date(slot.end).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      return;
    }
    const startHour = new Date(startMs);
    startHour.setMinutes(0, 0, 0);
    const endHour = new Date(endMs);
    endHour.setMinutes(0, 0, 0);
    const endIsExactHour = endMs === endHour.getTime();
    const lastHour = endIsExactHour
      ? endHour.getTime() - props.hourMs
      : endHour.getTime();

    for (let t = startHour.getTime(); t <= lastHour; t += props.hourMs) {
      const markDate = new Date(t);
      const dateKey = markDate.toISOString().slice(0, 10);
      hours.push({
        id: `hour-${t}`,
        label: markDate.toTimeString().slice(0, 5),
        dateKey,
      });
    }
  });

  let lastDateKey = '';
  return hours.map((hour) => {
    const dateLabel =
      hour.dateKey !== lastDateKey
        ? new Date(hour.dateKey).toLocaleDateString('de-DE', {
            day: 'numeric',
            month: 'numeric',
          })
        : '';
    lastDateKey = hour.dateKey;
    return {
      id: `hour-block-${hour.id}`,
      label: hour.label,
      dateLabel,
    };
  });
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
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform, opacity;
}
</style>
