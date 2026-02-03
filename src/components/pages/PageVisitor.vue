<template>
  <main class="h-frame-h overflow-hidden relative">
    <TimelineStage ref="timelineStageRef" :highlight-visit-id="currentId" />

    <transition name="slide-up">
      <SnippetsFingerprint
        v-if="showOverlayFingerprint"
        :currentId="currentId"
      />
    </transition>

    <transition name="slide-up">
      <LayoutOverlayInfo
        v-if="showOverlayInfo && isOpenNow && !isInactive"
        :current-id="currentId"
      />
    </transition>

    <transition name="slide-up">
      <LayoutOverlayClosed
        v-if="!isOpenNow && !isInactive"
        :time-slots="timeSlots"
      />
    </transition>

    <transition name="slide-up">
      <LayoutOverlayInactive v-if="isInactive" @resume="resumeSession" />
    </transition>

    <transition name="fade">
      <button
        v-if="isOpenNow && !isInactive"
        class="absolute top-xs right-xs bg-highlight w-16 h-16 rounded-full flex flex-col justify-center items-center p-xs transition-transform duration-300 blur-custom z-50"
        :class="{ 'rotate-45': showOverlayInfo }"
        @click="showOverlayInfo = !showOverlayInfo"
      >
        <img src="/plus.svg" class="w-full h-full" />
      </button>
    </transition>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import TimelineStage from '../timeline/TimelineStage.vue';
import { useVisitorSocket } from '../timeline/store/visitorSocket';
import { useZoomState } from '../timeline/store/zoomState';
import SnippetsFingerprint from '../snippets/SnippetsFingerprint.vue';
import LayoutOverlayClosed from '../layout/LayoutOverlayClosed.vue';
import LayoutOverlayInactive from '../layout/LayoutOverlayInactive.vue';
import LayoutOverlayInfo from '../layout/LayoutOverlayInfo.vue';
import { timeSlots } from '../timeline/store/visits';

const {
  visitors,
  status,
  now,
  connect,
  disconnect,
  sendEnter,
  sendLeave,
  getSessionId,
  clearSessionId,
} = useVisitorSocket();

const INACTIVITY_TIMEOUT = 1000 * 60 * 3;
const currentId = ref('');
const showOverlayInfo = ref(false);
const { isZoomed } = useZoomState();
const showOverlayFingerprint = computed(() => isZoomed.value);
const isInactive = ref(false);
let inactivityTimer = null;
const timelineStageRef = ref(null);
const hasOpeningTimes = computed(() => timeSlots.length > 0);
const isOpenNow = computed(() => {
  if (!hasOpeningTimes.value) {
    return false;
  }
  const nowValue = now.value;
  return timeSlots.some((slot) => {
    const start = new Date(slot.start).getTime();
    const end = new Date(slot.end).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return false;
    }
    return nowValue >= start && nowValue <= end;
  });
});

onMounted(() => {
  connect({ reconnect: false });
  const entered = sendEnter();
  currentId.value = entered?.id || getSessionId() || '';
  resetInactivityTimer();

  const handleActivity = () => {
    resetInactivityTimer();
  };

  window.addEventListener('mousemove', handleActivity, { passive: true });
  window.addEventListener('touchstart', handleActivity, { passive: true });
  window.addEventListener('keydown', handleActivity);
  window.addEventListener('scroll', handleActivity, { passive: true });

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', handleActivity);
    window.removeEventListener('touchstart', handleActivity);
    window.removeEventListener('keydown', handleActivity);
    window.removeEventListener('scroll', handleActivity);
  });
});

onBeforeUnmount(() => {
  clearInactivityTimer();
  if (!isInactive.value) {
    sendLeave();
  }
  disconnect();
});

watch(status, (nextStatus) => {
  if (isInactive.value) {
    return;
  }
  if (nextStatus === 'closed' || nextStatus === 'error') {
    setInactive();
  }
});

const clearInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
};

const resetInactivityTimer = () => {
  clearInactivityTimer();
  inactivityTimer = setTimeout(() => {
    setInactive();
  }, INACTIVITY_TIMEOUT);
};

const setInactive = () => {
  if (isInactive.value) {
    return;
  }
  isInactive.value = true;
  clearInactivityTimer();
  sendLeave();
  disconnect();
};

const resumeSession = () => {
  isInactive.value = false;
  connect({ reconnect: false });
  clearSessionId();
  const entered = sendEnter();
  currentId.value = entered?.id || getSessionId() || '';
  resetInactivityTimer();
  timelineStageRef.value?.requestZoom?.();
};
</script>
