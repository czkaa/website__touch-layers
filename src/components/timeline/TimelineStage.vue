<template>
  <div
    class="timeline-stage w-full h-full overflow-hidden"
    :class="{ 'is-zoomed': isZoomed }"
    ref="stageRef"
    @click.capture="handleStageClick"
    @wheel.prevent.stop="handleWheel"
  >
    <div
      class="absolute w-full h-full top-0 left-0 px-outer-2 flex justify-between"
    >
      <div class="w-[1px] h-full bg-primary translate-x-[0.5px]"></div>
      <div class="w-[1px] h-full bg-primary translate-x-[-0.5px]"></div>
    </div>

    <div class="timeline-zoom w-full" :style="[zoomStyle, zoomTransitionStyle]">
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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
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
const zoomTopPx = ref(0);
const focusedHourKey = ref(null);
const stageRef = ref(null);
const isScrolling = ref(false);
const isZoomAnimating = ref(false);
const gestureInstance = ref(null);
let zoomAnimationTimer = null;

const { setZoomingFor, setZoomed } = useZoomState();
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
        zoomTopPx.value += deltaY;
      },
      onPinch: (state) => {
        if (!state?.first) {
          return;
        }
        state.event?.preventDefault?.();
        const originY = state.origin?.[1];
        const scale = state?.offset?.[0] ?? state?.scale;
        const delta = state?.delta?.[0];
        const isPinchOut =
          typeof scale === 'number'
            ? scale >= 1
            : typeof delta === 'number'
              ? delta >= 0
              : null;
        if (!isZoomed.value && isPinchOut) {
          applyZoomAtClientY(originY);
        } else if (isZoomed.value && isPinchOut === false) {
          resetZoom();
        }
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
  setZoomingFor();
  if (zoomAnimationTimer) {
    clearTimeout(zoomAnimationTimer);
    zoomAnimationTimer = null;
  }
  setTimeout(() => {
    zoomScale.value = ZOOM_LEVELS[0];
    zoomTopPx.value = 0;
    focusedHourKey.value = null;
    isZoomAnimating.value = false;
  }, 300);
};

const getContentMetrics = () => {
  if (!stageRef.value) {
    return null;
  }
  const rect = stageRef.value.getBoundingClientRect();
  if (rect.height <= 0) {
    return null;
  }
  const styles = window.getComputedStyle(stageRef.value);
  const paddingTop = parseFloat(styles.paddingTop || '0');
  const paddingBottom = parseFloat(styles.paddingBottom || '0');
  const contentHeight = Math.max(rect.height - paddingTop - paddingBottom, 1);
  return { rect, paddingTop, paddingBottom, contentHeight };
};

const computeTopPxFromClientY = (clientY, scale) => {
  if (!stageRef.value || clientY == null) {
    return 0;
  }
  const metrics = getContentMetrics();
  if (!metrics) {
    return 0;
  }
  const { rect, paddingTop, contentHeight } = metrics;
  const y = clamp(clientY - rect.top - paddingTop, 0, contentHeight);
  const ratio = y / contentHeight;

  // The point at this ratio will expand to: ratio * (scale * contentHeight)
  // We want it to stay at viewport position y, so:
  // ratio * (scale * contentHeight) + top = y
  // Therefore: top = y - ratio * scale * contentHeight
  return y - ratio * scale * contentHeight;
};

const clampTopToBounds = () => {
  if (!stageRef.value) {
    return;
  }
  if (isZoomAnimating.value) {
    return;
  }
  const metrics = getContentMetrics();
  if (!metrics) {
    return;
  }
  const { contentHeight } = metrics;
  const scaledContentHeight = zoomScale.value * contentHeight;
  const viewportHeight = contentHeight;
  const minTop = -(scaledContentHeight - viewportHeight);
  zoomTopPx.value = clamp(zoomTopPx.value, minTop, 0);
};

const applyZoomAtClientY = async (clientY) => {
  console.log('applyZoomAtClientY', clientY);
  setZoomingFor();
  if (zoomAnimationTimer) {
    clearTimeout(zoomAnimationTimer);
    zoomAnimationTimer = null;
  }
  isZoomAnimating.value = true;
  await nextTick();
  setTimeout(() => {
    requestAnimationFrame(() => {
      selectedId.value = null;
      const targetScale = ZOOM_LEVELS[1];
      const targetTop = computeTopPxFromClientY(clientY, targetScale);
      zoomScale.value = targetScale;
      zoomTopPx.value = targetTop;
      focusedHourKey.value = null;
      zoomAnimationTimer = setTimeout(() => {
        isZoomAnimating.value = false;
        clampTopToBounds();
        zoomAnimationTimer = null;
      }, 350);
    });
  }, 300);
};

const handleStageClick = (event) => {
  if (isZoomed.value) {
    resetZoom();
    return;
  }
  applyZoomAtClientY(event?.clientY);
};

const handleSelect = (payload) => {
  if (!stageRef.value) {
    return;
  }
  if (payload && typeof payload === 'object' && payload.ratio != null) {
    const metrics = getContentMetrics();
    if (!metrics) {
      return;
    }
    const ratio = clamp(payload.ratio, 0, 1);
    const { rect, paddingTop, contentHeight } = metrics;
    const clientY = rect.top + paddingTop + ratio * contentHeight;
    applyZoomAtClientY(clientY);
    return;
  }
  applyZoomAtClientY(payload);
};

const zoomStyle = computed(() => ({
  height: `${zoomScale.value * 100}%`,
  top: `${zoomTopPx.value}px`,
}));

const zoomTransitionStyle = computed(() =>
  isScrolling.value
    ? { transition: 'none' }
    : {
        transitionProperty: 'transform, height, top',
        transitionDuration: '800ms',
        transitionTimingFunction: 'ease-out',
      },
);

const isZoomed = computed(() => zoomScale.value > 1.01);
watch(isZoomed, (value) => {
  setZoomed(value);
});

const handleWheel = (event) => {
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
  zoomTopPx.value -= event.deltaY;
};
</script>

<style scoped>
.timeline-stage {
  position: relative;
  touch-action: none;
  overscroll-behavior: none;
}

.timeline-zoom {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: 50% 0%;
  will-change: transform, height, top;
}
</style>
