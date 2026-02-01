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
        :zoom-request="zoomRequest"
        @select="handleSelect"
      />
    </div>
  </div>

  <transition name="fade">
    <button
      v-if="route.name === 'visitor' && isZoomed"
      class="fixed top-1/2 left-[100vw-66vh] -translate-y-1/2 w-12 h-12 p-xs -ml-xs"
      @click.prevent="zoomRequest += 1"
    >
      <span class="w-full h-full inline-block bg-highlight rounded-full"></span>
    </button>
  </transition>
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
import { timeSlots as defaultTimeSlots } from './store/visits';
import { useZoomState } from './store/zoomState';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
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
const isDragging = ref(false);
const isZoomAnimating = ref(false);
const gestureInstance = ref(null);
let zoomAnimationTimer = null;
let momentumRAF = null;
const zoomRequest = ref(0);
let zoomResetTimer = null;

const { setZoomingFor, setZoomed } = useZoomState();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Momentum tracking
const velocity = ref(0);
const lastMoveTime = ref(0);
const lastPosition = ref(0);

const applyMomentum = () => {
  if (momentumRAF) {
    cancelAnimationFrame(momentumRAF);
  }

  const tick = () => {
    if (Math.abs(velocity.value) < 0.3) {
      velocity.value = 0;
      isDragging.value = false;
      return;
    }

    zoomTopPx.value += velocity.value;
    clampTopToBoundsImmediate();

    // Decay velocity
    velocity.value *= 0.95;

    momentumRAF = requestAnimationFrame(tick);
  };

  momentumRAF = requestAnimationFrame(tick);
};

const stopMomentum = () => {
  if (momentumRAF) {
    cancelAnimationFrame(momentumRAF);
    momentumRAF = null;
  }
  velocity.value = 0;
};

const scheduleScreenZoomReset = () => {
  if (route.name !== 'screen') {
    return;
  }
  if (zoomResetTimer) {
    clearTimeout(zoomResetTimer);
  }
  zoomResetTimer = setTimeout(() => {
    if (isZoomed.value) {
      resetZoom();
    }
  }, 20000);
};

const clearScreenZoomReset = () => {
  if (zoomResetTimer) {
    clearTimeout(zoomResetTimer);
    zoomResetTimer = null;
  }
};

const initGestures = (el) => {
  gestureInstance.value = new Gesture(
    el,
    {
      onDrag: (state) => {
        if (!isZoomed.value) {
          return;
        }

        state.event?.preventDefault?.();

        // Stop any ongoing momentum
        if (state.first) {
          stopMomentum();
          isDragging.value = true;
        }

        const deltaY = state.delta?.[1] ?? 0;
        const movement = state.movement?.[1] ?? 0;

        // Apply movement with HIGH sensitivity multiplier
        zoomTopPx.value += deltaY * 3; // Increased from 1.5 to 3

        // Track velocity for momentum
        const now = Date.now();
        if (lastMoveTime.value && now !== lastMoveTime.value) {
          const timeDelta = now - lastMoveTime.value;
          const positionDelta = movement - lastPosition.value;
          velocity.value = (positionDelta / timeDelta) * 19;
        }
        lastMoveTime.value = now;
        lastPosition.value = movement;

        // Clamp immediately during drag
        clampTopToBoundsImmediate();

        // Apply momentum when drag ends
        if (state.last) {
          if (Math.abs(velocity.value) > 1) {
            applyMomentum();
          } else {
            velocity.value = 0;
            isDragging.value = false;
          }
          lastMoveTime.value = 0;
          lastPosition.value = 0;
        }
      },
      onPinch: (state) => {
        if (!state?.first) {
          return;
        }
        state.event?.preventDefault?.();

        stopMomentum();

        const originY = state.origin?.[1];
        const movement = state.movement?.[0] ?? 0;

        if (!isZoomed.value && movement > 5) {
          applyZoomAtClientY(originY);
        } else if (isZoomed.value && movement < -5) {
          resetZoom();
        }
      },
    },
    {
      eventOptions: { passive: false },
      drag: {
        filterTaps: true,
        pointer: { touch: true },
        threshold: 3, // Lower threshold (was 5)
      },
      pinch: {
        threshold: 0.1,
      },
    },
  );
};

onBeforeUnmount(() => {
  stopMomentum();
  if (gestureInstance.value) {
    gestureInstance.value.destroy();
    gestureInstance.value = null;
  }
  if (zoomAnimationTimer) {
    clearTimeout(zoomAnimationTimer);
    zoomAnimationTimer = null;
  }
  clearScreenZoomReset();
});

onMounted(() => {
  if (!stageRef.value) {
    return;
  }
  initGestures(stageRef.value);
  if (route.name === 'visitor' && props.highlightVisitId) {
    zoomRequest.value += 1;
  }
});

const resetZoom = () => {
  setZoomingFor();
  stopMomentum();
  clearScreenZoomReset();

  if (zoomAnimationTimer) {
    clearTimeout(zoomAnimationTimer);
    zoomAnimationTimer = null;
  }
  isZoomAnimating.value = true;

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

  return y - ratio * scale * contentHeight;
};

const clampTopToBoundsImmediate = () => {
  if (!stageRef.value) {
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

  const oldValue = zoomTopPx.value;
  zoomTopPx.value = clamp(zoomTopPx.value, minTop, 0);

  // Stop momentum if we hit bounds
  if (oldValue !== zoomTopPx.value) {
    stopMomentum();
  }
};

const clampTopToBounds = () => {
  if (isZoomAnimating.value) {
    return;
  }
  clampTopToBoundsImmediate();
};

const applyZoomAtClientY = async (clientY) => {
  console.log('applyZoomAtClientY', clientY);
  setZoomingFor();
  stopMomentum();
  scheduleScreenZoomReset();

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
      }, 500);
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
  transform: `translateY(${zoomTopPx.value}px)`,
}));

const zoomTransitionStyle = computed(() =>
  isDragging.value
    ? {}
    : {
        transitionProperty: 'transform, height',
        transitionDuration: '500ms',
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
);

const isZoomed = computed(() => zoomScale.value > 1.01);

watch(isZoomed, (value) => {
  setZoomed(value);
});

watch(
  () => props.highlightVisitId,
  (value) => {
    if (route.name !== 'visitor' || !value) {
      return;
    }
    zoomRequest.value += 1;
  },
);

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
  stopMomentum();
  isDragging.value = true;

  zoomTopPx.value -= event.deltaY;
  clampTopToBoundsImmediate();

  // Stop dragging state after a brief moment
  setTimeout(() => {
    isDragging.value = false;
  }, 50);
};
</script>

<style scoped>
.timeline-stage {
  position: relative;
  touch-action: none;
  overscroll-behavior: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.timeline-zoom {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: 50% 0%;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
</style>
