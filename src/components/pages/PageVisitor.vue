<template>
  <main class="w-frame-w h-frame-h overflow-hidden">
    <TimelineStage :highlight-visit-id="currentId" />

    <transition name="slide-up">
      <LayoutOverlayFingerprint
        v-if="showOverlayFingerprint"
        :current-id="currentId"
      />
    </transition>

    <transition name="slide-up">
      <LayoutOverlayInfo v-if="showOverlayInfo" :current-id="currentId" />
    </transition>

    <button
      class="fixed top-xs right-outer-2 bg-primary text-secondary w-16 h-16 rounded-full flex flex-col justify-center items-center text-[90px] p-xs transition-transform duration-300 blur-custom z-50"
      :class="{ 'rotate-45': showOverlayInfo }"
      @click="showOverlayInfo = !showOverlayInfo"
    >
      <img src="/plus.svg" class="w-full h-full" />
    </button>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import TimelineStage from '../timeline/TimelineStage.vue';
import { useVisitorSocket } from '../timeline/store/visitorSocket';
import LayoutOverlayFingerprint from '../layout/LayoutOverlayFingerprint.vue';
import { useZoomState } from '../timeline/store/zoomState';

const { visitors, status, now, connect, sendEnter, sendLeave, getSessionId } =
  useVisitorSocket();

const currentId = ref('');
const showOverlayInfo = ref(false);
const { isZoomed } = useZoomState();
const showOverlayFingerprint = computed(() => isZoomed.value);
const isActive = ref(true);

onMounted(() => {
  connect();
  const entered = sendEnter();
  currentId.value = entered?.id || getSessionId() || '';

  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      if (isActive.value) {
        isActive.value = false;
        sendLeave();
      }
      return;
    }
    if (!isActive.value) {
      isActive.value = true;
      connect();
      const reentered = sendEnter();
      currentId.value = reentered?.id || getSessionId() || '';
    }
  };

  const handlePageHide = () => {
    if (isActive.value) {
      isActive.value = false;
      sendLeave();
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pagehide', handlePageHide);

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pagehide', handlePageHide);
  });
});

onBeforeUnmount(() => {
  if (isActive.value) {
    sendLeave();
  }
});
</script>
