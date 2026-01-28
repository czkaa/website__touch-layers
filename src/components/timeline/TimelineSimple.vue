<template>
  <section class="relative h-full min-h-frame-h w-full p-2 pointer-events-none">
    <div class="h-full flex flex-col">
      <TimelineBackground
        :time-slots="props.timeSlots"
        :hour-ms="HOUR_MS"
        :show-subdivisions="showSubdivisions"
        :focus-hour-key="focusHourKey"
      />
      <div
        class="relative h-full timeline-inner ml-20 mr-[calc(var(--depth)*var(--side-depth-multiplier))]"
      >
        <template v-for="item in layout.items" :key="item.id">
          <TimelineVisit
            v-if="item.type === 'visit'"
            :id="item.visitId"
            :segment-id="item.id"
            :style="item.style"
            :is-continuation="item.isContinuation"
            :is-last-segment="item.isLastSegment"
            :is-highlight="item.visitId === highlightVisitId"
          />
          <TimelineNoVisit v-else :style="item.style" />
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { timeSlots as defaultTimeSlots, visits } from './store/visits';
import TimelineBackground from './TimelineBackground.vue';
import TimelineNoVisit from './TimelineNoVisit.vue';
import TimelineVisit from './TimelineVisit.vue';
import { buildTimelineLayout } from './timelineLayout';
import { useVisitorSocket } from './store/visitorSocket';

const emit = defineEmits(['select']);
const route = useRoute();
const skipFirstFocus = ref(true);

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
    nowMs: now.value,
  }),
);

onMounted(() => {
  connect();
});

watch(
  () => visitors.value.length,
  (next, prev) => {
    if (next <= prev) {
      return;
    }
    if (route.name !== 'index') {
      return;
    }
    if (skipFirstFocus.value) {
      skipFirstFocus.value = false;
      return;
    }
    const newest = visitors.value[visitors.value.length - 1];
    const newestSegment = layout.value.items
      .filter((item) => item.type === 'visit' && item.visitId === newest?.id)
      .pop();
    const bottomPct =
      (parseFloat(newestSegment?.style?.bottom ?? '') * window.innerHeight) /
      100;
    const clientY = window.innerHeight - bottomPct - window.innerHeight * 0.005;
    emit('select', clientY);
    console.log(clientY);
  },
  { immediate: false },
);
</script>

<style scoped></style>
