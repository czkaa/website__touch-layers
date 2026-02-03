<template>
  <div
    class="timeline-stage w-full h-full overflow-hidden"
    :class="{ 'is-zoomed': isZoomed }"
    ref="stageRef"
    @click.capture="handleStageClick"
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
      class="absolute top-1/2 left-0.5 -translate-y-1/2 w-11 h-11 p-xs -ml-xs"
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

const ZOOM_LEVELS = [1, 100];
const ZOOM_RESET_DELAY = 1000 * 60 * 1; // 1 minute

const selectedId = ref(null);
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

// Track if we're on iOS
const isIOS = ref(false);

const { setZoomingFor, setZoomed } = useZoomState();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Momentum tracking
const velocity = ref(0);

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

    // Decay velocity - slightly faster decay on iOS for better feel
    velocity.value *= isIOS.value ? 0.93 : 0.95;

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
  }, ZOOM_RESET_DELAY);
};

const clearScreenZoomReset = () => {
  if (zoomResetTimer) {
    clearTimeout(zoomResetTimer);
    zoomResetTimer = null;
  }
};

// Separate wheel handler to attach with proper options
const wheelHandler = (event) => {
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

  setTimeout(() => {
    isDragging.value = false;
  }, 50);
};

// Touch event handlers for iOS compatibility
let touchStartY = 0;
let touchStartTime = 0;
let lastTouchY = 0;
let lastTouchTime = 0;
let touchMoved = false;

const handleTouchStart = (event) => {
  if (!isZoomed.value) return;

  stopMomentum();
  isDragging.value = true;
  touchMoved = false;

  const touch = event.touches[0];
  touchStartY = touch.clientY;
  touchStartTime = Date.now();
  lastTouchY = touch.clientY;
  lastTouchTime = touchStartTime;

  velocity.value = 0;
};

const handleTouchMove = (event) => {
  if (!isZoomed.value || !isDragging.value) return;

  // Prevent default to stop page scrolling when zoomed
  event.preventDefault();
  touchMoved = true;

  const touch = event.touches[0];
  const currentY = touch.clientY;
  const currentTime = Date.now();

  const deltaY = currentY - lastTouchY;

  // Apply movement with sensitivity multiplier
  zoomTopPx.value += deltaY * 1.5;

  // Calculate velocity for momentum
  const timeDelta = currentTime - lastTouchTime;
  if (timeDelta > 0) {
    velocity.value = (deltaY / timeDelta) * 16; // Normalize to ~60fps
  }

  lastTouchY = currentY;
  lastTouchTime = currentTime;

  clampTopToBoundsImmediate();
};

const handleTouchEnd = (event) => {
  if (!isZoomed.value) return;

  // Apply momentum if there's sufficient velocity
  if (Math.abs(velocity.value) > 0.5) {
    applyMomentum();
  } else {
    velocity.value = 0;
    isDragging.value = false;
  }

  // Reset tracking
  lastTouchY = 0;
  lastTouchTime = 0;
};

const initGestures = (el) => {
  // Detect iOS
  isIOS.value =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Add wheel listener with passive: false for proper prevention
  el.addEventListener('wheel', wheelHandler, { passive: false });

  // Add touch listeners with passive: false for iOS
  // This is critical for newer iOS versions
  el.addEventListener('touchstart', handleTouchStart, { passive: true });
  el.addEventListener('touchmove', handleTouchMove, { passive: false });
  el.addEventListener('touchend', handleTouchEnd, { passive: true });
  el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  // Use gesture library primarily for pinch zoom
  gestureInstance.value = new Gesture(
    el,
    {
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
      pinch: {
        threshold: 0.1,
        // Prevent pinch from interfering with native gestures on iOS
        rubberband: false,
      },
    },
  );
};

const cleanupGestures = () => {
  if (stageRef.value) {
    stageRef.value.removeEventListener('wheel', wheelHandler);
    stageRef.value.removeEventListener('touchstart', handleTouchStart);
    stageRef.value.removeEventListener('touchmove', handleTouchMove);
    stageRef.value.removeEventListener('touchend', handleTouchEnd);
    stageRef.value.removeEventListener('touchcancel', handleTouchEnd);
  }

  if (gestureInstance.value) {
    gestureInstance.value.destroy();
    gestureInstance.value = null;
  }
};

onBeforeUnmount(() => {
  stopMomentum();
  cleanupGestures();
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
  // Don't trigger zoom on click if we were dragging/scrolling
  if (touchMoved) {
    touchMoved = false;
    return;
  }

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

const requestZoom = () => {
  zoomRequest.value += 1;
};

defineExpose({ requestZoom });

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
</script>

<style scoped>
.timeline-stage {
  position: relative;
  /* More specific touch-action for iOS */
  touch-action: pan-x pinch-zoom;
  overscroll-behavior: contain;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  /* Prevent iOS bounce/rubber-banding */
  -webkit-overflow-scrolling: auto;
}

/* When zoomed, we handle all touch ourselves */
.timeline-stage.is-zoomed {
  touch-action: none;
  overflow: hidden;
}

.timeline-zoom {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: 50% 0%;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* Improve iOS rendering */
  -webkit-transform: translateZ(0);
}
</style>
