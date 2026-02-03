<template>
  <section
    class="relative h-full min-h-frame-h w-full pointer-events-none pr-md"
  >
    <div class="h-full flex flex-col">
      <TimelineBackground
        :time-slots="props.timeSlots"
        :hour-ms="HOUR_MS"
        :show-subdivisions="showSubdivisions"
        :focus-hour-key="focusHourKey"
      />
      <transition name="fade">
        <div
          v-show="showVisits && !hideBeforeMount"
          class="relative h-full timeline-inner ml-24 mr-[calc(var(--depth)*var(--side-depth-multiplier))]"
        >
          <template v-for="item in layout.items" :key="item.id">
            <TimelineVisit
              v-if="item.type === 'visit'"
              :id="item.visitId"
              :fingerprint="item.visitFingerprint"
              :segment-id="item.id"
              :style="item.style"
              :is-continuation="item.isContinuation"
              :is-last-segment="item.isLastSegment"
              :is-highlight="item.visitId === highlightVisitId"
            />
            <TimelineNoVisit v-else :style="item.style" />
          </template>
        </div>
      </transition>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { timeSlots as defaultTimeSlots, visits } from './store/visits';
import TimelineBackground from './TimelineBackground.vue';
import TimelineNoVisit from './TimelineNoVisit.vue';
import TimelineVisit from './TimelineVisit.vue';
import { buildTimelineLayout } from './timelineLayout';
import { useVisitorSocket } from './store/visitorSocket';

import { useZoomState } from './store/zoomState';

const { isZooming } = useZoomState();

const emit = defineEmits(['select']);
const route = useRoute();
const hideBeforeMount = ref(true);
const hasEmittedVisitor = ref(false);
const skipFirstScreenLog = ref(true);

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
  zoomRequest: {
    type: Number,
    default: 0,
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
      fingerprint: visitor.meta?.fingerprint || null,
    }));
});

const layout = computed(() =>
  buildTimelineLayout({
    visits: liveVisits.value,
    timeSlots: props.timeSlots,
    nowMs: now.value,
  }),
);

const showVisits = computed(() => !isZooming.value);

const visitorTargetSegment = computed(() => {
  if (route.name !== 'visitor' || !props.highlightVisitId) {
    return null;
  }
  return (
    layout.value.items
      .filter(
        (item) =>
          item.type === 'visit' && item.visitId === props.highlightVisitId,
      )
      .pop() || null
  );
});

onMounted(() => {
  connect();
  setTimeout(() => {
    hideBeforeMount.value = false;
  }, 400);
  if (route.name === 'visitor') {
    nextTick(() => {
      logClientY(props.highlightVisitId, 'visitor clientY');
    });
  }
});

const logClientY = (targetId, label) => {
  if (!targetId) {
    return false;
  }

  const targetSegment = layout.value.items
    .filter((item) => item.type === 'visit' && item.visitId === targetId)
    .pop();

  if (!targetSegment?.style?.bottom || !targetSegment?.style?.height) {
    return false;
  }
  const bottomPct = parseFloat(targetSegment.style.bottom);
  const heightPct = parseFloat(targetSegment.style.height);
  if (!Number.isFinite(bottomPct) || !Number.isFinite(heightPct)) {
    return false;
  }
  const topPct = bottomPct + heightPct;
  const topPx = (topPct * window.innerHeight) / 100;
  const clientY = window.innerHeight - topPx;
  emit('select', clientY);

  return true;
};

watch(
  () => visitors.value.length,
  async () => {
    if (route.name !== 'screen') {
      return;
    }
    if (skipFirstScreenLog.value) {
      skipFirstScreenLog.value = false;
      return;
    }
    await nextTick();
    const latestId = visitors.value.at(-1)?.id || '';
    logClientY(latestId, 'screen clientY');
  },
  { immediate: false },
);

watch(
  () => visitorTargetSegment.value,
  () => {
    if (route.name !== 'visitor') {
      return;
    }
    if (hasEmittedVisitor.value) {
      return;
    }
    const ok = logClientY(props.highlightVisitId, 'visitor clientY');
    if (ok) {
      hasEmittedVisitor.value = true;
    }
  },
  { immediate: true },
);

watch(
  () => props.highlightVisitId,
  () => {
    if (route.name !== 'visitor') {
      return;
    }
    hasEmittedVisitor.value = false;
  },
);

watch(
  () => props.zoomRequest,
  async () => {
    if (route.name !== 'visitor') {
      return;
    }
    console.log('zoomRequest changed');
    await nextTick();
    logClientY(props.highlightVisitId, 'visitor clientY');
  },
);
</script>

<style scoped></style>
