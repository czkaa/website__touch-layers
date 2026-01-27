<template>
  <div :key="hour.id" class="hour-block z-50 flex-1 sticky top-0">
    <div
      :class="[hour.dateLabel ? 'w-full' : 'w-10']"
      class="h-[2px] bg-primary absolute bottom-0 right-0 rounded-full"
    ></div>

    <div
      class="w-10 h-[2px] bg-primary absolute bottom-0 left-0 rounded-full"
    ></div>

    <label class="absolute bottom-0 text-primary z-50">
      <span v-if="hour.dateLabel" class="text-md">
        {{ hour.dateLabel }}
      </span>
      <span v-else>{{ hour.label }}</span>
    </label>

    <div
      v-if="showSubdivisions"
      v-for="minute in minuteSteps"
      :key="minute"
      class="minute-block"
      :style="{ top: `${(minute / 60) * 100}%` }"
    ></div>
  </div>
</template>

<script setup>
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

const minuteSteps = [6, 12, 18, 24, 30, 36, 42, 48, 54];
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

.minute-block {
  position: absolute;
  right: 0;
  width: 2rem;
  height: 1px;
  background: var(--color-primary);
}
</style>
