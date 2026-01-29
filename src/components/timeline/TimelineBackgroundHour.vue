<template>
  <div :key="hour.id" class="hour-block flex-1 p-1 font-geist-mono relative">
    <div
      v-if="!hour.dateLabel"
      class="absolute w-full left-0 h-1.5 bottom-0 flex justify-between before:content-[''] before:absolute before:left-outer before:w-1.5 before:h-1.5 before:bg-primary before:rotate-45 after:content-[''] after:absolute after:right-outer after:w-1.5 after:h-1.5 after:bg-primary after:rotate-45 after:-translate-x-full before:translate-x-full translate-y-1/2"
      :class="{ 'after:hidden': showSubdivisions }"
    ></div>

    <label class="absolute bottom-0 left-xs text-primary ml-outer pl-1">
      <span
        v-if="hour.dateLabel"
        class="inline-block text-[1.2rem] font-geist leading-none"
      >
        {{ hour.dateLabel }}
      </span>
      <span class="text-[max(0.5rem,11px)]" v-else>{{ hour.label }}</span>
    </label>

    <transition name="fade">
      <div
        class="absolute top-0 right-0 h-full flex flex-col justify-between items-end"
        v-if="showSubdivisions"
      >
        <div
          v-for="n in 60"
          class="relative w-full border-b border-primary -mt-px"
          :class="[
            n % 10 === 0
              ? 'w-outer-4 after:absolute after:top-[0.5px] after:right-outer-4 after:w-1.5 after:h-1.5 after:bg-primary after:rotate-45 after:-translate-y-1/2'
              : 'w-outer-2 ',
          ]"
        ></div>
      </div>
    </transition>
    <div
      v-if="showSubdivisions"
      class="absolute bottom-0 w-full border-b border-primary"
    />
    <div
      v-if="hour.dateLabel"
      class="absolute right-0 h-1 bottom-0 w-full bg-primary rounded-full translate-y-1/2"
    ></div>

    <TimeLineRandomHorizontal v-else class="absolute bottom-0 left-0" />
  </div>
</template>

<script setup>
import TimeLineRandomHorizontal from './TimeLineRandomHorizontal.vue';

const props = defineProps({
  hour: {
    type: Object,
    required: true,
  },
  showSubdivisions: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.hour-block {
  position: relative;
}

.hour-marker {
  position: absolute;
  left: 0;
  top: 0;
  height: 2px;
  background: var(--color-primary);
  width: 2rem;
}
</style>
