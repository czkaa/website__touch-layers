<template>
  <div
    class="timeline-stage pt-depth"
    :class="{ 'is-zoomed': isZoomed }"
    ref="stageRef"
    @click="resetZoom"
    @wheel="handleWheel"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <div
      class="timeline-zoom p-3"
      :style="zoomStyle"
      :class="[
        isScrolling
          ? 'transition-none'
          : 'transition-[transform,height] duration-[450ms] ease-out',
      ]"
    >
      <TimelineSimple
        :show-subdivisions="isZoomed"
        :focus-hour-key="focusedHourKey"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import debounce from 'lodash.debounce';

const selectedId = ref(null);
const ZOOM_LEVELS = [1, 4];
const zoomScale = ref(1);
const zoomTranslatePx = ref(0);
const focusedHourKey = ref(null);
const pointers = new Map();
const pinchStart = ref(null);
const stageRef = ref(null);
const pendingCenterRatio = ref(null);
const isScrolling = ref(false);
const stopScrolling = debounce(() => {
  isScrolling.value = false;
}, 140);

onBeforeUnmount(() => {
  stopScrolling.cancel();
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resetZoom = () => {
  selectedId.value = null;
  zoomScale.value = 1;
  zoomTranslatePx.value = 0;
  focusedHourKey.value = null;
};

const setTranslateForCenterRatio = (ratio) => {
  if (!stageRef.value) {
    return;
  }
  const rect = stageRef.value.getBoundingClientRect();
  const viewportHeight = rect.height;
  const contentHeight = zoomScale.value * viewportHeight;
  const centerFromTop = (1 - ratio) * contentHeight;
  const target = -(centerFromTop - viewportHeight / 2);
  const minTranslate = -(contentHeight - viewportHeight);
  zoomTranslatePx.value = clamp(target, minTranslate, 0);
};

watch(
  [zoomScale, pendingCenterRatio],
  ([scale, ratio]) => {
    if (ratio == null || !stageRef.value || scale <= 1.01) {
      return;
    }
    setTranslateForCenterRatio(ratio);
    pendingCenterRatio.value = null;
  },
  { flush: 'post' },
);

const handleSelect = (segment) => {
  const targetId = segment.visitId || segment.id;
  if (selectedId.value === targetId) {
    resetZoom();
    return;
  }

  const scale = ZOOM_LEVELS[1];
  const centerRatio = segment.centerRatio ?? 0.5;

  selectedId.value = targetId;
  zoomScale.value = scale;
  focusedHourKey.value = segment.hourStartMs ?? null;
  pendingCenterRatio.value = centerRatio;
};

const zoomStyle = computed(() => ({
  height: `${zoomScale.value * 100}%`,
  transform: `translateY(${zoomTranslatePx.value}px)`,
}));

const isZoomed = computed(() => zoomScale.value > 1.01);

const getAnchorRatio = (clientY) => {
  if (!stageRef.value) {
    return 0;
  }
  const rect = stageRef.value.getBoundingClientRect();
  const y = clamp(clientY - rect.top, 0, rect.height);
  const elementHeightCurrent = zoomScale.value * rect.height;
  return (y - zoomTranslatePx.value) / elementHeightCurrent;
};

const handleWheel = (event) => {
  if (!event.ctrlKey) {
    isScrolling.value = true;
    stopScrolling();
    if (!isZoomed.value) {
      return;
    }
    event.preventDefault();
    if (!stageRef.value) {
      return;
    }
    const rect = stageRef.value.getBoundingClientRect();
    const viewportHeight = rect.height;
    const contentHeight = zoomScale.value * viewportHeight;
    const minTranslate = -(contentHeight - viewportHeight);
    zoomTranslatePx.value = clamp(
      zoomTranslatePx.value - event.deltaY,
      minTranslate,
      0,
    );
    return;
  }
  isScrolling.value = false;
  stopScrolling.cancel();
  event.preventDefault();
  const nextScale = event.deltaY < 0 ? ZOOM_LEVELS[1] : ZOOM_LEVELS[0];
  if (nextScale <= 1.01) {
    resetZoom();
    return;
  }
  const anchorRatio = getAnchorRatio(event.clientY);
  zoomScale.value = nextScale;
  nextTick(() => {
    if (!stageRef.value) {
      return;
    }
    const rect = stageRef.value.getBoundingClientRect();
    const viewportHeight = rect.height;
    const contentHeight = zoomScale.value * viewportHeight;
    const centerFromTop = anchorRatio * contentHeight;
    const target = -(
      centerFromTop - clamp(event.clientY - rect.top, 0, rect.height)
    );
    const minTranslate = -(contentHeight - viewportHeight);
    zoomTranslatePx.value = clamp(target, minTranslate, 0);
  });
};

const updatePinch = () => {
  if (pointers.size !== 2 || pinchStart.value == null) {
    return;
  }
  const [a, b] = Array.from(pointers.values());
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.hypot(dx, dy);
  const ratio = distance / pinchStart.value;
  if (ratio > 1.06) {
    const midY = (a.y + b.y) / 2;
    const anchorRatio = getAnchorRatio(midY);
    zoomScale.value = ZOOM_LEVELS[1];
    nextTick(() => {
      if (!stageRef.value) {
        return;
      }
      const rect = stageRef.value.getBoundingClientRect();
      const viewportHeight = rect.height;
      const contentHeight = zoomScale.value * viewportHeight;
      const centerFromTop = anchorRatio * contentHeight;
      const target = -(centerFromTop - clamp(midY - rect.top, 0, rect.height));
      const minTranslate = -(contentHeight - viewportHeight);
      zoomTranslatePx.value = clamp(target, minTranslate, 0);
    });
    return;
  }
  if (ratio < 0.94) {
    resetZoom();
  }
};

const handlePointerDown = (event) => {
  if (event.pointerType === 'mouse') {
    return;
  }
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) {
    const [a, b] = Array.from(pointers.values());
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    pinchStart.value = Math.hypot(dx, dy);
  }
};

const handlePointerMove = (event) => {
  if (!pointers.has(event.pointerId)) {
    return;
  }
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  updatePinch();
};

const handlePointerUp = (event) => {
  if (pointers.has(event.pointerId)) {
    pointers.delete(event.pointerId);
  }
  if (pointers.size < 2) {
    pinchStart.value = null;
  }
};
</script>

<style scoped>
.timeline-stage {
  position: relative;
  width: 100%;
  height: 100%;

  touch-action: pan-y pinch-zoom;
}

.timeline-zoom {
  width: 100%;
  height: 100%;
  transform-origin: 50% 0%;
  will-change: transform, height;
}
</style>
