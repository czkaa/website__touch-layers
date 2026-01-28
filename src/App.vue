<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component
        :is="Component"
        :key="route.path"
        class="max-w-[66vh] mx-auto min-h-frame-h max-h-full h-fit bg-secondary text-primary"
      />
    </transition>
  </router-view>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ref } from 'vue';

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
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.3s ease-out;
}
.slide-up-leave-active {
  transition: all 0.3s ease-in;
}
.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
