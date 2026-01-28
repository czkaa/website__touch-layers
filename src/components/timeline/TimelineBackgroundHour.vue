<template>
  <div :key="hour.id" class="hour-block flex-1 p-1 font-geist-mono">
    <div
      :class="[hour.dateLabel ? 'h-[6px] blur-[2px]' : 'h-[2px]']"
      class="absolute bottom-0 right-0 w-full bg-primary rounded-full"
    ></div>

    <div
      class="absolute w-full h-full left-0 flex justify-between before:content-[''] before:absolute before:-top-2 before:left-1.5 before:w-1.5 before:h-1.5 before:bg-primary before:rotate-45 after:content-[''] after:absolute after:-top-2 after:right-1.5 after:w-1.5 after:h-1.5 after:bg-primary after:rotate-45 px-2"
    >
      <div v-for="n in 6" :key="n" class="h-full w-[1px] bg-primary"></div>
    </div>

    <label class="absolute bottom-0 left-3 text-primary">
      <span v-if="hour.dateLabel" class="text-[1.5rem]">
        {{ hour.dateLabel }}
      </span>
      <span class="text-[0.9rem]" v-else>{{ hour.label }}</span>
    </label>

    <div
      class="absolute w-16 -right-[2%] h-full flex flex-col justify-around"
      v-if="showSubdivisions"
    >
      <div v-for="n in 10" class="w-full h-[1px] bg-primary"></div>
    </div>
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
