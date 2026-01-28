<template>
  <header class="w-full flex justify-between items-center mb-sm px-sm pt-sm">
    <h1
      class="w-full max-w-[66vh] mx-auto absolute top-0 left-1/2 -translate-x-1/2"
    >
      <span class="hidden">Your presence leaves traces</span>
      <img src="/title.svg" class="mr-7 ml-20 blur-custom" />
    </h1>

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

const showOverlay = ref(false);
</script>
