<template>
  <div
    class="timeline-stage w-full h-full overflow-hidden"
    :class="{ 'is-zoomed': isZoomed }"
    ref="stageRef"
    @click.capture="handleStageClick"
    @wheel.prevent.stop="handleWheel"
  >
    <div
      class="timeline-zoom w-full"
      :style="zoomStyle"
      :class="[
        isScrolling
          ? 'transition-none'
          : 'transition-[transform,height] duration-[1000ms] ease-out',
      ]"
    >
      <TimelineSimple
        :time-slots="timeSlots"
        :highlight-visit-id="highlightVisitId"
        :show-subdivisions="isZoomed"
        :focus-hour-key="focusedHourKey"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { Gesture } from '@use-gesture/vanilla';
import debounce from 'lodash.debounce';
import { timeSlots as defaultTimeSlots } from './store/visits';
import { useZoomState } from './store/zoomState';

defineProps({
  timeSlots: {
    type: Array,
    default: () => defaultTimeSlots,
  },
  highlightVisitId: {
    type: String,
    default: null,
  },
});

const selectedId = ref(null);
const ZOOM_LEVELS = [1, 100];
const zoomScale = ref(1);
const zoomTranslatePx = ref(0);
const focusedHourKey = ref(null);
const autoZooming = ref(false);
const stageRef = ref(null);
const isScrolling = ref(false);
const pinchHandled = ref(false);
const gestureInstance = ref(null);
const { setZoomingFor } = useZoomState();
const stopScrolling = debounce(() => {
  isScrolling.value = false;
}, 100);

const initGestures = (el) => {
  gestureInstance.value = new Gesture(
    el,
    {
      onDrag: (state) => {
        if (!isZoomed.value) {
          return;
        }
        state.event?.preventDefault?.();
        const deltaY = state.delta?.[1] ?? 0;
        zoomTranslatePx.value += deltaY;
      },
      onPinch: (state) => {
        if (pinchHandled.value) {
          return;
        }
        state.event?.preventDefault?.();
        const originY = state.origin?.[1];
        pinchHandled.value = true;
        if (!isZoomed.value) {
          applyZoomAtClientY(originY);
        } else {
          resetZoom();
        }
      },
      onPinchEnd: () => {
        pinchHandled.value = false;
      },
    },
    { eventOptions: { passive: false } },
  );
};

onBeforeUnmount(() => {
  stopScrolling.cancel();
  if (gestureInstance.value) {
    gestureInstance.value.destroy();
    gestureInstance.value = null;
  }
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

onMounted(() => {
  if (!stageRef.value) {
    return;
  }
  initGestures(stageRef.value);
});

const resetZoom = () => {
  selectedId.value = null;
  zoomScale.value = 1;
  zoomTranslatePx.value = 0;
  focusedHourKey.value = null;
};

const setTranslatePxFromClientY = (clientY) => {
  if (!stageRef.value || clientY == null) {
    return;
  }
  const rect = stageRef.value.getBoundingClientRect();
  if (rect.height <= 0) {
    return;
  }
  const y = clamp(clientY - rect.top, 0, rect.height);
  zoomTranslatePx.value = -(y * zoomScale.value);
};

const clampTranslateToBounds = () => {
  if (!stageRef.value) {
    return;
  }
  const rect = stageRef.value.getBoundingClientRect();
  if (rect.height <= 0) {
    return;
  }
  const viewportHeight = rect.height;
  const contentHeight = zoomScale.value * viewportHeight;
  const minTranslate = -(contentHeight - viewportHeight);
  zoomTranslatePx.value = clamp(zoomTranslatePx.value, minTranslate, 0);
};

const applyZoomAtClientY = (clientY) => {
  console.log('applyZoomAtClientY', clientY);
  selectedId.value = null;
  focusedHourKey.value = null;
  setZoomingFor(1000);
  zoomScale.value = ZOOM_LEVELS[1];
  nextTick(() => {
    setTranslateForCenterRatio();
    clampTranslateToBounds();
    setTranslatePxFromClientY(clientY);
    clampTranslateToBounds();
  });
};

const handleStageClick = (event) => {
  if (isZoomed.value) {
    resetZoom();
    return;
  }
  applyZoomAtClientY(event?.clientY);
};

const setTranslateForCenterRatio = () => {
  zoomTranslatePx.value = 0;
};

const handleSelect = (clientY) => {
  applyZoomAtClientY(clientY);
};

const zoomStyle = computed(() => ({
  height: `${zoomScale.value * 100}%`,
  transform: `translateY(${zoomTranslatePx.value}px)`,
}));

const isZoomed = computed(() => zoomScale.value > 1.01);

const handleWheel = (event) => {
  if (autoZooming.value) {
    return;
  }
  if (event.ctrlKey) {
    event.preventDefault();
    if (event.deltaY < 0 && !isZoomed.value) {
      applyZoomAtClientY(event.clientY);
    } else if (event.deltaY > 0 && isZoomed.value) {
      resetZoom();
    }
    return;
  }
  if (!isZoomed.value) {
    return;
  }
  if (!stageRef.value) {
    return;
  }
  event.preventDefault();
  zoomTranslatePx.value -= event.deltaY;
};
</script>

<style scoped>
.timeline-stage {
  position: relative;
  touch-action: none;
  overscroll-behavior: none;
}

.timeline-zoom {
  width: 100%;
  height: 100%;
  transform-origin: 50% 0%;
  will-change: transform, height;
}
</style>
