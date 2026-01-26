<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component
        :is="Component"
        :key="route.path"
        class="min-h-frame-h h-fit bg-secondary text-primary"
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
  @apply text-root-desktop md:text-root-mobile [font-weight:300];
  background: var(--color-secondary);
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
</style>
