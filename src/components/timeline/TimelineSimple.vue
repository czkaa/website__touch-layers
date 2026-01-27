<template>
  <section class="relative h-full min-h-frame-h px-20">
    <div class="h-full flex flex-col">
      <div
        class="relative h-full mr-[calc(var(--depth)*var(--side-depth-multiplier))] timeline-inner"
      >
        <template v-for="item in layout.items" :key="item.id">
          <TimelineVisit
            v-if="item.type === 'visit'"
            :id="item.visitId"
            :style="item.style"
            :is-continuation="item.isContinuation"
            :is-last-segment="item.isLastSegment"
            :is-highlight="item.visitId === highlightVisitId"
            @click.stop="handleSelect(item, $event)"
          />
          <TimelineNoVisit v-else :style="item.style" />
        </template>
      </div>

      <TimelineBackground
        :hours="hours"
        :show-subdivisions="showSubdivisions"
        :focus-hour-key="focusHourKey"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { timeSlots as defaultTimeSlots, visits } from './store/visits';
import TimelineBackground from './TimelineBackground.vue';
import TimelineNoVisit from './TimelineNoVisit.vue';
import TimelineVisit from './TimelineVisit.vue';
import { buildTimelineLayout } from './timelineLayout';
import { useVisitorSocket } from './store/visitorSocket';

const emit = defineEmits(['select']);

const props = defineProps({
  timeSlots: {
    type: Array,
    default: () => defaultTimeSlots,
  },
  showSubdivisions: {
    type: Boolean,
    default: false,
  },
  focusHourKey: {
    type: Number,
    default: null,
  },
  highlightVisitId: {
    type: String,
    default: null,
  },
});

const HOUR_MS = 60 * 60 * 1000;

const { visitors, now, connect } = useVisitorSocket();

const liveVisits = computed(() => {
  if (!visitors.value.length) {
    return [];
  }
  const nowIso = new Date(now.value).toISOString();
  return visitors.value
    .filter((visitor) => visitor.enteredAt)
    .map((visitor) => ({
      id: visitor.id,
      start: visitor.enteredAt,
      end: visitor.leftAt || nowIso,
    }));
});

const layout = computed(() =>
  buildTimelineLayout({
    visits: liveVisits.value,
    timeSlots: props.timeSlots,
    hourMs: HOUR_MS,
    nowMs: now.value,
  }),
);

onMounted(() => {
  connect();
});

const hours = computed(() => {
  let lastDateKey = '';
  return layout.value.hours.map((hour) => {
    const dateLabel =
      hour.dateKey !== lastDateKey
        ? new Date(hour.dateKey).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
          })
        : '';
    lastDateKey = hour.dateKey;
    return {
      ...hour,
      dateLabel,
    };
  });
});

const handleSelect = (segment, event) => {
  emit('select', { segment, event });
};
</script>

<style scoped></style>
