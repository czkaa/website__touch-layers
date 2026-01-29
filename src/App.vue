<template>
  <SnippetsTitle class="fixed max-w-custom mx-auto left-1/2 -translate-x-1/2" />

  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component
        :is="Component"
        :key="route.path"
        class="max-w-custom mx-auto min-h-frame-h max-h-full h-fit bg-secondary text-primary"
      />
    </transition>
  </router-view>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<style>
html,
body {
  @apply text-root-desktop md:text-root-mobile lg:text-root-screen [font-weight:300] bg-secondary;
  color: var(--color-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.5s ease-out;
}
.slide-up-leave-active {
  transition: all 0.5s ease-in;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%) translateX(-50%);
}
</style>
