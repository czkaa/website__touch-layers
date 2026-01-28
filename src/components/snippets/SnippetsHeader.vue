<template>
  <header
    class="absolute top-0 left-0 max-w-custom flex justify-between items-center mb-sm px-sm pt-sm e"
  >
    <SnippetsTitle />

    <transition name="slide-up">
      <LayoutOverlay v-if="showOverlay" />
    </transition>

    <button
      class="fixed top-sm right-sm bg-primary text-secondary rounded-full w-16 h-16 flex flex-col justify-center items-center text-[90px] pb-5 transition-transform duration-300 blur-custom z-50"
      :class="{ 'rotate-45': showOverlay }"
      @click="showOverlay = !showOverlay"
    >
      +
    </button>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import LayoutOverlay from '../layout/LayoutOverlay.vue';
import SnippetsTitle from './SnippetsTitle.vue';

const showOverlay = ref(false);
</script>
