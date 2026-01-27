<template>
  <div
    class="no-visit absolute transition-[height] duration-200 linear"
    :style="style"
  >
    <div
      class="absolute left-[0] w-1.5 h-full bg-pole rounded-b-[10rem] ml-5 -mt-1.5"
    ></div>
    <div
      class="absolute right-[0] w-1.5 h-full bg-pole rounded-b-[10rem] mr-1.5 -mt-1.5"
    ></div>

    <div
      class="absolute -top-depth left-[calc(var(--depth)*var(--side-depth-multiplier))] w-1.5 h-full bg-pole rounded-b-[10rem] ml-1.5 mt-1.5"
    ></div>
    <div
      class="absolute -top-depth right-[calc(var(--depth)/-1*var(--side-depth-multiplier))] w-1.5 h-full bg-pole rounded-b-[10rem] mr-5 mt-1.5"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  style: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.no-visit {
  position: absolute;
}

.no-visit div::after {
  content: '';
  position: absolute;
  width: 100%;
  aspect-ratio: 1.8;
  border-radius: 100%;
  top: -1px;
  left: 0;
  background: linear-gradient(
    90deg,
    rgb(77, 77, 77) 0%,
    rgb(59, 59, 59) 50%,
    rgb(69, 69, 69) 100%
  );
}
</style>
