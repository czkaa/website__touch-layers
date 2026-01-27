<template>
  <section class="relative h-full min-h-frame-h px-20">
    <div class="h-full flex flex-col">
      <div
        class="relative h-full mr-[calc(var(--depth)*var(--side-depth-multiplier))] timeline-inner"
      >
        <component
          v-for="item in layout.items"
          :is="item.type === 'visit' ? TimelineVisit : TimelineNoVisit"
          :key="item.id"
          :id="item.type === 'visit' ? item.visitId : undefined"
          :style="item.style"
          :is-continuation="item.type === 'visit' ? item.isContinuation : false"
          :is-last-segment="item.type === 'visit' ? item.isLastSegment : false"
          @click.stop="item.type === 'visit' && handleSelect(item)"
        />
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
import { computed } from 'vue';
import { visits } from './store/visits';
import TimelineBackground from './TimelineBackground.vue';
import TimelineNoVisit from './TimelineNoVisit.vue';
import TimelineVisit from './TimelineVisit.vue';

const emit = defineEmits(['select']);

const props = defineProps({
  showSubdivisions: {
    type: Boolean,
    default: false,
  },
  focusHourKey: {
    type: Number,
    default: null,
  },
});

const HOUR_MS = 60 * 60 * 1000;

const layout = computed(() => {
  const sorted = visits
    .map((visit) => {
      const startMs = new Date(visit.start).getTime();
      const endMs = new Date(visit.end).getTime();
      return {
        ...visit,
        startMs,
        endMs,
      };
    })
    .sort((a, b) => a.startMs - b.startMs);

  const activeHourSet = new Set();
  sorted.forEach((visit) => {
    const startHour = new Date(visit.startMs);
    startHour.setMinutes(0, 0, 0);
    const endHour = new Date(visit.endMs);
    endHour.setMinutes(0, 0, 0);

    for (let t = startHour.getTime(); t <= endHour.getTime(); t += HOUR_MS) {
      activeHourSet.add(t);
    }
  });

  const activeHours = Array.from(activeHourSet).sort((a, b) => a - b);
  const hourIndex = new Map(activeHours.map((t, i) => [t, i]));
  const totalCompressedMs = Math.max(activeHours.length * HOUR_MS, 1);

  const toCompressed = (ms) => {
    const hourStart = new Date(ms);
    hourStart.setMinutes(0, 0, 0);
    const hourKey = hourStart.getTime();
    const index = hourIndex.get(hourKey);
    if (index === undefined) {
      return null;
    }
    const offsetInHour = ms - hourKey;
    return index * HOUR_MS + offsetInHour;
  };

  const boundaries = Array.from(
    new Set(sorted.flatMap((visit) => [visit.startMs, visit.endMs])),
  ).sort((a, b) => a - b);

  const segments = [];
  const lastSegmentByVisit = new Map();
  const noVisits = [];

  const gapPx = 0;

  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const segStart = boundaries[i];
    const segEnd = boundaries[i + 1];
    if (segEnd <= segStart) {
      continue;
    }

    const active = sorted
      .filter((visit) => visit.startMs < segEnd && visit.endMs > segStart)
      .sort((a, b) => a.startMs - b.startMs || a.id.localeCompare(b.id));

    if (active.length === 0) {
      const startCompressed = toCompressed(segStart);
      const endCompressed = toCompressed(segEnd);
      if (startCompressed != null && endCompressed != null) {
        const startRatio = startCompressed / totalCompressedMs;
        const endRatio = endCompressed / totalCompressedMs;
        const duration = Math.max(endRatio - startRatio, 0);
        noVisits.push({
          id: `gap-${segStart}`,
          segStart,
          style: {
            bottom: `${startRatio * 100}%`,
            height: `${duration * 100}%`,
            left: '0%',
            width: '100%',
          },
        });
      }
      continue;
    }

    const overlapCount = active.length;
    const laneWidth = 100 / overlapCount;
    const widthPxPart = ((overlapCount - 1) * gapPx) / overlapCount;

    active.forEach((visit, index) => {
      const startCompressed = toCompressed(segStart);
      const endCompressed = toCompressed(segEnd);
      const safeStart = startCompressed ?? 0;
      const safeEnd = endCompressed ?? safeStart;
      const startRatio = safeStart / totalCompressedMs;
      const endRatio = safeEnd / totalCompressedMs;
      const duration = Math.max(endRatio - startRatio, 0);
      const prev = lastSegmentByVisit.get(visit.id);

      segments.push({
        id: `${visit.id}-${segStart}`,
        visitId: visit.id,
        isContinuation: prev?.segEnd === segStart,
        segEnd,
        segStart,
        hourStartMs: new Date((segStart + segEnd) / 2).setMinutes(0, 0, 0),
        centerRatio: (startRatio + endRatio) / 2,
        style: {
          bottom: `${startRatio * 100}%`,
          height: `${duration * 100}%`,
          left: `${index * laneWidth}%`,
          width: `calc(${laneWidth}% - ${widthPxPart}px)`,
        },
      });

      lastSegmentByVisit.set(visit.id, { segEnd });
    });
  }

  const maxEndByVisit = new Map();
  segments.forEach((segment) => {
    const prevEnd = maxEndByVisit.get(segment.visitId);
    if (prevEnd == null || segment.segEnd > prevEnd) {
      maxEndByVisit.set(segment.visitId, segment.segEnd);
    }
  });
  segments.forEach((segment) => {
    segment.isLastSegment =
      segment.segEnd === maxEndByVisit.get(segment.visitId);
  });

  const items = [
    ...segments.map((segment) => ({ ...segment, type: 'visit' })),
    ...noVisits.map((gap) => ({ ...gap, type: 'gap' })),
  ].sort((a, b) => (a.segStart ?? 0) - (b.segStart ?? 0));

  return {
    items,
    visits: segments,
    noVisits,
    hours: activeHours.map((t, index) => {
      const markDate = new Date(t);
      const dateKey = markDate.toISOString().slice(0, 10);
      return {
        id: `hour-${t}`,
        offset: (index * HOUR_MS) / totalCompressedMs,
        label: markDate.toTimeString().slice(0, 5),
        dateKey,
        startMs: t,
      };
    }),
  };
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

const handleSelect = (segment) => {
  emit('select', segment);
};
</script>

<style scoped></style>
